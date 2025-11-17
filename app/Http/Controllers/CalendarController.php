<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use Inertia\Inertia;
use Illuminate\Http\Request;

class CalendarController extends Controller
{
    /**
     * Kalender-Ansicht anzeigen
     */
    public function index(Request $request)
    {
        $year = $request->get('year', now()->year);
        $month = $request->get('month', now()->month);

        // Lade alle Rechnungen mit ihren Performances für den aktuellen Monat
        // Lade Performances die im Monat starten, enden oder den Monat überspannen
        $invoices = Invoice::with(['company', 'performances' => function($query) use ($year, $month) {
                $query->where(function($q) use ($year, $month) {
                    // Performance startet im Monat
                    $q->whereYear('date', $year)
                      ->whereMonth('date', $month)
                      // Oder Performance endet im Monat
                      ->orWhere(function($subQ) use ($year, $month) {
                          $subQ->whereNotNull('end_date')
                               ->whereYear('end_date', $year)
                               ->whereMonth('end_date', $month);
                      })
                      // Oder Performance überspannt den Monat
                      ->orWhere(function($subQ) use ($year, $month) {
                          $subQ->whereNotNull('end_date')
                               ->whereRaw('YEAR(date) = ? AND MONTH(date) <= ?', [$year, $month])
                               ->whereRaw('YEAR(end_date) = ? AND MONTH(end_date) >= ?', [$year, $month]);
                      });
                });
            }])
            ->where(function($query) use ($year, $month) {
                $query->whereHas('performances', function($q) use ($year, $month) {
                    $q->whereYear('date', $year)
                      ->whereMonth('date', $month);
                })
                ->orWhere(function($q) use ($year, $month) {
                    $q->whereYear('start_date', $year)
                      ->whereMonth('start_date', $month);
                })
                ->orWhere(function($q) use ($year, $month) {
                    $q->whereYear('end_date', $year)
                      ->whereMonth('end_date', $month);
                })
                ->orWhere(function($q) use ($year, $month) {
                    // Rechnungen die den Monat überspannen
                    $q->where(function($subQ) use ($year, $month) {
                        $subQ->whereYear('start_date', $year)
                             ->whereMonth('start_date', '<=', $month)
                             ->whereYear('end_date', $year)
                             ->whereMonth('end_date', '>=', $month);
                    });
                });
            })
            ->get()
            ->map(function($invoice) {
                // Berechne Start- und Enddatum aus Performances falls nicht gesetzt
                if (!$invoice->start_date && $invoice->performances->count() > 0) {
                    $invoice->start_date = $invoice->performances->min('date');
                }
                if (!$invoice->end_date && $invoice->performances->count() > 0) {
                    $invoice->end_date = $invoice->performances->max('date');
                }
                
                return [
                    'id' => $invoice->id,
                    'invoice_number' => $invoice->year . '-' . $invoice->order_number,
                    'project_number' => $invoice->project_number,
                    'construction' => $invoice->construction,
                    'city' => $invoice->city,
                    'company_name' => $invoice->company->name ?? '',
                    'start_date' => $invoice->start_date,
                    'end_date' => $invoice->end_date,
                    'status' => $invoice->status,
                    'performances' => $invoice->performances->map(function($performance) {
                        return [
                            'id' => $performance->id,
                            'performance' => $performance->performance,
                            'date' => $performance->date,
                            'end_date' => $performance->end_date,
                            'date_changed_to' => $performance->date_changed_to,
                            'status' => $performance->status,
                        ];
                    }),
                ];
            });

        return Inertia::render('Calendar/Index', [
            'invoices' => $invoices,
            'currentYear' => $year,
            'currentMonth' => $month,
        ]);
    }
}
