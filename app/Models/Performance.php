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
        'date_changed_to',
        'qm',
        'price',
        'flatrate',
        'status'
    ];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }
}
