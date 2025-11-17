<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OwnCompany extends Model
{
    use HasFactory;

    protected $table = 'own_company';

    protected $fillable = [
        'name',
        'address',
        'postal',
        'city',
        'owner_name',
        'represented_by',
        'email',
        'email_secondary',
        'phone',
        'tax_identification_number',
        'image_url',
    ];
}
