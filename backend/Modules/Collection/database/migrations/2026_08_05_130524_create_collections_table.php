<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('collections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained('leads')->onDelete('cascade');
            $table->decimal('loan_amount', 12, 2);
            $table->integer('overdue_days')->default(0);
            $table->enum('bucket', ['current', '0-30', '30-60', '60-90', '90+'])->default('current');
            $table->boolean('is_npa')->default(false);
            $table->string('recovery_agent')->nullable();
            $table->text('remarks')->nullable();
            $table->enum('status', ['active', 'recovered', 'legal_notice'])->default('active');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('collections');
    }
};