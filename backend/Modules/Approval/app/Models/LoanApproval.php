<?php

namespace Modules\Approval\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Modules\Lead\Models\Lead;

class LoanApproval extends Model
{
    use HasFactory;

    protected $table = 'loan_approvals';

    protected $fillable = [
        'lead_id',
        'loan_amount',
        'approver_level',
        'status',
        'remarks',
    ];

    public function lead()
    {
        return $this->belongsTo(Lead::class);
    }
}