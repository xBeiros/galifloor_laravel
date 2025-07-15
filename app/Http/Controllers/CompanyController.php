<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Company;
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

}
