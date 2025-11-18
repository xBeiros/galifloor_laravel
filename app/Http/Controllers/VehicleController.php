<?php

namespace App\Http\Controllers;

use App\Models\Vehicle;
use App\Models\VehicleDocument;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class VehicleController extends Controller
{
    public function index()
    {
        $vehicles = Vehicle::with('documents')->get();
        return Inertia::render('Vehicle/Index', [
            'vehicles' => $vehicles
        ]);
    }

    public function show($id)
    {
        $vehicle = Vehicle::with('documents')->findOrFail($id);

        return Inertia::render('Vehicle/Show', [
            'vehicle' => $vehicle
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'license_plate' => 'required|string|max:20|unique:vehicles,license_plate',
            'vehicle_identification_number' => 'required|string|max:17|unique:vehicles,vehicle_identification_number',
            'status' => 'required|in:registered,unregistered,sold',
            'notes' => 'nullable|string',
            'image' => 'nullable|image|max:2048'
        ]);

        $vehicle = Vehicle::create($validated);

        $folder = "vehicles/" . Str::slug($vehicle->license_plate);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store($folder, 'public');
            $vehicle->image_path = 'storage/' . $path;
            $vehicle->save();
        }

        return redirect()->route('vehicles.index')->with('success', 'Fahrzeug erfolgreich erstellt');
    }

    public function update(Request $request, $id)
    {
        $vehicle = Vehicle::findOrFail($id);

        $validated = $request->validate([
            'license_plate' => 'required|string|max:20|unique:vehicles,license_plate,' . $id,
            'vehicle_identification_number' => 'required|string|max:17|unique:vehicles,vehicle_identification_number,' . $id,
            'status' => 'required|in:registered,unregistered,sold',
            'notes' => 'nullable|string',
            'image' => 'nullable|image|max:2048'
        ]);

        if ($request->hasFile('image')) {
            // Altes Bild löschen falls vorhanden
            if ($vehicle->image_path) {
                $oldPath = str_replace('storage/', '', $vehicle->image_path);
                Storage::disk('public')->delete($oldPath);
            }

            $folder = "vehicles/" . Str::slug($vehicle->license_plate);
            $path = $request->file('image')->store($folder, 'public');
            $validated['image_path'] = 'storage/' . $path;
        }

        $vehicle->update($validated);

        if (request()->ajax() || request()->wantsJson()) {
            $freshVehicle = $vehicle->fresh();
            return response()->json([
                'success' => true,
                'message' => 'Fahrzeug erfolgreich aktualisiert',
                'vehicle' => [
                    'id' => $freshVehicle->id,
                    'license_plate' => $freshVehicle->license_plate,
                    'vehicle_identification_number' => $freshVehicle->vehicle_identification_number,
                    'status' => $freshVehicle->status,
                    'notes' => $freshVehicle->notes,
                    'image_path' => $freshVehicle->image_path,
                    'image_url' => $freshVehicle->image_url,
                    'documents' => $freshVehicle->documents
                ]
            ]);
        }

        return redirect()->back()->with('success', 'Fahrzeug erfolgreich aktualisiert');
    }

    public function uploadDocument(Request $request, $vehicleId)
    {
        $request->validate([
            'file' => 'required|file|max:10240',
        ]);

        $vehicle = Vehicle::findOrFail($vehicleId);

        $folder = "vehicles/" . Str::slug($vehicle->license_plate) . "/documents";

        $file = $request->file('file');
        $filename = time() . '_' . $file->getClientOriginalName();
        $filePath = $file->storeAs($folder, $filename, 'public');

        $document = VehicleDocument::create([
            'vehicle_id' => $vehicle->id,
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
        $document = VehicleDocument::findOrFail($documentId);

        Storage::disk('public')->delete($document->file_path);
        $document->delete();

        return redirect()->back()->with('success', 'Dokument erfolgreich gelöscht');
    }

    public function destroy($id)
    {
        $vehicle = Vehicle::findOrFail($id);

        // Alle Dokumente löschen
        foreach ($vehicle->documents as $document) {
            Storage::disk('public')->delete($document->file_path);
            $document->delete();
        }

        // Bild löschen
        if ($vehicle->image_path) {
            $oldPath = str_replace('storage/', '', $vehicle->image_path);
            Storage::disk('public')->delete($oldPath);
        }

        $vehicle->delete();

        return redirect()->route('vehicles.index')->with('success', 'Fahrzeug erfolgreich gelöscht');
    }
}
