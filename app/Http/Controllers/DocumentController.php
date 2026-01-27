<?php

namespace App\Http\Controllers;

use App\Models\Document;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DocumentController extends Controller
{
    public function index()
    {
        $documents = Document::orderBy('category')->orderBy('name')->get();
        
        // Gruppiere Dokumente nach Kategorien
        $groupedDocuments = $documents->groupBy('category');
        
        return Inertia::render('Documents/Index', [
            'documents' => $documents,
            'groupedDocuments' => $groupedDocuments
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'description' => 'nullable|string',
            'expiry_date' => 'nullable|date',
            'file' => 'required|file|max:10240', // Max 10MB
        ]);

        $file = $request->file('file');
        $folder = "documents/" . Str::slug($validated['category']);
        $filename = time() . '_' . $file->getClientOriginalName();
        $filePath = $file->storeAs($folder, $filename, 'public');

        $document = Document::create([
            'name' => $validated['name'],
            'category' => $validated['category'],
            'original_name' => $file->getClientOriginalName(),
            'file_path' => $filePath,
            'description' => $validated['description'] ?? null,
        ]);

        return redirect()->route('documents.index')->with('success', 'Dokument erfolgreich hochgeladen');
    }

    public function update(Request $request, $id)
    {
        $document = Document::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'description' => 'nullable|string',
            'expiry_date' => 'nullable|date',
            'file' => 'nullable|file|max:10240',
        ]);

        // Wenn eine neue Datei hochgeladen wird
        if ($request->hasFile('file')) {
            // Alte Datei löschen
            Storage::disk('public')->delete($document->file_path);
            
            // Neue Datei speichern
            $folder = "documents/" . Str::slug($validated['category']);
            $file = $request->file('file');
            $filename = time() . '_' . $file->getClientOriginalName();
            $filePath = $file->storeAs($folder, $filename, 'public');
            
            $validated['original_name'] = $file->getClientOriginalName();
            $validated['file_path'] = $filePath;
        }

        $document->update($validated);

        return redirect()->route('documents.index')->with('success', 'Dokument erfolgreich aktualisiert');
    }

    public function destroy($id)
    {
        $document = Document::findOrFail($id);
        
        // Datei löschen
        Storage::disk('public')->delete($document->file_path);
        
        $document->delete();

        return redirect()->route('documents.index')->with('success', 'Dokument erfolgreich gelöscht');
    }

    public function download($id)
    {
        $document = Document::findOrFail($id);
        
        $filePath = storage_path('app/public/' . $document->file_path);
        
        if (!file_exists($filePath)) {
            abort(404, 'Datei nicht gefunden');
        }

        return response()->download($filePath, $document->original_name);
    }
}
