<?php

namespace Modules\Loan\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Modules\Loan\Models\Loan;

class LoanController extends Controller
{
    // Sab loans, ya ek lead ke loans (agar leadId diya ho)
    public function index($leadId = null)
    {
        $query = Loan::with(['lead', 'loanProduct']);

        if ($leadId) {
            $query->where('lead_id', $leadId);
        }

        $loans = $query->latest()->get();

        return response()->json([
            'success' => true,
            'data' => $loans
        ]);
    }

    // Naya loan sanction karo (approval ke baad)
    public function store(Request $request)
    {
        $validated = $request->validate([
            'lead_id' => 'required|exists:leads,id',
            'approval_id' => 'required|exists:loan_approvals,id',
            'loan_product_id' => 'required|exists:loan_products,id',
            'principal_amount' => 'required|numeric|min:0',
            'interest_rate' => 'required|numeric|min:0',
            'tenure_months' => 'required|integer|min:1',
        ]);

        $loan = Loan::create([
            ...$validated,
            'status' => 'sanctioned',
            'sanction_date' => now(),
        ]);

        $loan->load(['lead', 'loanProduct']);

        return response()->json([
            'success' => true,
            'message' => 'Loan sanctioned successfully',
            'data' => $loan
        ], 201);
    }

    // Ek specific loan dekho
    public function show($id)
    {
        $loan = Loan::with(['lead', 'loanProduct', 'approval'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $loan
        ]);
    }

    // Disburse karo (status update)
    public function disburse($id)
    {
        $loan = Loan::findOrFail($id);

        if ($loan->status !== 'sanctioned') {
            return response()->json([
                'success' => false,
                'message' => 'Only sanctioned loans can be disbursed'
            ], 422);
        }

        $loan->update([
            'status' => 'disbursed',
            'disbursement_date' => now(),
        ]);

        // EMI Module banne ke baad yahan schedule auto-generate hogi
        // app(\Modules\Emi\Services\EmiService::class)->generateSchedule($loan);

        $loan->load(['lead', 'loanProduct']);

        return response()->json([
            'success' => true,
            'message' => 'Loan disbursed successfully',
            'data' => $loan
        ]);
    }

    // Loan close karo (fully repaid hone ke baad)
    public function close($id)
    {
        $loan = Loan::findOrFail($id);

        if ($loan->status !== 'disbursed' && $loan->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Only active or disbursed loans can be closed'
            ], 422);
        }

        $loan->update([
            'status' => 'closed',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Loan closed successfully',
            'data' => $loan
        ]);
    }
}