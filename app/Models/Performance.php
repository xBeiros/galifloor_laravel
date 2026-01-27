<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Performance extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_id',
        'performance',
        'date',
        'end_date',
        'individual_dates',
        'date_changed_to',
        'qm',
        'price',
        'flatrate',
        'status',
        'modified_after_issue'
    ];

    protected $casts = [
        'modified_after_issue' => 'boolean',
        'individual_dates' => 'array',
    ];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }
}
