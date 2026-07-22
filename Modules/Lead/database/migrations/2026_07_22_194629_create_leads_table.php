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
        Schema::create('leads', function (Blueprint $table) {
        $table->id();
        $table->string('name');
        $table->string('phone');
        $table->string('email')->nullable();
        $table->decimal('loan_amount_required', 12, 2);
        $table->string('loan_type')->nullable();
        $table->enum('source', ['website', 'walk_in', 'dsa', 'referral'])->default('website');
        $table->enum('status', ['new', 'qualified', 'rejected'])->default('new');
        $table->unsignedBigInteger('assigned_to')->nullable();
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};
