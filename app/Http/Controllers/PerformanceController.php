<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Performance;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class PerformanceController extends Controller
{
    /**
     * Alle Leistungen für eine Rechnung abrufen.
     */
    public function index($invoiceId)
    {
        $performances = Performance::where('invoice_id', $invoiceId)->get();
        return Inertia::render('Invoice/Show', [
            'performances' => $performances
        ]);
    }


    /**
     * Neue Leistung hinzufügen.
     */
    public function store(Request $request, $invoiceId)
    {
        $invoice = Invoice::findOrFail($invoiceId);

        $request->validate([
            'performance' => 'required|string',
            'date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:date',
            'individual_dates' => 'nullable|array',
            'individual_dates.*' => 'date',
            'qm' => 'required|numeric',
            'price' => 'required|numeric',
            'flatrate' => 'boolean',
            'status' => 'in:no_change,date_change,canceled,modified',
            'multiple_days' => 'boolean',
            'individual_days' => 'boolean',
        ]);
        
        // Konvertiere qm zu Integer
        $qm = (int) $request->qm;

        // Formatiere Datum korrekt
        $formattedDate = Carbon::parse($request->date)->format('Y-m-d H:i:s');
        $formattedEndDate = $request->end_date ? Carbon::parse($request->end_date)->format('Y-m-d H:i:s') : null;
        
        // Individuelle Tage verarbeiten
        $individualDates = null;
        if ($request->has('individual_dates') && is_array($request->individual_dates) && count($request->individual_dates) > 0) {
            // Formatiere alle individuellen Daten
            $individualDates = array_map(function($date) {
                return Carbon::parse($date)->format('Y-m-d H:i:s');
            }, $request->individual_dates);
            // Sortiere die Daten chronologisch
            usort($individualDates, function($a, $b) {
                return strtotime($a) - strtotime($b);
            });
        }
        
        // Erstelle EINE Performance mit Start- und Enddatum oder individuellen Tagen
        $performance = $invoice->performances()->create([
            'performance' => $request->performance,
            'date' => $formattedDate,
            'end_date' => $formattedEndDate,
            'individual_dates' => $individualDates,
            'qm' => $qm,
            'price' => $request->price,
            'flatrate' => $request->flatrate ?? false,
            'status' => $request->status ?? 'no_change',
        ]);
        
        $performances = [$performance];

        // Aktualisiere Invoice start_date und end_date falls nötig
        $startDate = Carbon::parse($request->date)->startOfDay();
        
        // Bestimme das Enddatum: individuelle Tage, end_date oder startDate
        if ($individualDates && count($individualDates) > 0) {
            // Verwende das letzte individuelle Datum
            $finalEndDate = Carbon::parse(end($individualDates))->startOfDay();
        } else {
            $finalEndDate = $request->end_date ? Carbon::parse($request->end_date)->startOfDay() : $startDate;
        }
        
        if ($invoice->start_date === null || $startDate->lt(Carbon::parse($invoice->start_date))) {
            $invoice->start_date = $startDate->format('Y-m-d');
        }
        
        if ($invoice->end_date === null || $finalEndDate->gt(Carbon::parse($invoice->end_date))) {
            $invoice->end_date = $finalEndDate->format('Y-m-d');
        }
        $invoice->save();

        // Lade die Performance mit allen Beziehungen neu
        $performance->refresh();

        return response()->json([$performance], 201);
    }

    /**
     * Leistung stornieren.
     */
    public function cancel($id)
    {
        $performance = Performance::findOrFail($id);
        $performance->update(['status' => 'canceled']);

        return response()->json(['message' => 'Leistung wurde storniert'], 200);
    }

    /**
     * Leistung löschen.
     */
    public function destroy($id)
    {
        $performance = Performance::findOrFail($id);
        $performance->delete();

        return response()->json(['message' => 'Leistung wurde gelöscht'], 200);
    }

    /**
     * Leistungsdatum ändern.
     */
    public function updateDate(Request $request, $id)
    {
        $request->validate([
            'date_changed_to' => 'required|date',
            'status' => 'in:no_change,date_change,canceled,modified',
        ]);

        $performance = Performance::find($id);

        if (!$performance) {
            return response()->json(['message' => 'Performance nicht gefunden'], 404);
        }

        // Korrigiertes Datumsformat für MySQL
        $formattedDate = Carbon::parse($request->date_changed_to)->format('Y-m-d H:i:s');

        $performance->update([
            'date_changed_to' => $formattedDate,
            'status' => $request->status,
        ]);

        return response()->json($performance);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:no_change,date_change,canceled,modified',
        ]);

        $performance = Performance::find($id);

        if (!$performance) {
            return response()->json(['message' => 'Performance nicht gefunden'], 404);
        }

        $invoice = $performance->invoice;
        $newStatus = $request->status;

        // Wenn Status auf 'no_change' gesetzt wird (Wiederherstellung von 'canceled')
        // und die Rechnung bereits ausgestellt wurde und modified_after_issue true ist,
        // dann setze Status auf 'modified' statt 'no_change'
        if ($newStatus === 'no_change' && $invoice->issued_at !== null && $performance->modified_after_issue) {
            $newStatus = 'modified';
        }

        $performance->update(['status' => $newStatus]);

        return response()->json($performance->fresh());
    }

    /**
     * QM und Preis einer Leistung aktualisieren.
     */
    public function updateQmAndPrice(Request $request, $id)
    {
        $request->validate([
            'qm' => 'required|numeric|min:0',
            'price' => 'required|numeric|min:0',
            'flatrate' => 'boolean',
        ]);

        $performance = Performance::findOrFail($id);
        $invoice = $performance->invoice;

        // Prüfe, ob die Rechnung bereits ausgestellt wurde
        $modifiedAfterIssue = $invoice->issued_at !== null;

        // Bestimme den neuen Status
        // Wenn Rechnung bereits ausgestellt wurde, setze Status auf 'modified' und modified_after_issue auf true
        // Wenn nicht ausgestellt, behalte den aktuellen Status (außer 'canceled') und setze modified_after_issue auf false
        $newStatus = $performance->status;
        if ($modifiedAfterIssue && $performance->status !== 'canceled') {
            $newStatus = 'modified';
        }

        $updateData = [
            'qm' => (int) $request->qm,
            'price' => $request->price,
            'modified_after_issue' => $modifiedAfterIssue,
            'status' => $newStatus,
        ];

        // Flatrate nur aktualisieren, wenn es im Request vorhanden ist
        if ($request->has('flatrate')) {
            $updateData['flatrate'] = $request->boolean('flatrate');
        }

        $performance->update($updateData);

        return response()->json([
            'success' => true,
            'performance' => $performance->fresh(),
            'modified_after_issue' => $modifiedAfterIssue
        ]);
    }

}
