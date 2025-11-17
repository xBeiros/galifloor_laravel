<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\EmployeeDocument;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class EmployeeController extends Controller
{
    public function index()
    {
        $employees = Employee::all();
        return Inertia::render('Employee/Index', [
            'employees' => $employees
        ]);
    }

    public function show($id)
    {
        $employee = Employee::with('documents')->findOrFail($id);

        return Inertia::render('Employee/Show', [
            'employee' => $employee
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name'     => 'required|string|max:255',
            'last_name'      => 'required|string|max:255',
            'birth_date'  => 'required|date',
            'status'         => 'required|in:active,fired,sick,vacation',
            'image'          => 'nullable|image|max:2048'
        ]);

        $employee = Employee::create($validated);

        $folder = "employee/" . Str::slug("{$employee->first_name}-{$employee->last_name}-{$employee->birth_date}");


        if ($request->hasFile('image')) {
            $path = $request->file('image')->store($folder, 'public');
            $employee->image_path = 'storage/' . $path;
            $employee->save();
        }

        return redirect()->route('employee.index')->with('success', 'Mitarbeiter erstellt');
    }

    /**
     * Dokument für einen Mitarbeiter hochladen
     */
    public function uploadDocument(Request $request, $employeeId)
    {
        $request->validate([
            'file' => 'required|file|max:10240', // Max 10MB
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
            'document' => $document,
            'file_path' => $filePath,
            'download_url' => Storage::disk('public')->url($filePath)
        ], 201);
    }

    /**
     * Mitarbeiter aktualisieren
     */
    public function update(Request $request, $id)
    {
        $employee = Employee::findOrFail($id);
        
        // Debug-Logging
        \Log::info('Employee update request', [
            'employee_id' => $id,
            'has_file' => $request->hasFile('image'),
            'file_name' => $request->file('image') ? $request->file('image')->getClientOriginalName() : null,
            'all_data' => $request->all()
        ]);

        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'birth_date' => 'required|date',
            'birth_place' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:255',
            'postal' => 'nullable|string|max:10',
            'city' => 'nullable|string|max:255',
            'nationality' => 'nullable|string|max:255',
            'gender' => 'nullable|in:m,w',
            'bank_name' => 'nullable|string|max:255',
            'iban' => 'nullable|string|max:34',
            'social_security_number' => 'nullable|string|max:255',
            'health_insurance' => 'nullable|string|max:255',
            'employment_start' => 'nullable|date',
            'weekly_hours' => 'nullable|integer|min:0|max:60',
            'hourly_wage' => 'nullable|numeric|min:0',
            'status' => 'required|in:active,terminated,on_leave',
            'image' => 'nullable|image|max:2048'
        ]);

        // Profilbild verarbeiten
        if ($request->hasFile('image')) {
            \Log::info('Processing image upload', [
                'file_name' => $request->file('image')->getClientOriginalName(),
                'file_size' => $request->file('image')->getSize(),
                'file_type' => $request->file('image')->getMimeType()
            ]);
            
            // Altes Bild löschen falls vorhanden
            if ($employee->image_path) {
                $oldPath = str_replace('storage/', '', $employee->image_path);
                Storage::disk('public')->delete($oldPath);
                \Log::info('Deleted old image', ['old_path' => $oldPath]);
            }

            // Ordnerstruktur: mitarbeiter/Vorname_Nachname_geburtsdatum
            $folder = "mitarbeiter/" . Str::slug("{$employee->first_name}_{$employee->last_name}_{$employee->birth_date}");
            
            $path = $request->file('image')->store($folder, 'public');
            $validated['image_path'] = 'storage/' . $path;
            
            \Log::info('Image stored successfully', [
                'folder' => $folder,
                'path' => $path,
                'final_path' => $validated['image_path']
            ]);
        } else {
            \Log::info('No image file in request');
        }

        $employee->update($validated);

        // Für AJAX-Requests JSON zurückgeben
        if (request()->ajax() || request()->wantsJson()) {
            $freshEmployee = $employee->fresh();
            
            \Log::info('Sending employee data to frontend', [
                'image_path' => $freshEmployee->image_path,
                'image_url' => $freshEmployee->image_url,
                'has_image_path' => !empty($freshEmployee->image_path),
                'has_image_url' => !empty($freshEmployee->image_url)
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Mitarbeiter erfolgreich aktualisiert',
                'employee' => [
                    'id' => $freshEmployee->id,
                    'first_name' => $freshEmployee->first_name,
                    'last_name' => $freshEmployee->last_name,
                    'email' => $freshEmployee->email,
                    'phone' => $freshEmployee->phone,
                    'birth_date' => $freshEmployee->birth_date,
                    'birth_place' => $freshEmployee->birth_place,
                    'address' => $freshEmployee->address,
                    'postal' => $freshEmployee->postal,
                    'city' => $freshEmployee->city,
                    'nationality' => $freshEmployee->nationality,
                    'gender' => $freshEmployee->gender,
                    'bank_name' => $freshEmployee->bank_name,
                    'iban' => $freshEmployee->iban,
                    'social_security_number' => $freshEmployee->social_security_number,
                    'health_insurance' => $freshEmployee->health_insurance,
                    'employment_start' => $freshEmployee->employment_start,
                    'weekly_hours' => $freshEmployee->weekly_hours,
                    'hourly_wage' => $freshEmployee->hourly_wage,
                    'status' => $freshEmployee->status,
                    'image_path' => $freshEmployee->image_path,
                    'image_url' => $freshEmployee->image_url, // Explizit hinzufügen
                    'documents' => $freshEmployee->documents
                ]
            ]);
        }

        return redirect()->back()->with('success', 'Mitarbeiter erfolgreich aktualisiert');
    }

    /**
     * Dokument löschen
     */
    public function deleteDocument($documentId)
    {
        $document = EmployeeDocument::findOrFail($documentId);

        // Datei aus dem Storage löschen
        Storage::disk('public')->delete($document->file_path);

        // Datenbankeintrag löschen
        $document->delete();

        return redirect()->back()->with('success', 'Dokument erfolgreich gelöscht');
    }
}
