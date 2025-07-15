<?php

use App\Http\Controllers\CompanyController;
use App\Http\Controllers\InvoiceController;
use App\Models\Company;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PerformanceController;



Route::middleware('auth:sanctum', 'verified')->get('/companies', function (Request $request) {
    return Company::all();
});

Route::middleware(['auth:sanctum', 'verified'])->get('/invoices', function (Request $request) {
    return response()->json(Invoice::with('company')->get());
});

Route::middleware(['auth:sanctum', 'verified'])->post('/invoices', function (Request $request) {
    $validated = $request->validate([
        'project_number' => 'required|string',
        'company_id' => 'required|exists:companies,id',
        'construction' => 'required|string',
        'address' => 'required|string',
        'postal' => 'required|string',
        'city' => 'required|string',
    ]);

    $invoice = Invoice::create($validated);

    return response()->json($invoice, 201);
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/performances/{invoiceId}', [PerformanceController::class, 'index'])->name('performance.index');
    Route::post('/performances/{invoiceId}', [PerformanceController::class, 'store'])->name('performance.store');
});

//Email Invoice
Route::post('/upload-invoice', [InvoiceController::class, 'uploadInvoice']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/invoices/{id}', [InvoiceController::class, 'show']);
});
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/invoices/{invoiceId}/performances', [PerformanceController::class, 'store']);
});
Route::middleware(['auth:sanctum', 'verified'])->group(function () {
    Route::get('/performances/{invoiceId}', [PerformanceController::class, 'index']);
    Route::post('/performances/{invoiceId}', [PerformanceController::class, 'store']);
    Route::patch('/performances/{id}/cancel', [PerformanceController::class, 'cancel']);
    Route::delete('/performances/{id}', [PerformanceController::class, 'destroy']);
    Route::patch('/performances/{id}/status', [PerformanceController::class, 'updateStatus']);
    Route::patch('/performances/{id}/date', [PerformanceController::class, 'updateDate']);
});

Route::middleware('auth:sanctum')->post('/performances', [PerformanceController::class, 'store']);

// Company Routes
Route::put('/companies/{company}', [CompanyController::class, 'update']);
Route::post('/companies', [CompanyController::class, 'store']);
