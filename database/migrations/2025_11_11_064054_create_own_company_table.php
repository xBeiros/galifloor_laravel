<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('own_company', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('address');
            $table->string('postal');
            $table->string('city');
            $table->string('owner_name');
            $table->string('represented_by')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('tax_identification_number')->nullable();
            $table->string('image_url')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('own_company');
    }
};
