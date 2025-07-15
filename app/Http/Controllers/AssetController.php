<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Asset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\RedirectResponse;

class AssetController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:10240', // Max 10MB
            'invoice_id' => 'required|exists:invoices,id'
        ]);

        // Rechnung laden per ID
        $invoice = Invoice::findOrFail($request->invoice_id);

        // Zielordner: z. B. "2025-1"
        $folder = $invoice->year . '-' . $invoice->order_number;

        $file = $request->file('file');

        // Optional: Duplikate verhindern
        $filename = time() . '_' . $file->getClientOriginalName();

        // Datei speichern im public storage (storage/app/public/...)
        $filePath = $file->storeAs($folder, $filename, 'public');

        // Datenbankeintrag
        Asset::create([
            'invoice_id' => $invoice->id,
            'file_path' => $filePath, // z. B. "2025-1/datei.pdf"
            'file_name' => $file->getClientOriginalName(),
        ]);

        return redirect()->back()->with('success', 'Datei erfolgreich hochgeladen.');
    }

    public function destroy($id): RedirectResponse
    {
        $asset = Asset::findOrFail($id);

        // Optional: Zugriffsprüfung über Policy
        // if (auth()->user()->cannot('delete', $asset)) {
        //     abort(403);
        // }

        // Datei löschen
        Storage::disk('public')->delete($asset->file_path);

        // Datenbankeintrag löschen
        $asset->delete();

        return redirect()->back()->with('success', 'Datei erfolgreich gelöscht.');
    }
}
