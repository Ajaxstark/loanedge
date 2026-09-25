<?php

namespace Modules\Application\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Modules\Application\Http\Requests\SubmitLoanApplicationRequest;
use Modules\Application\Http\Requests\UpdateAddressDetailsRequest;
use Modules\Application\Http\Requests\UpdateEmploymentDetailsRequest;
use Modules\Application\Http\Requests\UpdateLoanDetailsRequest;
use Modules\Application\Http\Requests\UpdatePersonalDetailsRequest;
use Modules\Application\Http\Requests\UploadApplicationDocumentRequest;
use Modules\Application\Models\LoanApplication;
use Modules\Application\Services\ApplicationSubmissionService;
use Modules\KYC\Models\Document;
use Modules\Product\Models\LoanProduct;

class CustomerApplicationController extends Controller
{
    /**
     * Start a new customer loan application.
     */
    public function start(Request $request)
    {
        $user = $request->user();

        if (!$user || $user->role !== 'customer') {
            return response()->json([
                'success' => false,
                'message' => 'This action is available only to customers.',
            ], 403);
        }

        $existingApplication = LoanApplication::where('user_id', $user->id)
            ->where('status', 'draft')
            ->latest()
            ->first();

        if ($existingApplication) {
            return response()->json([
                'success' => true,
                'message' => 'Existing application retrieved.',
                'data' => $existingApplication->load([
                    'product',
                    'lead',
                ]),
            ]);
        }

        $application = LoanApplication::create([
            'user_id' => $user->id,
            'channel' => 'customer_portal',
            'full_name' => $user->name,
            'email' => $user->email,
            'status' => 'draft',
            'current_step' => 1,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Loan application started successfully.',
            'data' => $application->fresh()->load([
                'product',
                'lead',
            ]),
        ], 201);
    }

    /**
     * Logged-in customer's latest application.
     */
    public function current(Request $request)
    {
        $user = $request->user();

        if (!$user || $user->role !== 'customer') {
            return response()->json([
                'success' => false,
                'message' => 'This action is available only to customers.',
            ], 403);
        }

        $application = LoanApplication::with([
            'product',
            'lead',
        ])
            ->where('user_id', $user->id)
            ->latest()
            ->first();

        return response()->json([
            'success' => true,
            'data' => $application,
        ]);
    }

    /**
     * Active products available in Customer Portal.
     */
    public function products(Request $request)
    {
        $user = $request->user();

        if (!$user || $user->role !== 'customer') {
            return response()->json([
                'success' => false,
                'message' => 'This action is available only to customers.',
            ], 403);
        }

        $products = LoanProduct::where('status', 'active')
            ->orderBy('name')
            ->get([
                'id',
                'name',
                'loan_type',
                'interest_rate',
                'min_amount',
                'max_amount',
                'min_tenure_months',
                'max_tenure_months',
            ]);

        return response()->json([
            'success' => true,
            'data' => $products,
        ]);
    }

    /**
     * Step 1 — Personal Details.
     */
    public function updatePersonalDetails(
        UpdatePersonalDetailsRequest $request
    ) {
        $application = $this->getDraftApplication($request);

        if (!$application) {
            return $this->draftNotFoundResponse();
        }

        $validated = $request->validated();

        $application->update([
            'full_name' => $validated['full_name'],
            'phone' => $validated['phone'],
            'date_of_birth' => $validated['date_of_birth'],
            'marital_status' => $validated['marital_status'],
            'current_step' => max($application->current_step, 2),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Personal details saved successfully.',
            'data' => $application->fresh(),
        ]);
    }

    /**
     * Step 2 — Identity & Address Details.
     */
    public function updateAddressDetails(
        UpdateAddressDetailsRequest $request
    ) {
        $application = $this->getDraftApplication($request);

        if (!$application) {
            return $this->draftNotFoundResponse();
        }

        $validated = $request->validated();

        $application->update([
            'pan_number' => $validated['pan_number'],
            'address_line' => $validated['address_line'],
            'city' => $validated['city'],
            'state' => $validated['state'],
            'pincode' => $validated['pincode'],
            'residence_type' => $validated['residence_type'],
            'current_step' => max($application->current_step, 3),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Identity and address details saved successfully.',
            'data' => $application->fresh(),
        ]);
    }

    /**
     * Step 3 — Employment & Financial Details.
     */
    public function updateEmploymentDetails(
        UpdateEmploymentDetailsRequest $request
    ) {
        $application = $this->getDraftApplication($request);

        if (!$application) {
            return $this->draftNotFoundResponse();
        }

        $validated = $request->validated();

        $application->update([
            'employment_type' => $validated['employment_type'],
            'employer_business_name' => $validated['employer_business_name'],
            'monthly_income' => $validated['monthly_income'],
            'existing_emi' => $validated['existing_emi'] ?? 0,
            'work_experience_months' => $validated['work_experience_months'],
            'current_step' => max($application->current_step, 4),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Employment and financial details saved successfully.',
            'data' => $application->fresh(),
        ]);
    }

