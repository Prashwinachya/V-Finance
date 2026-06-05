<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Loan;
use App\Support\ApiTransformer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LoanController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->abortIfNotBusiness($request);

        $items = Loan::query()
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get()
            ->map(fn (Loan $loan): array => ApiTransformer::loan($loan));

        return response()->json($items);
    }

    public function store(Request $request): JsonResponse
    {
        $this->abortIfNotBusiness($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'lender' => ['nullable', 'string', 'max:255'],
            'annualRate' => ['required', 'numeric', 'min:0'],
            'remainingPrincipal' => ['required', 'numeric', 'min:0'],
            'emi' => ['required', 'numeric', 'min:0'],
            'startDate' => ['nullable', 'date'],
            'tenureMonths' => ['nullable', 'integer', 'min:1'],
            'notes' => ['nullable', 'string'],
        ]);

        $loan = Loan::create([
            'user_id' => $request->user()->id,
            'name' => $data['name'],
            'lender' => $data['lender'] ?? null,
            'annual_rate' => $data['annualRate'],
            'remaining_principal' => $data['remainingPrincipal'],
            'emi' => $data['emi'],
            'start_date' => $data['startDate'] ?? null,
            'tenure_months' => $data['tenureMonths'] ?? null,
            'notes' => $data['notes'] ?? null,
        ]);

        return response()->json(ApiTransformer::loan($loan), 201);
    }

    public function update(Request $request, Loan $loan): JsonResponse
    {
        $this->abortIfNotBusiness($request);
        $this->assertOwnership($request, $loan);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'lender' => ['nullable', 'string', 'max:255'],
            'annualRate' => ['sometimes', 'numeric', 'min:0'],
            'remainingPrincipal' => ['sometimes', 'numeric', 'min:0'],
            'emi' => ['sometimes', 'numeric', 'min:0'],
            'startDate' => ['nullable', 'date'],
            'tenureMonths' => ['nullable', 'integer', 'min:1'],
            'notes' => ['nullable', 'string'],
        ]);

        $loan->fill([
            'name' => $data['name'] ?? $loan->name,
            'lender' => $data['lender'] ?? $loan->lender,
            'annual_rate' => $data['annualRate'] ?? $loan->annual_rate,
            'remaining_principal' => $data['remainingPrincipal'] ?? $loan->remaining_principal,
            'emi' => $data['emi'] ?? $loan->emi,
            'start_date' => $data['startDate'] ?? $loan->start_date,
            'tenure_months' => $data['tenureMonths'] ?? $loan->tenure_months,
            'notes' => $data['notes'] ?? $loan->notes,
        ])->save();

        return response()->json(ApiTransformer::loan($loan));
    }

    public function destroy(Request $request, Loan $loan): JsonResponse
    {
        $this->abortIfNotBusiness($request);
        $this->assertOwnership($request, $loan);
        $loan->delete();

        return response()->json(['message' => 'Loan deleted']);
    }

    public function summary(Request $request): JsonResponse
    {
        $this->abortIfNotBusiness($request);

        $loans = Loan::query()->where('user_id', $request->user()->id)->get();

        $totalPrincipal = (float) $loans->sum('remaining_principal');
        $totalEmi = (float) $loans->sum('emi');
        $avgRate = $loans->count() ? round((float) $loans->avg('annual_rate'), 2) : 0.0;

        return response()->json([
            'totalRemainingPrincipal' => $totalPrincipal,
            'totalMonthlyEmi' => $totalEmi,
            'averageAnnualRate' => $avgRate,
            'loanCount' => $loans->count(),
        ]);
    }

    private function assertOwnership(Request $request, Loan $loan): void
    {
        abort_unless((string) $loan->user_id === (string) $request->user()->id, 404);
    }

    private function abortIfNotBusiness(Request $request): void
    {
        $role = (string) ($request->user()?->role ?? 'student');
        if (! in_array($role, ['business_user', 'super_admin_business', 'super_admin'], true)) {
            abort(response()->json([
                'message' => 'Loan Optimizer is available only for Business users.',
            ], 403));
        }
    }
}
