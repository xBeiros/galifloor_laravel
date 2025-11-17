<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\OwnCompany;
use App\Models\Employee;
use Illuminate\Http\Request;

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

    public function update(Request $request, Company $company)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'address' => 'required|string',
            'city' => 'required|string',
            'postal' => 'required|string',
            'email' => 'required|email',
            'security_service' => 'nullable|numeric',
            'cash_discount' => 'nullable|numeric',
            'image' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('companies', 'public');
            $validated['image_url'] = "/storage/" . $path;
        }

        $company->update($validated);
        return response()->json($company);
    }

    public function showAll()
    {
        // Hole die eigene Firma, falls vorhanden, sonst erstelle Standardwerte
        $ownCompany = OwnCompany::first();
        
        if (!$ownCompany) {
            // Erstelle Standardwerte falls keine Daten vorhanden
            $ownCompany = new OwnCompany([
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

}
