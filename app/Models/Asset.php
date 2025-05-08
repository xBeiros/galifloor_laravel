<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Asset extends Model
{
    use HasFactory;

    protected $fillable = ['invoice_id', 'file_path', 'file_name'];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }
}
