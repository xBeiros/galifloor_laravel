<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->string('first_name');
            $table->string('last_name');
            $table->date('birth_date');
            $table->string('birth_place')->nullable();
            $table->string('address')->nullable();
            $table->string('postal')->nullable();
            $table->string('city')->nullable();
            $table->string('nationality')->nullable();
            $table->enum('gender', ['m', 'w'])->nullable();
            $table->string('bank_name')->nullable();
            $table->string('iban')->nullable();
            $table->string('social_security_number')->nullable();
            $table->string('health_insurance')->nullable();
            $table->date('employment_start')->nullable();
            $table->integer('weekly_hours')->nullable();
            $table->decimal('hourly_wage', 8, 2)->nullable();
            $table->enum('status', ['active', 'terminated', 'on_leave'])->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
