<?php

namespace Modules\Collection\Models;

use Illuminate\Database\Eloquent\Model;
use Modules\Lead\Models\Lead;

class CollectionRecord extends Model
{
    protected $table = 'collections';

    protected $fillable = [
        'lead_id',
        'loan_amount',
        'overdue_days',
        'bucket',
        'is_npa',
        'recovery_agent',
        'remarks',
        'status',
    ];

    protected $casts = [
        'is_npa' => 'boolean',
    ];

    public function lead()
    {
        return $this->belongsTo(Lead::class);
    }
}