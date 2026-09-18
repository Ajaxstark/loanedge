<?php

namespace Modules\Collection\Models;

use Illuminate\Database\Eloquent\Model;
use Modules\Loan\Models\Loan;

class CollectionRecord extends Model
{
    protected $table = 'collections';

    protected $fillable = [
        'loan_id',
        'overdue_days',
        'bucket',
        'is_npa',
        'recovery_agent',
        'remarks',
        'status',
        'last_calculated_at',
    ];

    protected $casts = [
        'is_npa' => 'boolean',
        'last_calculated_at' => 'datetime',
    ];

    public function loan()
    {
        return $this->belongsTo(Loan::class);
    }
}