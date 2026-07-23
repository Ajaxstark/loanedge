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
        Schema::create('loan_products', function (Blueprint $table) {
        $table->id();
        $table->string('name');
        $table->enum('loan_type', ['personal', 'business', 'gold', 'vehicle']);
        $table->decimal('interest_rate', 5, 2); // e.g. 12.50 (%)
        $table->decimal('min_amount', 12, 2);
        $table->decimal('max_amount', 12, 2);
        $table->unsignedInteger('min_tenure_months');
        $table->unsignedInteger('max_tenure_months');
        $table->enum('status', ['active', 'inactive'])->default('active');
        $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('loan_products');
    }
};
