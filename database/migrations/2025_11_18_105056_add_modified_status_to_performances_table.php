<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Ändere das ENUM-Feld, um 'modified' hinzuzufügen
        DB::statement("ALTER TABLE performances MODIFY COLUMN status ENUM('no_change', 'date_change', 'canceled', 'modified') DEFAULT 'no_change'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Entferne 'modified' aus dem ENUM
        DB::statement("ALTER TABLE performances MODIFY COLUMN status ENUM('no_change', 'date_change', 'canceled') DEFAULT 'no_change'");
    }
};
