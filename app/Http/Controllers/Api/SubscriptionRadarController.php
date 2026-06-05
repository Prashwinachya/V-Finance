<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SubscriptionRadarService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionRadarController extends Controller
{
    public function __construct(private readonly SubscriptionRadarService $subscriptionRadarService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        return response()->json($this->subscriptionRadarService->buildForUser($request->user()));
    }
}
