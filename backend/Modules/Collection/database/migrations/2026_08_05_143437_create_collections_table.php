<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('collections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_id')->constrained('loans')->onDelete('cascade');
            $table->integer('overdue_days')->default(0);
            $table->enum('bucket', ['current', '0-30', '30-60', '60-90', '90+'])->default('current');
            $table->boolean('is_npa')->default(false);
            $table->string('recovery_agent')->nullable();
            $table->text('remarks')->nullable();
            $table->enum('status', ['active', 'recovered', 'legal_notice'])->default('active');
            $table->timestamp('last_calculated_at')->nullable();
            $table->timestamps();

            $table->unique('loan_id'); // ek loan ka ek hi collection record rahega
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('collections');
    }
};