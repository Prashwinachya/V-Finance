<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $logs = $request->user()->activityLogs()->limit(50)->get();
        return response()->json($logs);
    }
}
