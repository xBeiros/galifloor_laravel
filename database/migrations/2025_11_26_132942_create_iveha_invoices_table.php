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
        Schema::create('iveha_invoices', function (Blueprint $table) {
            $table->id();
            $table->date('invoice_date');
            $table->string('invoice_number');
            $table->string('project_number');
            $table->text('construction_address');
            $table->text('description');
            $table->decimal('qm', 10, 2);
            $table->integer('persons');
            $table->decimal('hours', 10, 2);
            $table->string('calendar_week');
            $table->string('execution_day');
            $table->decimal('total_price', 10, 2);
            $table->decimal('total_sum', 10, 2);
            $table->decimal('skonto', 10, 2);
            $table->decimal('invoice_amount', 10, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('iveha_invoices');
    }
};
