<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('performances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained()->onDelete('cascade'); // Rechnung
            $table->text('performance');
            $table->dateTime('date'); // Datum der Leistung
            $table->dateTime('date_changed_to')->nullable(); // Falls geändert
            $table->integer('qm'); // Quadratmeter
            $table->decimal('price', 10, 2); // Preis pro qm oder Pauschalpreis
            $table->boolean('flatrate')->default(false); // Ist es eine Pauschale?
            $table->enum('status', ['no_change', 'date_change', 'canceled'])->default('no_change'); // Status der Leistung
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('performances');
    }
};
