<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Document extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'category',
        'original_name',
        'file_path',
        'description',
        'expiry_date',
    ];

    protected $casts = [
        'expiry_date' => 'date',
    ];

    public function getDownloadUrlAttribute()
    {
        return asset('storage/' . $this->file_path);
    }
}
