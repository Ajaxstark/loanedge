<?php

namespace Modules\Emi\Services;

use Modules\Emi\Models\EmiSchedule;
use Modules\Loan\Models\Loan;

class EmiService
{
    public function generateSchedule(Loan $loan)
    {
        $principal = $loan->principal_amount;
        $monthlyRate = ($loan->interest_rate / 12) / 100;
        $tenure = $loan->tenure_months;

        $emi = ($principal * $monthlyRate * pow(1 + $monthlyRate, $tenure))
            / (pow(1 + $monthlyRate, $tenure) - 1);

        $balance = $principal;
        $scheduleItems = [];

        for ($i = 1; $i <= $tenure; $i++) {
            $interestComponent = $balance * $monthlyRate;
            $principalComponent = $emi - $interestComponent;
            $balance -= $principalComponent;

            $scheduleItems[] = EmiSchedule::create([
                'loan_id' => $loan->id,
                'installment_number' => $i,
                'due_date' => now()->addMonths($i),
                'emi_amount' => round($emi, 2),
                'principal_component' => round($principalComponent, 2),
                'interest_component' => round($interestComponent, 2),
                'status' => 'pending',
            ]);
        }

        return $scheduleItems;
    }
}