<?php

namespace Modules\Lead\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
// use Modules\Lead\Database\Factories\LeadFactory;

class Lead extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'name',
        'phone',
        'email',
        'loan_amount_required',
        'loan_type',
        'source',
        'status',
        'assigned_to',
    ];

    // protected static function newFactory(): LeadFactory
    // {
    //     // return LeadFactory::new();
    // }
}