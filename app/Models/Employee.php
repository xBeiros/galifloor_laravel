<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Employee extends Model
{
    use HasFactory;

    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'phone',
        'birth_date',
        'birth_place',
        'address',
        'postal',
        'city',
        'nationality',
        'gender',
        'bank_name',
        'iban',
        'social_security_number',
        'health_insurance',
        'employment_start',
        'weekly_hours',
        'hourly_wage',
        'status',
        'image_path',
    ];

    public function documents()
    {
        return $this->hasMany(EmployeeDocument::class);
    }

    // Optional: für bequemeren Zugriff auf das Bild
    public function getImageUrlAttribute()
    {
        if (!$this->image_path) {
            return '/images/default-user.png'; // Fallback
        }

        // Wenn image_path bereits 'storage/' enthält, verwende es direkt
        if (str_starts_with($this->image_path, 'storage/')) {
            return asset($this->image_path);
        }

        return asset('storage/' . $this->image_path);
    }
}
