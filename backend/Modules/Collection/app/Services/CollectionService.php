<?php

namespace Modules\Collection\Services;

use Carbon\Carbon;
use Modules\Collection\Models\CollectionRecord;
use Modules\Emi\Models\EmiSchedule;
use Modules\Loan\Models\Loan;

class CollectionService
{
    // Ek loan ke liye overdue calculate karo aur collection record update karo
    public function recalculateForLoan(Loan $loan)
    {
        $today = Carbon::today();

        // Sabse purani unpaid EMI dhoondo jiski due_date nikal chuki hai
        $oldestOverdueEmi = EmiSchedule::where('loan_id', $loan->id)
            ->where('status', '!=', 'paid')
            ->where('due_date', '<', $today)
            ->orderBy('due_date')
            ->first();

        if (!$oldestOverdueEmi) {
            // Koi overdue EMI nahi mili -> loan is current
            $overdueDays = 0;
            $bucket = 'current';
            $isNpa = false;
        } else {
            $overdueDays = $oldestOverdueEmi->due_date->diffInDays($today);
            $bucket = $this->calculateBucket($overdueDays);
            $isNpa = $overdueDays >= 90;

            // Us EMI ka status 'overdue' kar do agar abhi tak nahi hua
            if ($oldestOverdueEmi->status !== 'overdue') {
                $oldestOverdueEmi->update(['status' => 'overdue']);
            }
        }

        // Agar NPA ho gaya, Loan ka status bhi update karo
        if ($isNpa && $loan->status !== 'npa') {
            $loan->update(['status' => 'npa']);
        }

        // Collection record create/update karo (ek loan ka ek hi record)
        return CollectionRecord::updateOrCreate(
            ['loan_id' => $loan->id],
            [
                'overdue_days' => $overdueDays,
                'bucket' => $bucket,
                'is_npa' => $isNpa,
                'last_calculated_at' => now(),
            ]
        );
    }

    // Sab active/disbursed loans ke liye recalculate karo
    public function recalculateAll()
    {
        $loans = Loan::whereIn('status', ['disbursed', 'active', 'npa'])->get();

        $records = [];
        foreach ($loans as $loan) {
            $records[] = $this->recalculateForLoan($loan);
        }

        return $records;
    }

    private function calculateBucket($days)
    {
        if ($days <= 0) {
            return 'current';
        } elseif ($days <= 30) {
            return '0-30';
        } elseif ($days <= 60) {
            return '30-60';
        } elseif ($days <= 90) {
            return '60-90';
        }

        return '90+';
    }
}