<?php

namespace Modules\CustomerAuth\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Modules\CustomerAuth\Services\OtpService;

class CustomerAuthController extends Controller
{
    protected $otpService;

    public function __construct(OtpService $otpService)
    {
        $this->otpService = $otpService;
    }

    /**
     * Step 1: Customer register karta hai -> account banta hai (unverified) -> OTP jata hai email pe
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'customer',
            'is_verified' => false,
        ]);

        $this->otpService->generateAndSend($user->email);

        return response()->json([
            'success' => true,
            'message' => 'Registration successful. Please check your email for OTP verification.',
        ], 201);
    }

    /**
     * Step 2: Registration OTP verify karta hai -> account verified hota hai -> token milta hai
     */
    public function verifyOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'otp' => 'required|digits:6',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $result = $this->otpService->verify($request->email, $request->otp);

        if (!$result['success']) {
            return response()->json(['message' => $result['message']], 422);
        }

        $user = User::where('email', $request->email)->first();
        $user->update(['is_verified' => true]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Account verified successfully',
            'user' => $user,
            'token' => $token,
        ], 200);
    }

    /**
     * Resend OTP - registration verification ke liye
     */
    public function resendOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $this->otpService->generateAndSend($request->email);

        return response()->json([
            'success' => true,
            'message' => 'A new OTP has been sent to your email.',
        ]);
    }

    /**
     * Step 1 of Login: Email + Password check karo.
     * Sahi hai toh token NAHI dete -> naya OTP bhejte hain (2FA).
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::where('email', $request->email)
            ->where('role', 'customer')
            ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        if (!$user->is_verified) {
            return response()->json([
                'message' => 'Please verify your email before logging in.',
                'is_verified' => false,
            ], 403);
        }

        // Password sahi hai -> ab login OTP bhejo (token abhi nahi denge)
        $this->otpService->generateAndSend($user->email);

        return response()->json([
            'success' => true,
            'message' => 'OTP sent to your email. Please verify to complete login.',
            'otp_required' => true,
        ], 200);
    }

    /**
     * Step 2 of Login: OTP verify karo -> ab token do (login complete)
     */
    public function verifyLoginOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'otp' => 'required|digits:6',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $result = $this->otpService->verify($request->email, $request->otp);

        if (!$result['success']) {
            return response()->json(['message' => $result['message']], 422);
        }

        $user = User::where('email', $request->email)
            ->where('role', 'customer')
            ->first();

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'user' => $user,
            'token' => $token,
        ], 200);
    }
}