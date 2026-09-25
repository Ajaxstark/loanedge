<?php

namespace Modules\Application\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\Application\Models\LoanApplication;
use Modules\KYC\Models\Document;
use Modules\Lead\Models\Lead;
use Modules\Product\Models\LoanProduct;

class ApplicationSubmissionService
{
    public function submit(LoanApplication $application): LoanApplication
    {
        /*
        |--------------------------------------------------------------------------
        | Application must still be a draft
        |--------------------------------------------------------------------------
        */

        if ($application->status !== 'draft') {
            throw ValidationException::withMessages([
                'application' =>
                    'Only draft applications can be submitted.',
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Validate complete application
        |--------------------------------------------------------------------------
        |
        | Step APIs partial draft save allow karti hain.
        | Final submission ke waqt complete information mandatory hai.
        |
        */

        $requiredFields = [
            'full_name' => 'Full name',
            'email' => 'Email address',
            'phone' => 'Mobile number',
            'date_of_birth' => 'Date of birth',
            'marital_status' => 'Marital status',

            'pan_number' => 'PAN number',
            'address_line' => 'Residential address',
            'city' => 'City',
            'state' => 'State',
            'pincode' => 'PIN code',
            'residence_type' => 'Residence type',

            'employment_type' => 'Employment type',
            'employer_business_name' => 'Employer or business name',
            'monthly_income' => 'Monthly income',

            'product_id' => 'Loan product',
            'requested_amount' => 'Requested loan amount',
            'requested_tenure_months' => 'Requested tenure',
            'loan_purpose' => 'Loan purpose',
        ];

        $missingFields = [];

        foreach ($requiredFields as $field => $label) {
            $value = $application->{$field};

            if ($value === null || $value === '') {
                $missingFields[] = $label;
            }
        }

        if (!empty($missingFields)) {
            throw ValidationException::withMessages([
                'application' =>
                    'Please complete all required application details before submitting.',
                'missing_fields' => $missingFields,
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Product must still be valid
        |--------------------------------------------------------------------------
        |
        | Product Step complete hone aur final Submit ke beech staff product
        | inactive kar sakta hai ya limits change kar sakta hai.
        |
        | Isliye final submit par business rules dobara check honge.
        |
        */

        $product = LoanProduct::find($application->product_id);

        if (!$product || $product->status !== 'active') {
            throw ValidationException::withMessages([
                'product_id' =>
                    'The selected loan product is no longer available.',
            ]);
        }

        $amount = (float) $application->requested_amount;
        $minAmount = (float) $product->min_amount;
        $maxAmount = (float) $product->max_amount;

        if ($amount < $minAmount || $amount > $maxAmount) {
            throw ValidationException::withMessages([
                'requested_amount' =>
                    'The requested loan amount is outside the current limits of the selected product.',
            ]);
        }

        $tenure = (int) $application->requested_tenure_months;
        $minTenure = (int) $product->min_tenure_months;
        $maxTenure = (int) $product->max_tenure_months;

        if ($tenure < $minTenure || $tenure > $maxTenure) {
            throw ValidationException::withMessages([
                'requested_tenure_months' =>
                    'The requested tenure is outside the current limits of the selected product.',
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Required KYC documents
        |--------------------------------------------------------------------------
        */

        $requiredDocumentTypes = [
            'aadhar',
            'pan',
            'salary_slip',
            'bank_statement',
        ];

        $uploadedDocumentTypes = Document::where(
            'application_id',
            $application->id
        )
            ->whereIn('document_type', $requiredDocumentTypes)
            ->pluck('document_type')
            ->unique()
            ->values()
            ->all();

        $missingDocuments = array_values(
            array_diff(
                $requiredDocumentTypes,
                $uploadedDocumentTypes
            )
        );

        if (!empty($missingDocuments)) {
            throw ValidationException::withMessages([
                'documents' =>
                    'Please upload all required documents before submitting your application.',
                'missing_documents' => $missingDocuments,
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Transaction
        |--------------------------------------------------------------------------
        |
        | Ye sab operations either ALL successful honge,
        | ya error par NONE permanently save honge.
        |
        */

        return DB::transaction(function () use ($application, $product) {

            /*
            |--------------------------------------------------------------------------
            | Create Lead only once
            |--------------------------------------------------------------------------
            */

            $lead = null;

            if ($application->lead_id) {
                $lead = Lead::find($application->lead_id);
            }

            if (!$lead) {
                $lead = Lead::create([
                    'name' => $application->full_name,
                    'phone' => $application->phone,
                    'email' => $application->email,

                    'loan_amount_required' =>
                        $application->requested_amount,

                    'loan_type' =>
                        $product->loan_type,

                    'source' => 'website',

                    'status' => 'new',
                ]);
            }

            /*
            |--------------------------------------------------------------------------
            | Link Application → Lead
            |--------------------------------------------------------------------------
            */

            $application->update([
                'lead_id' => $lead->id,

                'status' => 'submitted',

                'declaration_accepted' => true,

                'consented_at' => now(),

                'submitted_at' => now(),
            ]);

            /*
            |--------------------------------------------------------------------------
            | Attach draft documents to final Lead
            |--------------------------------------------------------------------------
            */

            Document::where(
                'application_id',
                $application->id
            )->update([
                'lead_id' => $lead->id,
            ]);

            return $application
                ->fresh()
                ->load([
                    'product',
                    'lead',
                ]);
        });
    }
}