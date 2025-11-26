<?php

namespace App\Http\Controllers;

use App\Mail\InvoiceMail;
use App\Models\Invoice;
use App\Models\IvehaInvoice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Illuminate\Validation\Rule;

class InvoiceController extends Controller
{
    /**
     * Alle Rechnungen anzeigen (Index-Seite).
     */
    public function index()
    {
        $invoices = Invoice::with('company')->orderBy('created_at', 'desc')->get();

        return Inertia::render('Invoice/Index', [
            'invoices' => $invoices
        ]);
    }

    /**
     * Einzelne Rechnung anzeigen.
     */
    public function show($id)
    {
        $invoice = Invoice::with(['company', 'performances', 'assets'])->findOrFail($id);

        return Inertia::render('Invoice/Show', [
            'invoice' => $invoice
        ]);
    }

    public function uploadInvoice(Request $request)
    {
        // Validierung der Datei und Order-ID
        $request->validate([
            'pdf' => 'required|file|mimes:pdf|max:2048',
            'order_number' => 'required|integer',
        ]);

        // Stelle sicher, dass die Invoice existiert
        $invoice = Invoice::findOrFail($request->order_number);

        // Erstelle den Dateipfad mit einer eindeutigen Rechnungsnummer
        $fileName = "invoice-{$invoice->year}-{$invoice->id}.pdf";
        $path = "invoices/{$invoice->year}-{$invoice->id}/{$fileName}";

        // Speichere die Datei im Storage
        Storage::disk('local')->put($path, file_get_contents($request->file('pdf')));

        // E-Mail mit PDF an die hinterlegte Company-Mail senden
        Mail::to($invoice->company->email)->send(new InvoiceMail($invoice, storage_path("app/{$path}")));

        return response()->json(['message' => 'Rechnung erfolgreich gespeichert und gesendet!']);
    }

    /**
     * Neue Rechnung speichern.
     */
    public function store(Request $request)
    {
        $request->validate([
            'project_number' => 'required|string',
            'company_id' => 'required|exists:companies,id',
            'construction' => 'required|string',
            'address' => 'required|string',
            'postal' => 'required|string',
            'city' => 'required|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $invoice = Invoice::create($request->all());

        return redirect()->route('invoice.index')->with('success', 'Rechnung wurde erstellt.');
    }

    public function update(Request $request, Invoice $invoice)
    {
        $data = $request->validate([
            'status' => ['required', Rule::in([
                'in_progress',
                'waiting_for_invoice',
                'invoice_sent',
                'completed',
                'canceled',
            ])],
        ]);

        $invoice->update($data);

        return redirect()->back()->with('success', 'Status wurde aktualisiert.');
    }

    public function issueInvoice(Invoice $invoice)
    {
        if ($invoice->issued_at) {
            return response()->json([
                'success' => false,
                'message' => 'Rechnung wurde bereits ausgestellt.'
            ], 400);
        }

        $invoice->update([
            'issued_at' => now()
        ]);

        if (request()->ajax() || request()->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Rechnung erfolgreich ausgestellt.',
                'invoice' => $invoice->fresh()
            ]);
        }

        return redirect()->back()->with('success', 'Rechnung erfolgreich ausgestellt.');
    }

    /**
     * Iveha Rechnungen Index-Seite anzeigen.
     */
    public function ivehaIndex()
    {
        // Sortierung nach Rechnungsnummer (aufsteigend)
        // Extrahiere die Nummer aus der Rechnungsnummer für die Sortierung
        $invoices = IvehaInvoice::all()->sortBy(function($invoice) {
            // Extrahiere die Nummer aus der Rechnungsnummer (z.B. "148" aus "148" oder "RG2024-148")
            return (int) preg_replace('/\D/', '', $invoice->invoice_number);
        })->values();
        
        $totalAmount = IvehaInvoice::sum('invoice_amount');
        
        return Inertia::render('IvehaInvoice/Index', [
            'invoices' => $invoices,
            'totalAmount' => $totalAmount
        ]);
    }

    /**
     * Iveha Rechnung speichern.
     */
    public function ivehaStore(Request $request)
    {
        $validated = $request->validate([
            'invoice_date' => 'required|date',
            'invoice_number' => 'required|string',
            'project_number' => 'required|string',
            'construction_address' => 'required|string',
            'description' => 'required|string',
            'qm' => 'required|numeric|min:0',
            'persons' => 'required|integer|min:1',
            'hours' => 'required|numeric|min:0',
            'calendar_week' => 'required|string',
            'execution_day' => 'required|string',
            'total_price' => 'required|numeric',
            'total_sum' => 'required|numeric',
            'skonto' => 'required|numeric',
            'invoice_amount' => 'required|numeric',
        ]);

        $invoice = IvehaInvoice::create($validated);

        return redirect()->route('iveha-invoices.index')->with('success', 'Rechnung erfolgreich ausgestellt.');
    }

    /**
     * Iveha Rechnung löschen.
     */
    public function ivehaDestroy($id)
    {
        $invoice = IvehaInvoice::findOrFail($id);
        $invoice->delete();

        return redirect()->route('iveha-invoices.index')->with('success', 'Rechnung wurde erfolgreich gelöscht.');
    }

    /**
     * Iveha Rechnung Daten für Download zurückgeben.
     */
    public function ivehaShow($id)
    {
        $invoice = IvehaInvoice::findOrFail($id);
        return response()->json($invoice);
    }

}
