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
        Schema::create('loans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained('leads')->onDelete('cascade');
            $table->foreignId('approval_id')->constrained('loan_approvals')->onDelete('cascade');
            $table->foreignId('loan_product_id')->constrained('loan_products')->onDelete('restrict');

            $table->decimal('principal_amount', 12, 2);
            $table->decimal('interest_rate', 5, 2);
            $table->unsignedInteger('tenure_months');

            $table->enum('status', ['sanctioned', 'disbursed', 'active', 'closed', 'npa'])->default('sanctioned');

            $table->date('sanction_date');
            $table->date('disbursement_date')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('loans');
    }
};
