<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $currentYear = now()->year;
        
        // Alle Rechnungen vom aktuellen Jahr
        $currentYearInvoices = Invoice::with('company')
            ->where('year', $currentYear)
            ->orderBy('created_at', 'desc')
            ->get();
        
        // Statistiken
        $statistics = [
            'total_current_year' => $currentYearInvoices->count(),
            'open' => Invoice::whereIn('status', ['in_progress', 'invoice_sent'])->count(),
            'completed' => Invoice::where('status', 'completed')->count(),
            'canceled' => Invoice::where('status', 'canceled')->count(),
        ];
        
        return Inertia::render('Dashboard', [
            'currentYear' => $currentYear,
            'statistics' => $statistics,
        ]);
    }
}
