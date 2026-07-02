<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\RealLifeDataBootstrapService;
use App\Support\ApiTransformer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
        public function __construct(private readonly RealLifeDataBootstrapService $realLifeDataBootstrapService)
        {
        }

    // Single canonical super admin email (no +student or +business suffixes)
    private const DEFAULT_SUPER_ADMIN_EMAIL = 'prashwinn@icloud.com';

    private const DEFAULT_SUPER_ADMIN_NAME = 'Prashwin';

    private const DEFAULT_SUPER_ADMIN_PASSWORD = 'Vaishnavi';

    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'role' => ['nullable', 'in:student,business_user'],
        ]);

        $email = strtolower(trim($data['email']));

        $user = User::create([
            'name' => $data['name'],
            'email' => $email,
            'password' => $data['password'],
            'role' => $data['role'] ?? 'student',
            'require_payment_fingerprint' => true,
            'login_count' => 1,
            'last_login_at' => now(),
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        // Do not auto-bootstrap demo data for users — keep new accounts empty by default.
        $user->refresh();

        return response()->json([
            'token' => $token,
            'user' => ApiTransformer::user($user),
        ], 201);
    }

    /**
     * @throws ValidationException
     */
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'role' => ['nullable', 'in:student,business_user'],
        ]);

        $email = strtolower(trim($data['email']));
        $normalizedEmail = $this->normalizeLoginEmail($email, $data['role'] ?? null);

        $this->ensureDefaultSuperAdmin($normalizedEmail);

        $user = User::where('email', $normalizedEmail)->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $requestedRole = $data['role'] ?? null;
        $userRole = (string) ($user->role ?? 'student');
        if ($userRole === 'user') {
            $userRole = 'student';
        }

        if ($requestedRole && in_array($userRole, ['student', 'business_user'], true) && $requestedRole !== $userRole) {
            throw ValidationException::withMessages([
                'email' => ['This account is registered as '.str_replace('_', ' ', $userRole).'. Please use the correct role portal.'],
            ]);
        }

        $user->forceFill([
            'last_login_at' => now(),
            'login_count' => (int) $user->login_count + 1,
        ])->save();

        $token = $user->createToken('auth-token')->plainTextToken;

        // Do not auto-bootstrap demo data for users — keep new accounts empty by default.
        $user->refresh();

        return response()->json([
            'token' => $token,
            'user' => ApiTransformer::user($user),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(ApiTransformer::user($request->user()));
    }

    private function normalizeLoginEmail(string $email, ?string $requestedRole = null): string
    {
        // Do not append portal tags to emails. Keep the email as provided.
        return $email;
    }
    private function ensureDefaultSuperAdmin(string $email): void
    {
        if ($email !== self::DEFAULT_SUPER_ADMIN_EMAIL) {
            return;
        }

        $user = User::where('email', $email)->first();

        if ($user) {
            // Do not overwrite sensitive fields (password/avatar). Only ensure admin flags.
            $attrs = [
                'role' => 'super_admin',
                'is_super_admin' => true,
            ];

            if (
                function_exists('\Schema') &&
                \Illuminate\Support\Facades\Schema::hasColumn('users', 'portal')
            ) {
                $attrs['portal'] = $user->portal ?? 'student';
            }

            $user->forceFill($attrs)->save();

            return;
        }

        // Create the default super-admin with a hashed password if it doesn't exist.
        $createAttrs = [
            'name' => self::DEFAULT_SUPER_ADMIN_NAME,
            'email' => $email,
            'password' => Hash::make(self::DEFAULT_SUPER_ADMIN_PASSWORD),
            'role' => 'super_admin',
            'is_super_admin' => true,
            'email_verified_at' => now(),
        ];

        if (function_exists('\Schema') && \Illuminate\Support\Facades\Schema::hasColumn('users', 'portal')) {
            $createAttrs['portal'] = 'student';
        }

        User::create($createAttrs);
    }
}
