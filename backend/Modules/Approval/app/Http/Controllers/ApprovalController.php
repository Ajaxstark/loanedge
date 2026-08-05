<?php

namespace Modules\Approval\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Modules\Approval\Models\LoanApproval;

class ApprovalController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'lead_id' => 'required|exists:leads,id',
            'loan_amount' => 'required|numeric|min:0',
        ]);

        $approverLevel = $validated['loan_amount'] <= 500000
            ? 'branch_manager'
            : 'credit_committee';

        $approval = LoanApproval::create([
            'lead_id' => $validated['lead_id'],
            'loan_amount' => $validated['loan_amount'],
            'approver_level' => $approverLevel,
            'status' => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Approval request created',
            'data' => $approval
        ], 201);
    }

    // Sab approvals, ya ek lead ke (agar leadId diya ho)
    public function index($leadId = null)
    {
        $query = LoanApproval::with('lead');

        if ($leadId) {
            $query->where('lead_id', $leadId);
        }

        $approvals = $query->latest()->get();

        return response()->json([
            'success' => true,
            'data' => $approvals
        ]);
    }

    public function update(Request $request, $id)
    {
        $approval = LoanApproval::findOrFail($id);

        $validated = $request->validate([
            'status' => 'required|in:approved,rejected',
            'remarks' => 'nullable|string',
        ]);

        $approval->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Approval status updated',
            'data' => $approval
        ]);
    }
}