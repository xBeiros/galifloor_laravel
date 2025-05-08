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
        'postal'
    ];

    // Beziehung: Eine Firma kann mehrere Rechnungen haben
    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }
}
