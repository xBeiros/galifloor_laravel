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
        Schema::table('iveha_invoices', function (Blueprint $table) {
            $table->boolean('is_checked')->default(false)->after('invoice_amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('iveha_invoices', function (Blueprint $table) {
            $table->dropColumn('is_checked');
        });
    }
};

