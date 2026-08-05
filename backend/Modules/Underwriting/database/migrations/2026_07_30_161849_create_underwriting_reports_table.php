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
        Schema::create('underwriting_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained()->onDelete('cascade');
            $table->decimal('monthly_income', 12, 2);
            $table->decimal('existing_emi', 12, 2)->default(0);
            $table->unsignedSmallInteger('cibil_score');
            $table->enum('risk_category', ['low', 'medium', 'high']);
            $table->text('remarks')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('underwriting_reports');
    }
};
