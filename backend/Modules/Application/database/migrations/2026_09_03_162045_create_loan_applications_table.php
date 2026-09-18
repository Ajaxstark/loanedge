<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loan_applications', function (Blueprint $table) {
            $table->id();

            $table->string('application_number')->nullable()->unique();

            // Ownership / relationships
            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('lead_id')
                ->nullable()
                ->constrained('leads')
                ->nullOnDelete();

            $table->foreignId('product_id')
                ->nullable()
                ->constrained('loan_products')
                ->nullOnDelete();

            // Where the application originated
            $table->enum('channel', [
                'customer_portal',
                'branch',
                'dsa',
                'referral',
            ])->default('customer_portal');

            // Personal details
            $table->string('full_name');
            $table->string('email');
            $table->string('phone', 20)->nullable();
            $table->date('date_of_birth')->nullable();

            $table->enum('marital_status', [
                'single',
                'married',
                'divorced',
                'widowed',
            ])->nullable();

            // Identity
            $table->string('pan_number', 10)->nullable();

            // Address
            $table->text('address_line')->nullable();
            $table->string('city', 100)->nullable();
            $table->string('state', 100)->nullable();
            $table->string('pincode', 10)->nullable();

            $table->enum('residence_type', [
                'owned',
                'rented',
                'family',
                'company_provided',
                'other',
            ])->nullable();

            // Employment / financial details
            $table->enum('employment_type', [
                'salaried',
                'self_employed',
            ])->nullable();

            $table->string('employer_business_name')->nullable();
            $table->decimal('monthly_income', 12, 2)->nullable();
            $table->decimal('existing_emi', 12, 2)->default(0);
            $table->unsignedInteger('work_experience_months')->nullable();

            // Loan requirement
            $table->decimal('requested_amount', 12, 2)->nullable();
            $table->unsignedInteger('requested_tenure_months')->nullable();
            $table->string('loan_purpose')->nullable();

            // Application workflow
            $table->enum('status', [
                'draft',
                'submitted',
                'under_review',
                'approved',
                'rejected',
                'cancelled',
            ])->default('draft');

            $table->unsignedTinyInteger('current_step')->default(1);

            // Declaration / consent
            $table->boolean('declaration_accepted')->default(false);
            $table->timestamp('consented_at')->nullable();
            $table->timestamp('submitted_at')->nullable();

            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['channel', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loan_applications');
    }
};