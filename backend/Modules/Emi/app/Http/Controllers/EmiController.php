<?php

namespace Modules\Emi\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Modules\Emi\Models\EmiSchedule;
use Modules\Emi\Services\EmiService;
use Modules\Loan\Models\Loan;

class EmiController extends Controller
{
    protected $emiService;

    public function __construct(EmiService $emiService)
    {
        $this->emiService = $emiService;
    }

    // Sab EMI schedules, ya ek loan ke (agar loanId diya ho)
    public function index($loanId = null)
    {
        $query = EmiSchedule::with(['loan.lead']);

        if ($loanId) {
            $query->where('loan_id', $loanId);
        }

        $schedule = $query->orderBy('due_date')->get();

        return response()->json([
            'success' => true,
            'data' => $schedule,
        ]);
    }

    // Schedule generate karo (loan disburse hone ke baad)
    public function generate($loanId)
    {
        $loan = Loan::findOrFail($loanId);

        $exists = EmiSchedule::where('loan_id', $loanId)->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'EMI schedule already generated for this loan.',
            ], 422);
        }

        $schedule = $this->emiService->generateSchedule($loan);

        return response()->json([
            'success' => true,
            'message' => 'EMI schedule generated successfully.',
            'data' => $schedule,
        ], 201);
    }

    // Payment record karo (partial ya full)
    public function pay(Request $request, $id)
    {
        $installment = EmiSchedule::findOrFail($id);

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'paid_date' => 'nullable|date',
        ]);

        try {
            $updated = $this->emiService->recordPayment(
                $installment,
                (float) $validated['amount'],
                $validated['paid_date'] ?? null
            );

            return response()->json([
                'success' => true,
                'message' => 'Payment recorded successfully.',
                'data' => $updated,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    // Foreclosure amount calculate karo
    public function foreclosure($loanId)
    {
        $loan = Loan::findOrFail($loanId);
        $breakdown = $this->emiService->calculateForeclosureAmount($loan);

        return response()->json([
            'success' => true,
            'data' => $breakdown,
        ]);
    }
}