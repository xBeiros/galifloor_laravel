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
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->integer('year')->nullable();
            $table->integer('order_number')->nullable();
            $table->string('project_number');
            $table->unsignedBigInteger('company_id');
            $table->string('construction');
            $table->string('address');
            $table->string('city');
            $table->string('postal');
            $table->boolean('invoice_send')->default(false);
            $table->boolean('order_send')->default(false);
            $table->enum('status', ['in_progress', 'waiting_for_invoice', 'invoice_sent', 'completed', 'canceled'])->default('in_progress');
            $table->timestamps();

            // Fremdschlüssel-Beziehung sicherstellen
            $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn(['order_number', 'year']);
        });
    }
};
