<?php

namespace App\Http\Controllers;

use App\Services\SubscriptionRadarService;
use Illuminate\View\View;

class SubscriptionRadarController extends Controller
{
    public function index(SubscriptionRadarService $radarService): View
    {
        $result = $radarService->buildForUser(auth()->user());

        return view('subscriptions.radar', [
            'subscriptions' => $result['subscriptions'],
            'summary' => $result['summary'],
        ]);
    }
}
