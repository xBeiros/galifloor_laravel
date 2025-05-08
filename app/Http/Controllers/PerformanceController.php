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
        return Inertia::render('Invoice/[invoice]', [
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
            'qm' => 'required|integer',
            'price' => 'required|numeric',
            'flatrate' => 'boolean',
            'status' => 'in:no_change,date_change,canceled',
        ]);

        $performance = $invoice->performances()->create([
            'performance' => $request->performance,
            'date' => $request->date,
            'qm' => $request->qm,
            'price' => $request->price,
            'flatrate' => $request->flatrate ?? false,
            'status' => $request->status ?? 'no_change',
        ]);

        return response()->json($performance, 201);
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
            'status' => 'in:no_change,date_change,canceled',
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
            'status' => 'required|in:no_change,date_change,canceled',
        ]);

        $performance = Performance::find($id);

        if (!$performance) {
            return response()->json(['message' => 'Performance nicht gefunden'], 404);
        }

        $performance->update(['status' => $request->status]);

        return response()->json($performance);
    }

}
