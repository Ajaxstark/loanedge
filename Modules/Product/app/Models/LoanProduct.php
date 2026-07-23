<?php

namespace Modules\Product\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class LoanProduct extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'loan_type',
        'interest_rate',
        'min_amount',
        'max_amount',
        'min_tenure_months',
        'max_tenure_months',
        'status',
    ];
}