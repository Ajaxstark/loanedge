<?php

namespace Modules\Underwriting\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Modules\Application\Models\LoanApplication;
use Modules\Lead\Models\Lead;
use Modules\Underwriting\Models\UnderwritingReport;

class UnderwritingController extends Controller
{
    /**
     * List reports (all or by lead).
     */
    public function index($leadId = null)
    {
        $query = UnderwritingReport::with('lead');

        if ($leadId) {
            $query->where('lead_id', $leadId);
        }

        $reports = $query->latest()->get();

        return response()->json([
            'success' => true,
            'data' => $reports,
        ]);
    }

    /**
     * Prefill data for underwriting form.
     *
     * Fetches customer's already-collected financial data
     * from the linked loan application.
     */
    public function prefill($leadId)
    {
        $lead = Lead::findOrFail($leadId);

        $application = LoanApplication::with('product')
            ->where('lead_id', $lead->id)
            ->latest()
            ->first();

        if (!$application) {
            return response()->json([
                'success' => false,
                'message' => 'No linked application found for this lead.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'lead' => [
                    'id' => $lead->id,
                    'name' => $lead->name,
                    'phone' => $lead->phone,
                    'email' => $lead->email,
                ],
                'application' => [
                    'id' => $application->id,
                    'application_number' => $application->application_number,
                    'monthly_income' => $application->monthly_income,
                    'existing_emi' => $application->existing_emi,
                    'requested_amount' => $application->requested_amount,
                    'requested_tenure_months' => $application->requested_tenure_months,
                    'employment_type' => $application->employment_type,
                    'employer_business_name' => $application->employer_business_name,
                    'product' => $application->product ? [
                        'id' => $application->product->id,
                        'name' => $application->product->name,
                        'loan_type' => $application->product->loan_type,
                    ] : null,
                ],
            ],
        ]);
    }

    /**
     * Create underwriting report.
     *
     * Auto-fills monthly_income and existing_emi from linked application
     * if not provided. Staff only needs to provide CIBIL score.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'lead_id' => 'required|exists:leads,id',
            'monthly_income' => 'nullable|numeric|min:0',
            'existing_emi' => 'nullable|numeric|min:0',
            'cibil_score' => 'required|integer|min:300|max:900',
        ]);

        $lead = Lead::findOrFail($validated['lead_id']);

        // Auto-fetch from application if not provided
        $application = LoanApplication::where('lead_id', $lead->id)
            ->latest()
            ->first();

        $monthlyIncome = $validated['monthly_income']
            ?? $application?->monthly_income
            ?? 0;

        $existingEmi = $validated['existing_emi']
            ?? $application?->existing_emi
            ?? 0;

        if ($monthlyIncome <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'Monthly income is required. No linked application data found.',
            ], 422);
        }

        // Prevent duplicate report for same lead
        $existing = UnderwritingReport::where('lead_id', $lead->id)->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'An underwriting report already exists for this lead.',
                'data' => $existing->load('lead'),
            ], 422);
        }

        $riskCategory = $this->calculateRisk(
            $monthlyIncome,
            $existingEmi,
            $validated['cibil_score']
        );

        $report = UnderwritingReport::create([
            'lead_id' => $lead->id,
            'monthly_income' => $monthlyIncome,
            'existing_emi' => $existingEmi,
            'cibil_score' => $validated['cibil_score'],
            'risk_category' => $riskCategory,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Underwriting report created successfully.',
            'data' => $report->load('lead'),
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $report = UnderwritingReport::findOrFail($id);

        $validated = $request->validate([
            'remarks' => 'nullable|string',
        ]);

        $report->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Report updated successfully.',
            'data' => $report,
        ]);
    }

    private function calculateRisk($income, $existingEmi, $cibilScore)
    {
        $emiToIncomeRatio = $income > 0
            ? ($existingEmi / $income) * 100
            : 100;

        if ($cibilScore >= 750 && $emiToIncomeRatio < 30) {
            return 'low';
        }

        if ($cibilScore >= 600 && $emiToIncomeRatio < 50) {
            return 'medium';
        }

        return 'high';
    }
}