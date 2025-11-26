<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IvehaInvoice extends Model
{
    protected $fillable = [
        'invoice_date',
        'invoice_number',
        'project_number',
        'construction_address',
        'description',
        'qm',
        'persons',
        'hours',
        'calendar_week',
        'execution_day',
        'total_price',
        'total_sum',
        'skonto',
        'invoice_amount',
    ];

    protected $casts = [
        'invoice_date' => 'date',
        'qm' => 'decimal:2',
        'hours' => 'decimal:2',
        'total_price' => 'decimal:2',
        'total_sum' => 'decimal:2',
        'skonto' => 'decimal:2',
        'invoice_amount' => 'decimal:2',
    ];
}
