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
            'data' => $schedule
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
                'message' => 'EMI schedule already generated for this loan'
            ], 422);
        }

        $schedule = $this->emiService->generateSchedule($loan);

        return response()->json([
            'success' => true,
            'message' => 'EMI schedule generated',
            'data' => $schedule
        ], 201);
    }

    // Payment record karo (ek installment pay hua)
    public function pay($id)
    {
        $installment = EmiSchedule::findOrFail($id);

        $installment->update([
            'paid_amount' => $installment->emi_amount,
            'paid_date' => now(),
            'status' => 'paid',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Payment recorded',
            'data' => $installment
        ]);
    }
}