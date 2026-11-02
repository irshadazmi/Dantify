<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Clinic;
use App\Models\Dentist;
use App\Models\Laboratory;
use App\Models\Patient;
use App\Models\Role;
use App\Models\Staff;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Development-only mock OTP.
     *
     * Never enable this driver in production.
     */
    private const MOCK_OTP = '123456';

    private const OTP_TTL_SECONDS = 300;       // 5 minutes
    private const OTP_PROOF_TTL_SECONDS = 600; // 10 minutes
    private const OTP_MAX_ATTEMPTS = 5;

    /**
     * Roles that may be selected during public registration.
     * Role IDs are always resolved on the server.
     */
    private const PUBLIC_REGISTRATION_ROLES = [
        'patient',
        'clinic',
        'dentist',
        'laboratory',
    ];

    /**
     * Send/request an OTP for phone verification.
     *
     * No SMS is sent when the development mock driver is enabled.
     */
    public function sendOtp(Request $request): JsonResponse
    {
        $this->ensureMockOtpEnabled();

        $validated = $request->validate([
            'phone' => [
                'required',
                'string',
                'regex:/^\+?[0-9]{10,15}$/',
            ],
        ]);

        $phone = $validated['phone'];
        $phoneKey = hash('sha256', $phone);

        $sendKey = 'otp:send:' . $phoneKey;

        if (RateLimiter::tooManyAttempts($sendKey, 3)) {
            return response()->json([
                'message' => 'Too many OTP requests. Please try again later.',
            ], 429);
        }

        RateLimiter::hit($sendKey, 600);

        // Invalidate any previous challenge and verification proof.
        Cache::forget('otp:challenge:' . $phoneKey);

        Cache::put(
            'otp:challenge:' . $phoneKey,
            [
                'code_hash' => Hash::make(self::MOCK_OTP),
                'attempts' => 0,
            ],
            self::OTP_TTL_SECONDS
        );

        return response()->json([
            'message' => 'Development OTP is ready. No SMS was sent.',
            'expires_in' => self::OTP_TTL_SECONDS,
        ]);
    }

    /**
     * Verify the OTP and issue a short-lived verification proof.
     */
    public function verifyOtp(Request $request): JsonResponse
    {
        $this->ensureMockOtpEnabled();

        $validated = $request->validate([
            'phone' => [
                'required',
                'string',
                'regex:/^\+?[0-9]{10,15}$/',
            ],
            'otp' => ['required', 'digits:6'],
        ]);

        $phone = $validated['phone'];
        $phoneKey = hash('sha256', $phone);
        $challengeKey = 'otp:challenge:' . $phoneKey;
        $attemptKey = 'otp:verify:' . $phoneKey;

        if (RateLimiter::tooManyAttempts(
            $attemptKey,
            self::OTP_MAX_ATTEMPTS
        )) {
            return response()->json([
                'message' => 'Too many verification attempts. Please try again later.',
            ], 429);
        }

        $challenge = Cache::get($challengeKey);

        if (!is_array($challenge)) {
            return response()->json([
                'message' => 'OTP has expired or was not requested. Please request a new OTP.',
            ], 422);
        }

        RateLimiter::hit($attemptKey, 600);

        if (!Hash::check($validated['otp'], $challenge['code_hash'])) {
            $challenge['attempts'] = ($challenge['attempts'] ?? 0) + 1;

            if ($challenge['attempts'] >= self::OTP_MAX_ATTEMPTS) {
                Cache::forget($challengeKey);
            } else {
                Cache::put(
                    $challengeKey,
                    $challenge,
                    self::OTP_TTL_SECONDS
                );
            }

            return response()->json([
                'message' => 'The OTP is invalid.',
            ], 422);
        }

        Cache::forget($challengeKey);
        RateLimiter::clear($attemptKey);

        // A random proof is returned to the client. The server stores
        // its association with the verified phone and its expiry.
        $proof = Str::random(64);

        Cache::put(
            'otp:proof:' . hash('sha256', $proof),
            ['phone' => $phone],
            self::OTP_PROOF_TTL_SECONDS
        );

        return response()->json([
            'message' => 'Phone verification successful.',
            'verification_token' => $proof,
            'expires_in' => self::OTP_PROOF_TTL_SECONDS,
        ]);
    }

    /**
     * Register an account and return a Sanctum token.
     *
     * Profile creation is intentionally handled separately.
     */
    public function register(Request $request): JsonResponse
    {
        $this->ensureMockOtpEnabled();

        $validated = $request->validate([
            'email' => [
                'required',
                'email',
                'max:255',
                'unique:users,email',
            ],
            'phone' => [
                'required',
                'string',
                'regex:/^\+?[0-9]{10,15}$/',
                'unique:users,phone',
            ],
            'verification_token' => ['required', 'string', 'min:32', 'max:128'],
            'role' => [
                'required',
                'string',
                Rule::in(self::PUBLIC_REGISTRATION_ROLES),
            ],
            'password' => [
                'required',
                'confirmed',
                PasswordRule::min(8),
            ],
            'device_name' => ['nullable', 'string', 'max:100'],
        ]);

        $proofKey = 'otp:proof:' . hash(
            'sha256',
            $validated['verification_token']
        );

        $proof = Cache::get($proofKey);

        if (
            !is_array($proof)
            || !isset($proof['phone'])
            || !hash_equals($proof['phone'], $validated['phone'])
        ) {
            throw ValidationException::withMessages([
                'verification_token' => [
                    'Phone verification is missing, expired, or does not match the phone number.',
                ],
            ]);
        }

        $role = Role::whereRaw(
            'LOWER(name) = ?',
            [$validated['role']]
        )->first();

        if (!$role) {
            throw ValidationException::withMessages([
                'role' => [
                    'This registration role is not configured. Please contact the administrator.',
                ],
            ]);
        }

        $user = User::create([
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'password' => $validated['password'],
            'role_id' => $role->id,
            'is_active' => true,
        ]);

        // Consume the proof only after the account has been created.
        Cache::forget($proofKey);

        $token = $user->createToken(
            $validated['device_name'] ?? 'Dantify API'
        )->plainTextToken;

        $user->load('role');
        $profileStatus = $this->getProfileStatus($user);

        return response()->json([
            'message' => 'Registration successful.',
            'user' => $this->formatAuthUser($user),
            'profile' => $profileStatus,
            'next_step' => $profileStatus['next_step'],
            'token' => $token,
            'token_type' => 'Bearer',
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'device_name' => ['nullable', 'string', 'max:100'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (
            !$user
            || !Hash::check($validated['password'], $user->password)
        ) {
            throw ValidationException::withMessages([
                'email' => ['The supplied credentials are invalid.'],
            ]);
        }

        if (!$user->is_active) {
            return response()->json([
                'message' => 'Your account is inactive. Please contact support.',
            ], 403);
        }

        $token = $user->createToken(
            $validated['device_name'] ?? 'Dantify API'
        )->plainTextToken;

        $user->load('role');
        $profileStatus = $this->getProfileStatus($user);

        return response()->json([
            'message' => 'Login successful.',
            'user' => $this->formatAuthUser($user),
            'profile' => $profileStatus,
            'next_step' => $profileStatus['next_step'],
            'token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $token = $request->user()->currentAccessToken();

        if ($token && method_exists($token, 'delete')) {
            $token->delete();
        }

        return response()->json([
            'message' => 'Logout successful.',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('role');
        $profileStatus = $this->getProfileStatus($user);

        return response()->json([
            'user' => $this->formatAuthUser($user),
            'profile' => $profileStatus,
            'next_step' => $profileStatus['next_step'],
        ]);
    }

    /** Return only the account fields required by the client. */
    private function formatAuthUser(User $user): array
    {
        return [
            'id' => $user->id,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => strtolower($user->role->name ?? ''),
        ];
    }

    /**
     * Return a minimal role-specific profile, if one exists for this account.
     * The profile lookup is always scoped to the authenticated user's user_id.
     */
    private function getProfileStatus(User $user): array
    {
        $role = strtolower($user->role->name ?? '');

        $profileDefinitions = [
            'clinic' => [
                Clinic::class,
                ['id', 'name', 'address', 'city', 'country', 'phone', 'email', 'is_active'],
            ],
            'dentist' => [
                Dentist::class,
                ['id', 'name', 'gender', 'address', 'city', 'country', 'phone', 'email', 'specialization'],
            ],
            'staff' => [
                Staff::class,
                ['id', 'clinic_id', 'name', 'job_title', 'gender', 'address', 'city', 'country', 'phone', 'email', 'is_active'],
            ],
            'laboratory' => [
                Laboratory::class,
                ['id', 'name', 'contact_person', 'email', 'phone', 'address', 'city', 'state', 'country', 'postal_code', 'registration_number', 'is_active'],
            ],
            'patient' => [
                Patient::class,
                ['id', 'name', 'gender', 'dob', 'address', 'city', 'country', 'phone', 'email', 'insurance_provider_id'],
            ],
        ];

        // System roles such as superadmin do not require a profile row.
        if (!isset($profileDefinitions[$role])) {
            return [
                'required' => false,
                'exists' => true,
                'data' => null,
                'next_step' => 'dashboard',
            ];
        }

        [$modelClass, $fields] = $profileDefinitions[$role];
        $profile = $modelClass::query()
            ->where('user_id', $user->id)
            ->first($fields);

        return [
            'required' => true,
            'exists' => $profile !== null,
            'data' => $profile,
            'next_step' => $profile ? 'dashboard' : 'create_profile',
        ];
    }

    public function changePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => [
                'required',
                'confirmed',
                PasswordRule::min(8),
            ],
        ]);

        $user = $request->user();

        if (!Hash::check($validated['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        $user->password = $validated['password'];
        $user->save();

        $user->tokens()->delete();

        return response()->json([
            'message' => 'Password changed successfully. Please log in again.',
        ]);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $status = Password::sendResetLink([
            'email' => $validated['email'],
        ]);

        if (
            $status === Password::RESET_LINK_SENT
            || $status === Password::INVALID_USER
        ) {
            return response()->json([
                'message' => 'If the email is registered, password reset instructions will be sent.',
            ]);
        }

        return response()->json([
            'message' => 'Unable to send password reset instructions right now.',
        ], 429);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => [
                'required',
                'confirmed',
                PasswordRule::min(8),
            ],
        ]);

        $status = Password::reset(
            $validated,
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => $password,
                    'remember_token' => Str::random(60),
                ])->save();

                $user->tokens()->delete();
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json([
                'message' => 'Password reset successful. You can now log in.',
            ]);
        }

        return response()->json([
            'message' => 'The password reset link is invalid or has expired.',
        ], 422);
    }

    /**
     * Hard-coded OTP is allowed only in local/testing environments.
     */
    private function ensureMockOtpEnabled(): void
    {
        if (
            !app()->environment(['local', 'testing'])
            || config('auth.otp_driver') !== 'mock'
        ) {
            abort(503, 'OTP verification is not available with the configured environment.');
        }
    }
}
