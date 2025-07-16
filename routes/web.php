<?php

use App\Http\Controllers\AssetController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        //'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::get('/invoices', function () {
    return Inertia::render('Invoice/Index');
})->middleware(['auth', 'verified'])->name('invoices');

Route::get('/companies', function () {
    return Inertia::render('Company/Index');
})->middleware(['auth', 'verified'])->name('companies');

Route::get('/invoice/{invoice}', [InvoiceController::class, 'show'])->name('invoice.show');
Route::get('/invoices/{id}', [InvoiceController::class, 'show']);
Route::delete('/assets/{id}', [AssetController::class, 'destroy']);
Route::post('/upload', [AssetController::class, 'store']);
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::patch('/invoices/{invoice}', [InvoiceController::class, 'update'])
     ->name('invoices.update');


require __DIR__.'/auth.php';
