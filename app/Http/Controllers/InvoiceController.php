<?php

namespace App\Http\Controllers;

use App\Mail\InvoiceMail;
use App\Models\Invoice;
use App\Models\IvehaInvoice;
use App\Models\OwnCompany;
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
        $ownCompany = OwnCompany::first();

        return Inertia::render('Invoice/Show', [
            'invoice' => $invoice,
            'ownCompany' => $ownCompany
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

    /**
     * Iveha Rechnung aktualisieren.
     */
    public function ivehaUpdate(Request $request, $id)
    {
        $invoice = IvehaInvoice::findOrFail($id);

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

        $invoice->update($validated);

        return redirect()->route('iveha-invoices.index')->with('success', 'Rechnung wurde erfolgreich aktualisiert.');
    }

    /**
     * Iveha Rechnung Check-Status umschalten.
     */
    public function ivehaToggleChecked($id)
    {
        $invoice = IvehaInvoice::findOrFail($id);
        $invoice->is_checked = !$invoice->is_checked;
        $invoice->save();

        if (request()->ajax() || request()->wantsJson()) {
            return response()->json([
                'success' => true,
                'is_checked' => $invoice->is_checked,
                'message' => $invoice->is_checked ? 'Rechnung als abgehakt markiert.' : 'Markierung entfernt.'
            ]);
        }

        return redirect()->route('iveha-invoices.index')->with('success', $invoice->is_checked ? 'Rechnung als abgehakt markiert.' : 'Markierung entfernt.');
    }

    /**
     * Generiert eine PDF/A-3-konforme E-Rechnung mit eingebettetem ZUGFeRD XML.
     * 
     * Diese Methode ruft einen externen Java Service (iText 7) auf, um
     * ein vollständig PDF/A-3-konformes Dokument zu erzeugen.
     * 
     * @param int $id Invoice ID
     * @return \Illuminate\Http\Response PDF/A-3 Byte-Stream
     */
    public function generateERechnung($id)
    {
        $invoice = Invoice::with(['company', 'performances'])->findOrFail($id);
        $ownCompany = OwnCompany::first();

        // Option 1: InvoiceData wird vom Frontend übermittelt
        if (request()->has('invoiceData') && request()->has('zugferdXML')) {
            $invoiceData = request()->input('invoiceData');
            $zugferdXML = request()->input('zugferdXML');
            
            // PDF/A-3 über Java Service generieren
            $pdfBytes = $this->generatePDFA3ViaJava($invoiceData, $zugferdXML);
        } else {
            // Option 2: Backend generiert InvoiceData selbst
            // (Hier müsste die buildInvoiceData Logik aus TypeScript nach PHP portiert werden)
            // Für jetzt: Frontend sollte InvoiceData mitsenden
            return response()->json([
                'error' => 'invoiceData und zugferdXML müssen übermittelt werden'
            ], 400);
        }

        if (!$pdfBytes) {
            return response()->json([
                'error' => 'PDF/A-3 Generierung fehlgeschlagen'
            ], 500);
        }

        $filename = sprintf(
            'RG-%s-%s-E-Rechnung.pdf',
            $invoice->year,
            $invoice->order_number
        );

        return response($pdfBytes)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
    }

    /**
     * Ruft den Java Service zur PDF/A-3 Generierung auf.
     * 
     * @param array $invoiceData InvoiceData als Array
     * @param string $zugferdXML ZUGFeRD XML String
     * @return string|null PDF/A-3 Byte-Stream oder null bei Fehler
     */
    private function generatePDFA3ViaJava(array $invoiceData, string $zugferdXML): ?string
    {
        // Option 1: Java Command direkt ausführen
        // Voraussetzung: Java JAR-Datei im Projekt
        $jarPath = base_path('java/pdfa3-generator.jar');
        
        if (file_exists($jarPath)) {
            $invoiceDataJson = json_encode($invoiceData);
            $zugferdXMLEscaped = escapeshellarg($zugferdXML);
            $invoiceDataEscaped = escapeshellarg($invoiceDataJson);
            
            $command = sprintf(
                'java -jar %s --invoiceData %s --zugferdXML %s',
                escapeshellarg($jarPath),
                $invoiceDataEscaped,
                $zugferdXMLEscaped
            );
            
            $pdfBytes = shell_exec($command);
            return $pdfBytes;
        }

        // Option 2: REST API zu Java Service
        // Voraussetzung: Java Service läuft auf localhost:8080
        $javaServiceUrl = env('PDFA3_JAVA_SERVICE_URL', 'http://localhost:8080/generate-pdfa3');
        
        try {
            $response = \Http::timeout(30)->post($javaServiceUrl, [
                'invoiceData' => $invoiceData,
                'zugferdXML' => $zugferdXML
            ]);
            
            if ($response->successful()) {
                return $response->body();
            }
        } catch (\Exception $e) {
            \Log::error('PDF/A-3 Generierung fehlgeschlagen: ' . $e->getMessage());
        }

        // Option 3: Fallback - PDF ohne PDF/A-3 (nicht empfohlen für Produktion)
        // Hier könnte eine PHP-basierte PDF-Generierung verwendet werden,
        // aber diese ist NICHT PDF/A-3 konform!
        \Log::warning('PDF/A-3 Generierung nicht verfügbar. Java Service erforderlich.');
        
        return null;
    }

    /**
     * Generiert XRechnung XML für öffentliche Auftraggeber.
     * 
     * @param int $id Invoice ID
     * @return \Illuminate\Http\Response XRechnung XML
     */
    public function generateXRechnung($id)
    {
        $invoice = Invoice::with(['company', 'performances'])->findOrFail($id);
        $ownCompany = OwnCompany::first();

        // InvoiceData vom Frontend oder Backend generieren
        if (request()->has('invoiceData')) {
            $invoiceData = request()->input('invoiceData');
        } else {
            // Backend müsste InvoiceData selbst generieren
            return response()->json([
                'error' => 'invoiceData muss übermittelt werden'
            ], 400);
        }

        // XRechnung XML generieren (kann auch im Frontend erfolgen)
        // Für jetzt: Frontend generiert XML und sendet es
        if (request()->has('xrechnungXML')) {
            $xrechnungXML = request()->input('xrechnungXML');
        } else {
            return response()->json([
                'error' => 'xrechnungXML muss übermittelt werden'
            ], 400);
        }

        $filename = sprintf(
            'RG-%s-%s-XRechnung.xml',
            $invoice->year,
            $invoice->order_number
        );

        return response($xrechnungXML, 200)
            ->header('Content-Type', 'application/xml; charset=UTF-8')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
    }
}
