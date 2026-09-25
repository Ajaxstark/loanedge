<?php

namespace Modules\Emi\Services;

use Carbon\Carbon;
use Modules\Emi\Models\EmiSchedule;
use Modules\Loan\Models\Loan;

class EmiService
{
    /**
     * EMI schedule generate karo (loan disburse hone ke baad).
     */
    public function generateSchedule(Loan $loan)
    {
        $principal = (float) $loan->principal_amount;
        $annualRate = (float) $loan->interest_rate;
        $tenure = (int) $loan->tenure_months;

        if ($tenure <= 0) {
            throw new \InvalidArgumentException('Loan tenure must be greater than zero.');
        }

        $monthlyRate = ($annualRate / 12) / 100;

        // Zero interest loan handle karo
        if ($monthlyRate == 0) {
            $emi = $principal / $tenure;
        } else {
            $emi = ($principal * $monthlyRate * pow(1 + $monthlyRate, $tenure))
                / (pow(1 + $monthlyRate, $tenure) - 1);
        }

        $balance = $principal;
        $scheduleItems = [];
        $startDate = $loan->disbursement_date
            ? Carbon::parse($loan->disbursement_date)
            : now();

        for ($i = 1; $i <= $tenure; $i++) {
            $interestComponent = $balance * $monthlyRate;
            $principalComponent = $emi - $interestComponent;

            // Last installment mein rounding adjust karo
            if ($i === $tenure) {
                $principalComponent = $balance;
                $emi = $principalComponent + $interestComponent;
            }

            $balance -= $principalComponent;

            $scheduleItems[] = EmiSchedule::create([
                'loan_id' => $loan->id,
                'installment_number' => $i,
                'due_date' => $startDate->copy()->addMonths($i)->toDateString(),
                'emi_amount' => round($emi, 2),
                'principal_component' => round($principalComponent, 2),
                'interest_component' => round($interestComponent, 2),
                'status' => 'pending',
            ]);
        }

        return $scheduleItems;
    }

    /**
     * Partial payment ya full payment record karo.
     */
    public function recordPayment(EmiSchedule $installment, float $amount, ?string $paidDate = null): EmiSchedule
    {
        if ($amount <= 0) {
            throw new \InvalidArgumentException('Payment amount must be greater than zero.');
        }

        $alreadyPaid = (float) ($installment->paid_amount ?? 0);
        $totalPaid = $alreadyPaid + $amount;
        $emiAmount = (float) $installment->emi_amount;

        if ($totalPaid > $emiAmount + 0.01) {
            throw new \InvalidArgumentException('Payment exceeds the EMI amount.');
        }

        // Late fee calculate karo (agar due date nikal gayi hai)
        $dueDate = Carbon::parse($installment->due_date);
        $paymentDate = $paidDate ? Carbon::parse($paidDate) : Carbon::today();
        $isLate = $paymentDate->greaterThan($dueDate);

        $installment->update([
            'paid_amount' => round($totalPaid, 2),
            'paid_date' => $paymentDate->toDateString(),
            'status' => $totalPaid >= $emiAmount - 0.01 ? 'paid' : 'partial',
        ]);

        return $installment->fresh();
    }

    /**
     * Loan foreclosure (prepayment) amount calculate karo.
     */
    public function calculateForeclosureAmount(Loan $loan): array
    {
        $pendingEmis = EmiSchedule::where('loan_id', $loan->id)
            ->whereIn('status', ['pending', 'overdue', 'partial'])
            ->orderBy('installment_number')
            ->get();

        if ($pendingEmis->isEmpty()) {
            return [
                'outstanding_principal' => 0,
                'total_payable' => 0,
                'pending_installments' => 0,
            ];
        }

        $outstandingPrincipal = $pendingEmis->sum('principal_component');
        $accruedInterest = $pendingEmis->first()->interest_component;

        // Foreclosure charges (typically 2-4%)
        $foreclosureCharge = $outstandingPrincipal * 0.02;

        return [
            'outstanding_principal' => round($outstandingPrincipal, 2),
            'accrued_interest' => round($accruedInterest, 2),
            'foreclosure_charge' => round($foreclosureCharge, 2),
            'total_payable' => round($outstandingPrincipal + $accruedInterest + $foreclosureCharge, 2),
            'pending_installments' => $pendingEmis->count(),
        ];
    }

    /**
     * Overdue EMIs mark karo (scheduled command ke liye).
     */
    public function markOverdueEmis(): int
    {
        return EmiSchedule::where('status', 'pending')
            ->where('due_date', '<', now()->toDateString())
            ->update(['status' => 'overdue']);
    }
}