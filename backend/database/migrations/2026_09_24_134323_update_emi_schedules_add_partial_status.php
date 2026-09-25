<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // status column mein 'partial' add karo
        DB::statement("ALTER TABLE emi_schedules MODIFY COLUMN status ENUM('pending', 'paid', 'partial', 'overdue') DEFAULT 'pending'");
    }

    public function down(): void
    {
        // rollback ke liye wapas purana banao
        DB::statement("ALTER TABLE emi_schedules MODIFY COLUMN status ENUM('pending', 'paid', 'overdue') DEFAULT 'pending'");
    }
};