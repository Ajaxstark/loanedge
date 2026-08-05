<?php

namespace Modules\Underwriting\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Modules\Underwriting\Models\UnderwritingReport;

class UnderwritingController extends Controller
{
    // Sab reports, ya ek lead ke reports (agar leadId diya ho)
    public function index($leadId = null)
    {
        $query = UnderwritingReport::with('lead');

        if ($leadId) {
            $query->where('lead_id', $leadId);
        }

        $reports = $query->latest()->get();

        return response()->json([
            'success' => true,
            'data' => $reports
        ]);
    }

    // Naya underwriting report banao (risk calculate karo)
    public function store(Request $request)
    {
        $validated = $request->validate([
            'lead_id' => 'required|exists:leads,id',
            'monthly_income' => 'required|numeric|min:0',
            'existing_emi' => 'nullable|numeric|min:0',
            'cibil_score' => 'required|integer|min:300|max:900',
        ]);

        $riskCategory = $this->calculateRisk(
            $validated['monthly_income'],
            $validated['existing_emi'] ?? 0,
            $validated['cibil_score']
        );

        $report = UnderwritingReport::create([
            'lead_id' => $validated['lead_id'],
            'monthly_income' => $validated['monthly_income'],
            'existing_emi' => $validated['existing_emi'] ?? 0,
            'cibil_score' => $validated['cibil_score'],
            'risk_category' => $riskCategory,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Underwriting report created',
            'data' => $report
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
            'message' => 'Report updated',
            'data' => $report
        ]);
    }

    private function calculateRisk($income, $existingEmi, $cibilScore)
    {
        $emiToIncomeRatio = $income > 0 ? ($existingEmi / $income) * 100 : 100;

        if ($cibilScore >= 750 && $emiToIncomeRatio < 30) {
            return 'low';
        } elseif ($cibilScore >= 600 && $emiToIncomeRatio < 50) {
            return 'medium';
        }

        return 'high';
    }
}