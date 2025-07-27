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

        return asset('storage/' . $this->image_path);
    }
}
