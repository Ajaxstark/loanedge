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

        // Customer role hardcoded rakha hai -> koi khud se 'admin' role nahi bhej sakta
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'customer',
            'is_verified' => false,
        ]);

        // OTP generate karke email pe bhejo
        $this->otpService->generateAndSend($user->email);

        return response()->json([
            'success' => true,
            'message' => 'Registration successful. Please check your email for OTP verification.',
        ], 201);
    }

    /**
     * Step 2: Customer OTP verify karta hai -> account verified hota hai -> token milta hai (login ho jata hai)
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

        // OTP sahi tha -> user ko verified mark karo
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
     * Agar OTP expire ho gaya ya customer ko dobara chahiye, is se naya OTP bhej sakte hain
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
     * Login -> sirf verified customer hi login kar payega
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

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'user' => $user,
            'token' => $token,
        ], 200);
    }
}