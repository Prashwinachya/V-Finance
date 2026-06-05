<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Budget;
use App\Models\Transaction;
use App\Models\User;
use App\Support\ApiTransformer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    public function stats(Request $request): JsonResponse
    {
        $scopedUsers = $this->scopedUserQuery($request);
        $scopedUserIds = (clone $scopedUsers)->pluck('id');

        $totalUsers = (clone $scopedUsers)->count();
        $totalAdmins = (clone $scopedUsers)->whereIn('role', ['admin', 'super_admin', 'super_admin_student', 'super_admin_business'])->count();
        $totalTransactions = Transaction::query()->whereIn('user_id', $scopedUserIds)->count();
        $totalBudgets = Budget::query()->whereIn('user_id', $scopedUserIds)->count();

        return response()->json([
            'totalUsers' => $totalUsers,
            'totalAdmins' => $totalAdmins,
            'adminUsers' => $totalAdmins,
            'totalTransactions' => $totalTransactions,
            'totalBudgets' => $totalBudgets,
            'users' => [
                'total' => $totalUsers,
                'admins' => $totalAdmins,
            ],
            'transactions' => [
                'count' => $totalTransactions,
                'totalVolume' => (float) Transaction::query()->whereIn('user_id', $scopedUserIds)->sum('amount'),
            ],
            'budgets' => [
                'count' => $totalBudgets,
            ],
        ]);
    }

    public function users(Request $request): JsonResponse
    {
        $items = $this->scopedUserQuery($request)
            ->latest()
            ->get()
            ->map(fn (User $user): array => ApiTransformer::user($user));

        return response()->json($items);
    }

    public function storeUser(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'role' => ['nullable', 'in:user,admin,super_admin'],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'role' => $data['role'] ?? 'user',
            'is_super_admin' => ($data['role'] ?? 'user') === 'super_admin',
        ]);

        return response()->json(ApiTransformer::user($user), 201);
    }

    public function updateUser(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', 'unique:users,email,'.$user->id],
            'role' => ['sometimes', 'in:user,admin,super_admin'],
            'requirePaymentPin' => ['nullable', 'boolean'],
            'requirePaymentFingerprint' => ['nullable', 'boolean'],
        ]);

        $user->fill([
            'name' => $data['name'] ?? $user->name,
            'email' => $data['email'] ?? $user->email,
            'role' => $data['role'] ?? $user->role,
            'is_super_admin' => ($data['role'] ?? $user->role) === 'super_admin',
            'require_payment_pin' => $data['requirePaymentPin'] ?? $user->require_payment_pin,
            'require_payment_fingerprint' => $data['requirePaymentFingerprint'] ?? $user->require_payment_fingerprint,
        ])->save();

        return response()->json(ApiTransformer::user($user));
    }

    public function destroyUser(Request $request, User $user): JsonResponse
    {
        if ((string) $request->user()->id === (string) $user->id) {
            return response()->json(['message' => 'You cannot delete yourself'], 422);
        }

        if (($user->is_super_admin || $user->role === 'super_admin')
            && User::where(function ($query): void {
                $query->where('is_super_admin', true)
                    ->orWhere('role', 'super_admin');
            })->count() <= 1
        ) {
            return response()->json(['message' => 'Cannot delete the last super admin account'], 422);
        }

        DB::transaction(function () use ($user): void {
            $user->tokens()->delete();
            $user->delete();
        });

        return response()->json(['message' => 'User deleted successfully']);
    }

    public function transactions(Request $request): JsonResponse
    {
        $scopedUserIds = $this->scopedUserQuery($request)->pluck('id');

        $items = Transaction::query()
            ->whereIn('user_id', $scopedUserIds)
            ->with(['user', 'wallet'])
            ->latest('date')
            ->limit(200)
            ->get()
            ->map(fn (Transaction $transaction): array => ApiTransformer::transaction($transaction));

        return response()->json($items);
    }

    public function budgets(Request $request): JsonResponse
    {
        $scopedUserIds = $this->scopedUserQuery($request)->pluck('id');

        $items = Budget::query()->whereIn('user_id', $scopedUserIds)->with(['user', 'category'])->latest()->limit(200)->get()->map(function (Budget $budget): array {
            return [
                '_id' => (string) $budget->id,
                'id' => (string) $budget->id,
                'name' => $budget->name,
                'amount' => (float) $budget->amount,
                'period' => $budget->period,
                'startDate' => optional($budget->start_date)->toDateString(),
                'endDate' => optional($budget->end_date)->toDateString(),
                'user' => $budget->user ? ApiTransformer::user($budget->user) : null,
                'category' => $budget->category ? $budget->category->name : null,
                'createdAt' => optional($budget->created_at)->toISOString(),
            ];
        });

        return response()->json($items);
    }

    private function scopedUserQuery(Request $request)
    {
        $role = (string) ($request->user()?->role ?? '');

        if ($role === 'super_admin_student') {
            return User::query()->whereIn('role', ['student', 'user']);
        }

        if (in_array($role, ['super_admin_business', 'super_admin'], true)) {
            return User::query()->where('role', 'business_user');
        }

        return User::query();
    }
}
