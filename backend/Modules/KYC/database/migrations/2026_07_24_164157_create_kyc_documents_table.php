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
        Schema::create('kyc_documents', function (Blueprint $table) {
			$table->id();
			$table->foreignId('lead_id')->constrained()->onDelete('cascade');
			$table->enum('document_type', ['aadhar', 'pan', 'salary_slip', 'bank_statement']);
			$table->string('file_path');
			$table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
			$table->text('remarks')->nullable();
			$table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kyc_documents');
    }
};
