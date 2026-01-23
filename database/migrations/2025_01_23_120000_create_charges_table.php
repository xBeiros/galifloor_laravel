<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('charges', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('invoice_id');
            $table->string('description');
            $table->decimal('amount', 10, 2);
            $table->date('date');
            $table->string('file_path')->nullable();
            $table->string('file_name')->nullable();
            $table->timestamps();

            // Fremdschlüssel für die Beziehung zur Invoices-Tabelle
            $table->foreign('invoice_id')->references('id')->on('invoices')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('charges');
    }
};
