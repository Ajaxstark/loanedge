<?php

namespace Modules\Loan\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Loan extends Model
{
    use HasFactory;

    protected $fillable = [
        'lead_id',
        'approval_id',
        'loan_product_id',
        'principal_amount',
        'interest_rate',
        'tenure_months',
        'status',
        'sanction_date',
        'disbursement_date',
    ];

    public function lead()
    {
        return $this->belongsTo(\Modules\Lead\Models\Lead::class);
    }

    public function approval()
    {
        return $this->belongsTo(\Modules\Approval\Models\LoanApproval::class);
    }

    public function loanProduct()
    {
        return $this->belongsTo(\Modules\Product\Models\LoanProduct::class);
    }
}