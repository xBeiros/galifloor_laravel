<?php

use App\Http\Controllers\AssetController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\LanguageController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\VehicleController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\EmployeeController;


Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// Debug Route
Route::get('/debug-employees', function () {
    $employees = App\Models\Employee::with('documents')->get();
    $documents = App\Models\EmployeeDocument::all();
    
    return response()->json([
        'employees_count' => $employees->count(),
        'documents_count' => $documents->count(),
        'employees' => $employees->map(function($emp) {
            return [
                'id' => $emp->id,
                'name' => $emp->first_name . ' ' . $emp->last_name,
                'documents_count' => $emp->documents->count(),
                'image_path' => $emp->image_path,
                'image_url' => $emp->image_url ?? 'No image_url method',
                'documents' => $emp->documents
            ];
        })
    ]);
});

Route::get('/debug-image/{id}', function ($id) {
    $employee = App\Models\Employee::find($id);
    if (!$employee) {
        return response()->json(['error' => 'Employee not found']);
    }
    
    return response()->json([
        'id' => $employee->id,
        'name' => $employee->first_name . ' ' . $employee->last_name,
        'image_path' => $employee->image_path,
        'image_url' => $employee->image_url,
        'file_exists' => $employee->image_path ? file_exists(public_path($employee->image_path)) : false,
        'storage_path' => $employee->image_path ? storage_path('app/public/' . str_replace('storage/', '', $employee->image_path)) : null,
        'storage_exists' => $employee->image_path ? file_exists(storage_path('app/public/' . str_replace('storage/', '', $employee->image_path))) : false
    ]);
});

Route::post('/test-upload', function (Illuminate\Http\Request $request) {
    \Log::info('Test upload request', [
        'has_file' => $request->hasFile('image'),
        'all_files' => $request->allFiles(),
        'all_data' => $request->all()
    ]);
    
    if ($request->hasFile('image')) {
        $file = $request->file('image');
        $path = $file->store('test-uploads', 'public');
        
        return response()->json([
            'success' => true,
            'path' => $path,
            'url' => asset('storage/' . $path),
            'file_name' => $file->getClientOriginalName(),
            'file_size' => $file->getSize()
        ]);
    }
    
    return response()->json(['error' => 'No file uploaded']);
});

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::get('/calendar', [CalendarController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('calendar');

Route::get('/invoices', function () {
    return Inertia::render('Invoice/Index');
})->middleware(['auth', 'verified'])->name('invoices');

Route::get('/companies', [CompanyController::class, 'index'])->middleware(['auth', 'verified'])->name('companies');
Route::get('/company/details', [CompanyController::class, 'showAll'])->middleware(['auth', 'verified'])->name('company.details');
Route::put('/company/details', [CompanyController::class, 'updateOwnCompany'])->middleware(['auth', 'verified'])->name('company.details.update');
Route::get('/company/{company}', [CompanyController::class, 'show'])->middleware(['auth', 'verified'])->name('companies.show');
Route::put('/company/{company}', [CompanyController::class, 'update'])->middleware(['auth', 'verified'])->name('companies.update');
Route::post('/company/{company}/upload-document', [CompanyController::class, 'uploadDocument'])->middleware(['auth', 'verified'])->name('company.upload-document');
Route::delete('/company/document/{document}', [CompanyController::class, 'deleteDocument'])->middleware(['auth', 'verified'])->name('company.delete-document');

// Dokumentenverwaltung
Route::get('/documents', [DocumentController::class, 'index'])->middleware(['auth', 'verified'])->name('documents.index');
Route::post('/documents', [DocumentController::class, 'store'])->middleware(['auth', 'verified'])->name('documents.store');
Route::put('/documents/{document}', [DocumentController::class, 'update'])->middleware(['auth', 'verified'])->name('documents.update');
Route::delete('/documents/{document}', [DocumentController::class, 'destroy'])->middleware(['auth', 'verified'])->name('documents.destroy');
Route::get('/documents/{document}/download', [DocumentController::class, 'download'])->middleware(['auth', 'verified'])->name('documents.download');

Route::get('/invoice/{invoice}', [InvoiceController::class, 'show'])->middleware(['auth', 'verified'])->name('invoice.show');
Route::get('/invoices/{id}', [InvoiceController::class, 'show'])->middleware(['auth', 'verified']);
Route::post('/invoice/{invoice}/issue', [InvoiceController::class, 'issueInvoice'])->middleware(['auth', 'verified'])->name('invoice.issue');
Route::delete('/assets/{id}', [AssetController::class, 'destroy']);
Route::post('/upload', [AssetController::class, 'store']);
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::patch('/invoices/{invoice}', [InvoiceController::class, 'update'])
     ->name('invoices.update');

Route::get('/language/{locale}', [LanguageController::class, 'switchLanguage'])
     ->name('language.switch');

// Iveha Rechnungen
Route::get('/iveha-invoices', [InvoiceController::class, 'ivehaIndex'])->middleware(['auth', 'verified'])->name('iveha-invoices.index');
Route::post('/iveha-invoices', [InvoiceController::class, 'ivehaStore'])->middleware(['auth', 'verified'])->name('iveha-invoices.store');
Route::get('/iveha-invoices/{id}', [InvoiceController::class, 'ivehaShow'])->middleware(['auth', 'verified'])->name('iveha-invoices.show');
Route::delete('/iveha-invoices/{id}', [InvoiceController::class, 'ivehaDestroy'])->middleware(['auth', 'verified'])->name('iveha-invoices.destroy');


Route::resource('employee', EmployeeController::class);
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/employees', [EmployeeController::class, 'index'])->name('employees.index');
    Route::get('/employee/{employee}', [EmployeeController::class, 'show'])->name('employees.show');
    Route::post('/employees', [EmployeeController::class, 'store'])->name('employees.store');
    
    // Dokumenten-Routen für Mitarbeiter
    Route::post('/employee/{employee}/upload-document', [EmployeeController::class, 'uploadDocument'])->name('employee.upload-document');
    Route::delete('/employee/document/{document}', [EmployeeController::class, 'deleteDocument'])->name('employee.delete-document');
    
    // Bescheinigungs-Routen für Mitarbeiter (jetzt clientseitig mit jsPDF)
    // Route::post('/employee/{employee}/create-certificate', [App\Http\Controllers\CertificateController::class, 'create'])->name('employee.create-certificate');
    // Route::get('/certificate-types', [App\Http\Controllers\CertificateController::class, 'getCertificateTypes'])->name('certificate.types');
    
    // Fahrzeuge-Routen
    Route::get('/vehicles', [VehicleController::class, 'index'])->name('vehicles.index');
    Route::get('/vehicle/{vehicle}', [VehicleController::class, 'show'])->name('vehicles.show');
    Route::post('/vehicles', [VehicleController::class, 'store'])->name('vehicles.store');
    Route::put('/vehicle/{vehicle}', [VehicleController::class, 'update'])->name('vehicles.update');
    Route::delete('/vehicle/{vehicle}', [VehicleController::class, 'destroy'])->name('vehicles.destroy');
    Route::post('/vehicle/{vehicle}/upload-document', [VehicleController::class, 'uploadDocument'])->name('vehicle.upload-document');
    Route::delete('/vehicle/document/{document}', [VehicleController::class, 'deleteDocument'])->name('vehicle.delete-document');
});


require __DIR__.'/auth.php';
