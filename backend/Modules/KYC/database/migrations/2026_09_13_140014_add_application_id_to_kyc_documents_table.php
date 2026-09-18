<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('kyc_documents', function (Blueprint $table) {
            /*
             * Draft customer application ke documents
             * application se directly attach ho sakte hain.
             */
            $table->foreignId('application_id')
                ->nullable()
                ->after('id')
                ->constrained('loan_applications')
                ->nullOnDelete();

            /*
             * Existing KYC schema mein lead_id required tha.
             * Customer draft ke paas submit hone se pehle Lead
             * nahi hoti, isliye isko nullable karna padega.
             */
            $table->foreignId('lead_id')
                ->nullable()
                ->change();

            $table->index([
                'application_id',
                'document_type',
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('kyc_documents', function (Blueprint $table) {
            $table->dropIndex([
                'application_id',
                'document_type',
            ]);

            $table->dropForeign([
                'application_id',
            ]);

            $table->dropColumn('application_id');

            /*
             * Rollback mein lead_id ko old required
             * behavior par restore karenge.
             */
            $table->foreignId('lead_id')
                ->nullable(false)
                ->change();
        });
    }
};