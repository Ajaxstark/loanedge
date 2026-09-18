<?php

namespace Modules\Application\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Modules\Lead\Models\Lead;
use Modules\Product\Models\LoanProduct;

class LoanApplication extends Model
{
    use HasFactory;

    protected $table = 'loan_applications';

    protected $fillable = [
        'application_number',

        'user_id',
        'lead_id',
        'product_id',

        'channel',

        'full_name',
        'email',
        'phone',
        'date_of_birth',
        'marital_status',

        'pan_number',

        'address_line',
        'city',
        'state',
        'pincode',
        'residence_type',

        'employment_type',
        'employer_business_name',
        'monthly_income',
        'existing_emi',
        'work_experience_months',

        'requested_amount',
        'requested_tenure_months',
        'loan_purpose',

        'status',
        'current_step',

        'declaration_accepted',
        'consented_at',
        'submitted_at',
    ];

    protected $casts = [
        'date_of_birth' => 'date',

        'monthly_income' => 'decimal:2',
        'existing_emi' => 'decimal:2',
        'requested_amount' => 'decimal:2',

        'declaration_accepted' => 'boolean',

        'consented_at' => 'datetime',
        'submitted_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::created(function (LoanApplication $application) {
            $application->application_number =
                'LE-' .
                now()->format('Y') .
                '-' .
                str_pad((string) $application->id, 6, '0', STR_PAD_LEFT);

            $application->saveQuietly();
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function lead()
    {
        return $this->belongsTo(Lead::class);
    }

    public function product()
    {
        return $this->belongsTo(LoanProduct::class, 'product_id');
    }
}