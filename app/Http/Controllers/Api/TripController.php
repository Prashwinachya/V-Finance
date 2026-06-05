<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TripBudget;
use App\Support\ApiTransformer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TripController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $items = TripBudget::query()
            ->with('user')
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get()
            ->map(fn (TripBudget $trip): array => ApiTransformer::tripBudget($trip));

        return response()->json($items);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'budgetName' => ['required', 'string', 'max:255'],
            'destination' => ['nullable', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0'],
            'period' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'string', 'max:100'],
            'startDate' => ['nullable', 'date'],
            'endDate' => ['nullable', 'date'],
            'peopleCount' => ['nullable', 'integer', 'min:1'],
            'breakdown' => ['nullable', 'array'],
        ]);

        $trip = TripBudget::create([
            'user_id' => $request->user()->id,
            'budget_name' => $data['budgetName'],
            'destination' => $data['destination'] ?? null,
            'amount' => $data['amount'],
            'period' => $data['period'] ?? 'monthly',
            'category' => $data['category'] ?? 'travel',
            'start_date' => $data['startDate'] ?? null,
            'end_date' => $data['endDate'] ?? null,
            'people_count' => $data['peopleCount'] ?? 1,
            'breakdown' => $data['breakdown'] ?? null,
        ]);

        $trip->load('user');

        return response()->json(ApiTransformer::tripBudget($trip), 201);
    }

    public function update(Request $request, TripBudget $tripBudget): JsonResponse
    {
        $this->assertOwnership($request, $tripBudget);

        $data = $request->validate([
            'budgetName' => ['sometimes', 'string', 'max:255'],
            'destination' => ['nullable', 'string', 'max:255'],
            'amount' => ['sometimes', 'numeric', 'min:0'],
            'period' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'string', 'max:100'],
            'startDate' => ['nullable', 'date'],
            'endDate' => ['nullable', 'date'],
            'peopleCount' => ['nullable', 'integer', 'min:1'],
            'breakdown' => ['nullable', 'array'],
        ]);

        $tripBudget->fill([
            'budget_name' => $data['budgetName'] ?? $tripBudget->budget_name,
            'destination' => $data['destination'] ?? $tripBudget->destination,
            'amount' => $data['amount'] ?? $tripBudget->amount,
            'period' => $data['period'] ?? $tripBudget->period,
            'category' => $data['category'] ?? $tripBudget->category,
            'start_date' => $data['startDate'] ?? $tripBudget->start_date,
            'end_date' => $data['endDate'] ?? $tripBudget->end_date,
            'people_count' => $data['peopleCount'] ?? $tripBudget->people_count,
            'breakdown' => array_key_exists('breakdown', $data) ? $data['breakdown'] : $tripBudget->breakdown,
        ])->save();

        $tripBudget->load('user');

        return response()->json(ApiTransformer::tripBudget($tripBudget));
    }

    public function destroy(Request $request, TripBudget $tripBudget): JsonResponse
    {
        $this->assertOwnership($request, $tripBudget);
        $tripBudget->delete();

        return response()->json(['message' => 'Trip budget deleted']);
    }

    private function assertOwnership(Request $request, TripBudget $tripBudget): void
    {
        abort_unless((string) $tripBudget->user_id === (string) $request->user()->id, 404);
    }
}
