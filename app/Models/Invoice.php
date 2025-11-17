<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_number',
        'company_id',
        'construction',
        'address',
        'city',
        'postal',
        'status',
        'start_date',
        'end_date'
    ];

    public static function boot()
    {
        parent::boot();

        static::creating(function ($invoice) {
            $currentYear = now()->year;

            // Letzte Order Number für das aktuelle Jahr abrufen
            $lastInvoice = self::where('year', $currentYear)->orderBy('order_number', 'desc')->first();
            $nextOrderNumber = $lastInvoice ? $lastInvoice->order_number + 1 : 1; // Falls keine vorhanden, starte mit 1

            $invoice->year = $currentYear;
            $invoice->order_number = $nextOrderNumber;
        });
    }

    public function performances()
    {
        return $this->hasMany(Performance::class);
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function assets()
    {
        return $this->hasMany(Asset::class);
    }
}
