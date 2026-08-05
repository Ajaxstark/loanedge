<?php

namespace Modules\Underwriting\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Modules\Lead\Models\Lead;

class UnderwritingReport extends Model
{
    use HasFactory;

    protected $table = 'underwriting_reports';

    protected $fillable = [
        'lead_id',
        'monthly_income',
        'existing_emi',
        'cibil_score',
        'risk_category',
        'remarks',
    ];

    public function lead()
    {
        return $this->belongsTo(\Modules\Lead\Models\Lead::class);
    }
    
}
