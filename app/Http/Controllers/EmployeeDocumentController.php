<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\EmployeeDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class EmployeeDocumentController extends Controller
{
    /**
     * Dokument für einen Mitarbeiter hochladen
     */
    public function store(Request $request, $employeeId)
    {
        $request->validate([
            'file' => 'required|file|max:10240', // Max 10MB
            'employee_id' => 'required|exists:employees,id'
        ]);

        $employee = Employee::findOrFail($employeeId);

        // Ordnerstruktur: mitarbeiter/Vorname_Nachname_geburtsdatum
        $folder = "mitarbeiter/" . Str::slug("{$employee->first_name}_{$employee->last_name}_{$employee->birth_date}");

        $file = $request->file('file');
        
        // Eindeutigen Dateinamen erstellen
        $filename = time() . '_' . $file->getClientOriginalName();
        
        // Datei im public storage speichern
        $filePath = $file->storeAs($folder, $filename, 'public');

        // Datenbankeintrag erstellen
        $document = EmployeeDocument::create([
            'employee_id' => $employee->id,
            'original_name' => $file->getClientOriginalName(),
            'file_path' => $filePath,
        ]);

        return response()->json([
            'message' => 'Dokument erfolgreich hochgeladen',
            'document' => $document
        ], 201);
    }

    /**
     * Dokument löschen
     */
    public function destroy($documentId)
    {
        $document = EmployeeDocument::findOrFail($documentId);

        // Datei aus dem Storage löschen
        Storage::disk('public')->delete($document->file_path);

        // Datenbankeintrag löschen
        $document->delete();

        return response()->json([
            'message' => 'Dokument erfolgreich gelöscht'
        ]);
    }

    /**
     * Alle Dokumente eines Mitarbeiters abrufen
     */
    public function index($employeeId)
    {
        $employee = Employee::with('documents')->findOrFail($employeeId);
        
        return response()->json([
            'documents' => $employee->documents
        ]);
    }
}
