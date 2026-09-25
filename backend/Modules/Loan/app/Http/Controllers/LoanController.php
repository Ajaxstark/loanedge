<?php

namespace Modules\Loan\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Modules\Approval\Models\LoanApproval;
use Modules\Loan\Models\Loan;

class LoanController extends Controller
{
    /**
     * Sab loans, ya ek lead ke loans (agar leadId diya ho).
     */
    public function index($leadId = null)
    {
        $query = Loan::with(['lead', 'loanProduct', 'approval']);

        if ($leadId) {
            $query->where('lead_id', $leadId);
        }

        $loans = $query->latest()->paginate(50);

        return response()->json([
            'success' => true,
            'data' => $loans,
        ]);
    }

    /**
     * Naya loan sanction karo (approval ke baad).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'lead_id' => 'required|exists:leads,id',
            'approval_id' => 'required|exists:loan_approvals,id',
            'loan_product_id' => 'required|exists:loan_products,id',
            'principal_amount' => 'required|numeric|min:0',
            'interest_rate' => 'required|numeric|min:0|max:60',
            'tenure_months' => 'required|integer|min:1|max:360',
        ]);

        $approval = LoanApproval::find($validated['approval_id']);

        // Check 1: Approval approved hai ya nahi
        if ($approval->status !== 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'Loan cannot be sanctioned without an approved approval.',
            ], 422);
        }

        // Check 2: Amount match karta hai ya nahi
        if ((float) $approval->loan_amount !== (float) $validated['principal_amount']) {
            return response()->json([
                'success' => false,
                'message' => 'Loan amount does not match the approved amount.',
                'approved_amount' => $approval->loan_amount,
                'requested_amount' => $validated['principal_amount'],
            ], 422);
        }

        // Check 3: Yeh approval already use hua hai ya nahi
        if (Loan::where('approval_id', $approval->id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'This approval has already been used for another loan.',
            ], 422);
        }

        // Check 4: Lead match karta hai ya nahi
        if ($approval->lead_id !== (int) $validated['lead_id']) {
            return response()->json([
                'success' => false,
                'message' => 'Lead does not match the approval.',
            ], 422);
        }

        $loan = Loan::create([
            ...$validated,
            'status' => 'sanctioned',
            'sanction_date' => now(),
        ]);

        $loan->load(['lead', 'loanProduct', 'approval']);

        return response()->json([
            'success' => true,
            'message' => 'Loan sanctioned successfully',
            'data' => $loan,
        ], 201);
    }

    /**
     * Ek specific loan dekho.
     */
    public function show($id)
    {
        $loan = Loan::with([
            'lead',
            'loanProduct',
            'approval',
            'emiSchedules',
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $loan,
        ]);
    }

    /**
     * Disburse karo (status update + EMI auto-generate).
     */
    public function disburse($id)
    {
        try {
            $loan = DB::transaction(function () use ($id) {
                $loan = Loan::where('id', $id)->lockForUpdate()->first();

                if (!$loan) {
                    throw new \Exception('Loan not found.');
                }

                if ($loan->status !== 'sanctioned') {
                    throw new \Exception('Only sanctioned loans can be disbursed.');
                }

                $loan->update([
                    'status' => 'disbursed',
                    'disbursement_date' => now(),
                ]);

                // EMI schedule auto-generate karo
                $exists = \Modules\Emi\Models\EmiSchedule::where('loan_id', $loan->id)->exists();

                if (!$exists) {
                    app(\Modules\Emi\Services\EmiService::class)->generateSchedule($loan);
                }

                return $loan->fresh()->load(['lead', 'loanProduct']);
            });

            return response()->json([
                'success' => true,
                'message' => 'Loan disbursed successfully. EMI schedule generated.',
                'data' => $loan,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Loan close karo (fully repaid hone ke baad).
     */
    public function close($id)
    {
        $loan = Loan::findOrFail($id);

        if (!in_array($loan->status, ['disbursed', 'active'])) {
            return response()->json([
                'success' => false,
                'message' => 'Only active or disbursed loans can be closed.',
            ], 422);
        }

        $pendingEmis = \Modules\Emi\Models\EmiSchedule::where('loan_id', $loan->id)
            ->where('status', '!=', 'paid')
            ->count();

        if ($pendingEmis > 0) {
            return response()->json([
                'success' => false,
                'message' => "Cannot close loan. {$pendingEmis} EMI(s) are still pending.",
            ], 422);
        }

        $loan->update(['status' => 'closed']);

        return response()->json([
            'success' => true,
            'message' => 'Loan closed successfully.',
            'data' => $loan->fresh(),
        ]);
    }
}