<?php

namespace App\Http\Controllers;

use App\Mail\InvoiceMail;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

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

        return Inertia::render('Invoice/[invoice]', [
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
        ]);

        $invoice = Invoice::create($request->all());

        return redirect()->route('invoice.index')->with('success', 'Rechnung wurde erstellt.');
    }
}