    /**
     * Step 4 — Loan / Product Details.
     */
    public function updateLoanDetails(
        UpdateLoanDetailsRequest $request
    ) {
        $application = $this->getDraftApplication($request);

        if (!$application) {
            return $this->draftNotFoundResponse();
        }

        $validated = $request->validated();

        $product = LoanProduct::find($validated['product_id']);

        if (!$product || $product->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'The selected loan product is currently unavailable.',
            ], 422);
        }

        $amount = (float) $validated['requested_amount'];
        $minAmount = (float) $product->min_amount;
        $maxAmount = (float) $product->max_amount;

        if ($amount < $minAmount || $amount > $maxAmount) {
            return response()->json([
                'success' => false,
                'message' => 'The requested loan amount is outside the limits of the selected product.',
                'limits' => [
                    'minimum_amount' => $product->min_amount,
                    'maximum_amount' => $product->max_amount,
                ],
            ], 422);
        }

        $tenure = (int) $validated['requested_tenure_months'];
        $minTenure = (int) $product->min_tenure_months;
        $maxTenure = (int) $product->max_tenure_months;

        if ($tenure < $minTenure || $tenure > $maxTenure) {
            return response()->json([
                'success' => false,
                'message' => 'The requested tenure is outside the limits of the selected product.',
                'limits' => [
                    'minimum_tenure_months' => $product->min_tenure_months,
                    'maximum_tenure_months' => $product->max_tenure_months,
                ],
            ], 422);
        }

        $application->update([
            'product_id' => $product->id,
            'requested_amount' => $amount,
            'requested_tenure_months' => $tenure,
            'loan_purpose' => $validated['loan_purpose'],
            'current_step' => max($application->current_step, 5),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Loan details saved successfully.',
            'data' => $application->fresh()->load('product'),
        ]);
    }

    /**
     * Step 5 — Customer's uploaded documents.
     */
    public function documents(Request $request)
    {
        $user = $request->user();

        if (!$user || $user->role !== 'customer') {
            return response()->json([
                'success' => false,
                'message' => 'This action is available only to customers.',
            ], 403);
        }

        $application = LoanApplication::where('user_id', $user->id)
            ->latest()
            ->first();

        if (!$application) {
            return response()->json([
                'success' => false,
                'message' => 'No loan application was found.',
            ], 404);
        }

        $documents = Document::where('application_id', $application->id)
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $documents,
        ]);
    }

    /**
     * Step 5 — Upload / replace customer document.
     */
    public function uploadDocument(
        UploadApplicationDocumentRequest $request
    ) {
        $application = $this->getDraftApplication($request);

        if (!$application) {
            return $this->draftNotFoundResponse();
        }

        $validated = $request->validated();

        $existingDocument = Document::where(
            'application_id',
            $application->id
        )
            ->where('document_type', $validated['document_type'])
            ->latest()
            ->first();

        if (
            $existingDocument &&
            $existingDocument->status === 'approved'
        ) {
            return response()->json([
                'success' => false,
                'message' => 'This document has already been approved and cannot be replaced.',
            ], 422);
        }

        $newPath = $request
            ->file('file')
            ->store('kyc_documents', 'public');

        if ($existingDocument) {
            $oldPath = $existingDocument->file_path;

            $existingDocument->update([
                'file_path' => $newPath,
                'status' => 'pending',
                'remarks' => null,
            ]);

            if (
                $oldPath &&
                Storage::disk('public')->exists($oldPath)
            ) {
                Storage::disk('public')->delete($oldPath);
            }

            $document = $existingDocument->fresh();

            $message =
                'Document replaced successfully and submitted for verification.';

            $statusCode = 200;
        } else {
            $document = Document::create([
                'application_id' => $application->id,
                'lead_id' => $application->lead_id,
                'document_type' => $validated['document_type'],
                'file_path' => $newPath,
                'status' => 'pending',
            ]);

            $message = 'Document uploaded successfully.';
            $statusCode = 201;
        }

        $application->update([
            'current_step' => max($application->current_step, 6),
        ]);

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $document,
        ], $statusCode);
    }

    /**
     * Step 6 — Final Review & Submit.
     */
    public function submit(
        SubmitLoanApplicationRequest $request,
        ApplicationSubmissionService $submissionService
    ) {
        $user = $request->user();

        $application = LoanApplication::where('user_id', $user->id)
            ->where('status', 'draft')
            ->latest()
            ->first();

        if (!$application) {
            return response()->json([
                'success' => false,
                'message' => 'No draft loan application was found.',
            ], 404);
        }

        /*
         * FormRequest already confirms that the customer
         * explicitly accepted the declaration.
         *
         * Service performs final completeness checks,
         * product validation, document checks,
         * Lead creation and transactional submission.
         */
        $submittedApplication = $submissionService->submit(
            $application
        );

        return response()->json([
            'success' => true,
            'message' => 'Your loan application has been submitted successfully.',
            'data' => $submittedApplication,
        ]);
    }

    /**
     * Logged-in customer's current draft.
     *
     * Same ownership query multiple methods mein repeat ho rahi thi,
     * isliye small private helper.
     */
    private function getDraftApplication(Request $request)
    {
        return LoanApplication::where(
            'user_id',
            $request->user()->id
        )
            ->where('status', 'draft')
            ->latest()
            ->first();
    }

    /**
     * Common response when no editable draft exists.
     */
    private function draftNotFoundResponse()
    {
        return response()->json([
            'success' => false,
            'message' => 'No draft loan application was found.',
        ], 404);
    }
}