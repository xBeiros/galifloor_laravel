<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'address',
        'city',
        'postal',
        'email',
        'image_url',
        'security_service',
        'cash_discount',
        'tax_identification_number',
    ];

    // Beziehung: Eine Firma kann mehrere Rechnungen haben
    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }

    // Beziehung: Eine Firma kann mehrere Dokumente haben
    public function documents()
    {
        return $this->hasMany(CompanyDocument::class);
    }
}
