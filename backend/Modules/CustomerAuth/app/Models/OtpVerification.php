<?php

namespace Modules\CustomerAuth\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
// use Modules\CustomerAuth\Database\Factories\OtpVerificationFactory;

class OtpVerification extends Model
{
    protected $table = 'otp_verifications';

    protected $fillable = [
        'email',
        'otp_code',
        'expires_at',
        'is_used',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'is_used' => 'boolean',
    ];
}