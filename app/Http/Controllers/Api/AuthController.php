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

    private const DEFAULT_SUPER_ADMIN_EMAILS = [
        'prashwinn@icloud.com',
        'prashwin@icloud.com',
        'vaishnavi@icloud.com',
    ];

    private const DEFAULT_SUPER_ADMIN_NAME = 'Prashwin';

    private const DEFAULT_SUPER_ADMIN_PASSWORD = 'Vaishnavi';

    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'role' => ['nullable', 'in:student,business,business_user'],
        ]);

        $email = strtolower(trim($data['email']));
        $rawRole = $data['role'] ?? 'student';
        $normalizedRole = in_array($rawRole, ['business', 'business_user'], true) ? 'business_user' : 'student';

        $user = User::create([
            'name' => $data['name'],
            'email' => $email,
            'password' => $data['password'],
            'role' => $normalizedRole,
            'portal' => $normalizedRole,
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
            'role' => ['nullable', 'in:student,business,business_user'],
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
        if ($requestedRole === 'business') {
            $requestedRole = 'business_user';
        }

        $userRole = (string) ($user->role ?? 'student');
        if ($userRole === 'user') {
            $userRole = 'student';
        }
        if ($userRole === 'business') {
            $userRole = 'business_user';
        }

        if ($requestedRole && in_array($userRole, ['student', 'business_user'], true) && $requestedRole !== $userRole) {
            throw ValidationException::withMessages([
                'email' => ['This account is registered as '.str_replace('_', ' ', $userRole).'. Please use the correct role portal.'],
            ]);
        }

        $fillAttrs = [
            'last_login_at' => now(),
            'login_count' => (int) $user->login_count + 1,
        ];

        if ($user->isAdmin() && $requestedRole) {
            $fillAttrs['portal'] = $requestedRole;
        }

        $user->forceFill($fillAttrs)->save();

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
        if (! in_array($email, self::DEFAULT_SUPER_ADMIN_EMAILS, true)) {
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

        $adminPassword = $email === 'vaishnavi@icloud.com' ? 'vaishnavi' : self::DEFAULT_SUPER_ADMIN_PASSWORD;
        $adminName = $email === 'vaishnavi@icloud.com' ? 'Vaishnavi' : self::DEFAULT_SUPER_ADMIN_NAME;

        // Create the default super-admin with a hashed password if it doesn't exist.
        $createAttrs = [
            'name' => $adminName,
            'email' => $email,
            'password' => Hash::make($adminPassword),
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
