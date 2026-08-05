<?php

namespace Modules\Emi\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Modules\Loan\Models\Loan;

class EmiSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'loan_id',
        'installment_number',
        'due_date',
        'emi_amount',
        'principal_component',
        'interest_component',
        'paid_amount',
        'paid_date',
        'status',
    ];

    protected $casts = [
        'due_date' => 'date',
        'paid_date' => 'date',
        'emi_amount' => 'decimal:2',
        'principal_component' => 'decimal:2',
        'interest_component' => 'decimal:2',
        'paid_amount' => 'decimal:2',
    ];

    public function loan()
    {
        return $this->belongsTo(Loan::class);
    }
}