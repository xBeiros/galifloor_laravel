<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('companies', function (Blueprint $table) {
            $table->id(); // Entspricht unsignedBigInteger
            $table->string('name');
            $table->string('address');
            $table->string('city');
            $table->string('postal');
            $table->string('image_url');
            $table->string('email');
            $table->float('security_service')->default(0);
            $table->float('cash_discount')->default(0);
            $table->timestamps();
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('companies');
    }
};
