<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Charge;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\RedirectResponse;

class ChargeController extends Controller
{
    /**
     * Belastungsanzeige speichern.
     */
    public function store(Request $request)
    {
        $request->validate([
            'description' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'date' => 'required|date',
            'invoice_id' => 'required|exists:invoices,id',
            'file' => 'nullable|file|max:10240', // Max 10MB, optional
        ]);

        // Rechnung laden per ID
        $invoice = Invoice::findOrFail($request->invoice_id);

        $chargeData = [
            'invoice_id' => $invoice->id,
            'description' => $request->description,
            'amount' => $request->amount,
            'date' => $request->date,
        ];

        // Datei optional hochladen
        if ($request->hasFile('file')) {
            $folder = $invoice->year . '-' . $invoice->order_number;
            $file = $request->file('file');
            $filename = time() . '_' . $file->getClientOriginalName();
            $filePath = $file->storeAs($folder . '/charges', $filename, 'public');
            
            $chargeData['file_path'] = $filePath;
            $chargeData['file_name'] = $file->getClientOriginalName();
        }

        Charge::create($chargeData);

        return redirect()->back()->with('success', 'Belastungsanzeige erfolgreich hinzugefügt.');
    }

    /**
     * Belastungsanzeige löschen.
     */
    public function destroy($id): RedirectResponse
    {
        $charge = Charge::findOrFail($id);

        // Datei löschen, falls vorhanden
        if ($charge->file_path) {
            Storage::disk('public')->delete($charge->file_path);
        }

        // Datenbankeintrag löschen
        $charge->delete();

        return redirect()->back()->with('success', 'Belastungsanzeige erfolgreich gelöscht.');
    }
}
