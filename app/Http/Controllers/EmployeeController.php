<?php

namespace App\Http\Controllers;

use App\Models\Employee;
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
            $path = $request->file('image')->store("public/{$folder}");
            $employee->image_path = str_replace('public/', 'storage/', $path);
            $employee->save();
        }

        return redirect()->route('employee.index')->with('success', 'Mitarbeiter erstellt');
    }
}
