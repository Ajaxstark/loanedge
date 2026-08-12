<?php

namespace Modules\CustomerAuth\Services;

use App\Mail\OtpMail;
use Illuminate\Support\Facades\Mail;
use Modules\CustomerAuth\Models\OtpVerification;

class OtpService
{
    /**
     * Naya OTP generate karo, database mein save karo, aur email pe bhejo.
     */
    public function generateAndSend($email)
    {
        // 6-digit random number banao, jaise 100000 se 999999 ke beech
        $otpCode = random_int(100000, 999999);

        // Pehle is email ka koi purana unused OTP hai toh usse "used" mark kar do
        // (taaki ek email ka sirf ek hi active OTP rahe)
        OtpVerification::where('email', $email)
            ->where('is_used', false)
            ->update(['is_used' => true]);

        // Naya OTP record banao
        OtpVerification::create([
            'email' => $email,
            'otp_code' => $otpCode,
            'expires_at' => now()->addMinutes(10),
            'is_used' => false,
        ]);

        // Email bhejo
        Mail::to($email)->send(new OtpMail($otpCode));

        return $otpCode;
    }

    /**
     * OTP verify karo — check karo match hota hai, expire nahi hua, aur used nahi hai.
     */
    public function verify($email, $otpCode)
    {
        $record = OtpVerification::where('email', $email)
            ->where('otp_code', $otpCode)
            ->where('is_used', false)
            ->latest()
            ->first();

        if (!$record) {
            return ['success' => false, 'message' => 'Invalid OTP'];
        }

        if ($record->expires_at->isPast()) {
            return ['success' => false, 'message' => 'OTP has expired'];
        }

        // OTP sahi hai — use ho gaya, mark kar do
        $record->update(['is_used' => true]);

        return ['success' => true, 'message' => 'OTP verified successfully'];
    }
}