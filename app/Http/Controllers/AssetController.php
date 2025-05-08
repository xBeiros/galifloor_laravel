<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use App\Models\Asset;
use Illuminate\Support\Facades\Storage;

class AssetController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:10240', // Max 10MB
            'invoice_id' => 'required|exists:invoices,id'
        ]);

        $file = $request->file('file');
        $filePath = $file->store('invoices', 'public');

        $asset = Asset::create([
            'invoice_id' => $request->invoice_id,
            'file_path' => $filePath,
            'file_name' => $file->getClientOriginalName()
        ]);

        return redirect()->back()->with('success', 'Datei erfolgreich hochgeladen.');
    }

    public function destroy($id): RedirectResponse
    {
        $asset = Asset::findOrFail($id);

        // Datei aus dem Storage löschen
        Storage::disk('public')->delete($asset->file_path);

        // Eintrag aus der Datenbank löschen
        $asset->delete();

        return redirect()->back()->with('success', 'Datei erfolgreich gelöscht.');
    }
}
