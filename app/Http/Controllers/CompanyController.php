<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\CompanyDocument;
use App\Models\OwnCompany;
use App\Models\Employee;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CompanyController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'address' => 'required|string',
            'city' => 'required|string',
            'postal' => 'required|string',
            'email' => 'required|email',
            'image' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
            'security_service' => 'nullable|numeric',
            'cash_discount' => 'nullable|numeric',
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('companies', 'public');
            $validated['image_url'] = "/storage/" . $path;
        }

        $company = Company::create($validated);
        return response()->json($company, 201);
    }

    public function index()
    {
        $companies = Company::all();
        return Inertia::render('Company/Index', [
            'companies' => $companies
        ]);
    }

    public function show($id)
    {
        $company = Company::with('documents')->findOrFail($id);
        return Inertia::render('Company/Show', [
            'company' => $company
        ]);
    }

    public function update(Request $request, $id)
    {
        $company = Company::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string',
            'address' => 'required|string',
            'city' => 'required|string',
            'postal' => 'required|string',
            'email' => 'required|email',
            'security_service' => 'nullable|numeric',
            'cash_discount' => 'nullable|numeric',
            'tax_identification_number' => 'nullable|string',
            'image' => 'nullable|image|max:2048'
        ]);

        if ($request->hasFile('image')) {
            if ($company->image_url) {
                $oldPath = str_replace('storage/', '', str_replace('/storage/', '', $company->image_url));
                Storage::disk('public')->delete($oldPath);
            }
            $folder = "companies/" . Str::slug($company->name);
            $path = $request->file('image')->store($folder, 'public');
            $validated['image_url'] = '/storage/' . $path;
        }

        $company->update($validated);

        if (request()->ajax() || request()->wantsJson()) {
            $freshCompany = $company->fresh(['documents']);
            return response()->json([
                'success' => true,
                'message' => 'Firma erfolgreich aktualisiert',
                'company' => [
                    'id' => $freshCompany->id,
                    'name' => $freshCompany->name,
                    'address' => $freshCompany->address,
                    'city' => $freshCompany->city,
                    'postal' => $freshCompany->postal,
                    'email' => $freshCompany->email,
                    'image_url' => $freshCompany->image_url,
                    'security_service' => $freshCompany->security_service,
                    'cash_discount' => $freshCompany->cash_discount,
                    'tax_identification_number' => $freshCompany->tax_identification_number,
                    'documents' => $freshCompany->documents
                ]
            ]);
        }

        return redirect()->back()->with('success', 'Firma erfolgreich aktualisiert');
    }

    public function uploadDocument(Request $request, $companyId)
    {
        $request->validate([
            'file' => 'required|file|max:10240', // Max 10MB
        ]);

        $company = Company::findOrFail($companyId);

        $folder = "companies/" . Str::slug($company->name);

        $file = $request->file('file');
        $filename = time() . '_' . $file->getClientOriginalName();
        $filePath = $file->storeAs($folder, $filename, 'public');

        $document = CompanyDocument::create([
            'company_id' => $company->id,
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

    public function deleteDocument($documentId)
    {
        $document = CompanyDocument::findOrFail($documentId);
        Storage::disk('public')->delete($document->file_path);
        $document->delete();
        return redirect()->back()->with('success', 'Dokument erfolgreich gelöscht');
    }

    public function showAll()
    {
        // Hole die eigene Firma, falls vorhanden, sonst erstelle Standardwerte
        $ownCompany = OwnCompany::first();
        
        if (!$ownCompany) {
            // Erstelle Standardwerte falls keine Daten vorhanden
            $ownCompany = OwnCompany::create([
                'name' => 'Gali Floor',
                'address' => 'Josefstr. 1',
                'postal' => '59067',
                'city' => 'Hamm',
                'owner_name' => 'Stefan Asenov Rangelov',
                'represented_by' => 'Demet Güngör',
            ]);
        }
        
        // Lade alle aktiven Mitarbeiter
        $employees = Employee::where('status', 'active')->get();
        
        return \Inertia\Inertia::render('Company/ShowAll', [
            'ownCompany' => $ownCompany,
            'employees' => $employees
        ]);
    }

    public function updateOwnCompany(Request $request)
    {
        $ownCompany = OwnCompany::first();
        
        if (!$ownCompany) {
            $ownCompany = new OwnCompany();
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'postal' => 'required|string|max:10',
            'city' => 'required|string|max:255',
            'owner_name' => 'nullable|string|max:255',
            'represented_by' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'email_secondary' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:255',
            'tax_identification_number' => 'nullable|string|max:255',
            'image' => 'nullable|image|max:2048'
        ]);

        if ($request->hasFile('image')) {
            if ($ownCompany->image_url) {
                $oldPath = str_replace('storage/', '', str_replace('/storage/', '', $ownCompany->image_url));
                Storage::disk('public')->delete($oldPath);
            }
            $path = $request->file('image')->store('own-company', 'public');
            $validated['image_url'] = '/storage/' . $path;
        }

        $ownCompany->fill($validated);
        $ownCompany->save();

        if (request()->ajax() || request()->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Firmeninformationen erfolgreich aktualisiert',
                'ownCompany' => $ownCompany->fresh()
            ]);
        }

        return redirect()->route('company.details')->with('success', 'Firmeninformationen erfolgreich aktualisiert');
    }

    /**
     * Firma löschen.
     */
    public function destroy($id)
    {
        $company = Company::findOrFail($id);

        // Prüfe, ob es Rechnungen für diese Firma gibt
        if ($company->invoices()->count() > 0) {
            if (request()->ajax() || request()->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Diese Firma kann nicht gelöscht werden, da sie noch Rechnungen hat.'
                ], 422);
            }
            return redirect()->back()->with('error', 'Diese Firma kann nicht gelöscht werden, da sie noch Rechnungen hat.');
        }

        // Lösche alle zugehörigen Dokumente
        foreach ($company->documents as $document) {
            Storage::disk('public')->delete($document->file_path);
            $document->delete();
        }

        // Lösche Firmenbild, falls vorhanden
        if ($company->image_url) {
            $imagePath = str_replace('storage/', '', str_replace('/storage/', '', $company->image_url));
            Storage::disk('public')->delete($imagePath);
        }

        // Lösche die Firma
        $company->delete();

        if (request()->ajax() || request()->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Firma erfolgreich gelöscht.'
            ]);
        }

        return redirect()->route('companies')->with('success', 'Firma erfolgreich gelöscht.');
    }

}
