<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Vehicle extends Model
{
    use HasFactory;

    protected $fillable = [
        'license_plate',
        'vehicle_identification_number',
        'status',
        'image_path',
        'notes',
    ];

    public function documents()
    {
        return $this->hasMany(VehicleDocument::class);
    }

    public function getImageUrlAttribute()
    {
        if (!$this->image_path) {
            return '/images/default-user.png';
        }

        if (str_starts_with($this->image_path, 'storage/')) {
            return asset($this->image_path);
        }

        return asset('storage/' . $this->image_path);
    }
}
