<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\UserActivityLog;

class SettingsController extends Controller
{
    public function getSettings(Request $request)
    {
        $user = $request->user();
        $settings = $user->settings()->firstOrCreate(
            ['user_id' => $user->id],
            [
                'theme' => 'system',
                'currency' => 'INR',
                'date_format' => 'DD MMM YYYY',
                'language' => 'en',
                'layout_density' => 'comfortable',
                'alerts_config' => [],
                'privacy_config' => [],
                'payment_config' => [],
                'investment_config' => [],
                'notification_preferences' => [],
            ]
        );

        return response()->json($settings);
    }

    public function updateSettings(Request $request)
    {
        $user = $request->user();
        $settings = $user->settings()->firstOrCreate(['user_id' => $user->id]);

        $data = $request->only([
            'theme',
            'currency',
            'date_format',
            'language',
            'layout_density',
            'alerts_config',
            'privacy_config',
            'payment_config',
            'investment_config',
            'notification_preferences',
        ]);

        $settings->update($data);

        return response()->json($settings);
    }

    public function getActiveSessions(Request $request)
    {
        $user = $request->user();
        $tokens = $user->tokens()->orderBy('last_used_at', 'desc')->get();
        
        $sessions = $tokens->map(function ($token) use ($request) {
            $isCurrent = $token->id === $request->user()->currentAccessToken()->id;
            return [
                'id' => $token->id,
                'name' => $token->name,
                'last_used_at' => $token->last_used_at,
                'created_at' => $token->created_at,
                'is_current' => $isCurrent,
            ];
        });

        return response()->json($sessions);
    }

    public function revokeSession(Request $request, $id)
    {
        $user = $request->user();
        
        if ($id === 'all_others') {
            $currentId = $user->currentAccessToken()->id;
            $user->tokens()->where('id', '!=', $currentId)->delete();
            return response()->json(['message' => 'All other sessions revoked']);
        }

        $token = $user->tokens()->where('id', $id)->firstOrFail();
        if ($token->id !== $user->currentAccessToken()->id) {
            $token->delete();
        }
        
        return response()->json(['message' => 'Session revoked']);
    }

    public function lockAccount(Request $request)
    {
        $user = $request->user();
        
        // Revoke all tokens except current
        $currentId = $user->currentAccessToken()->id;
        $user->tokens()->where('id', '!=', $currentId)->delete();
        
        // Log activity
        UserActivityLog::create([
            'user_id' => $user->id,
            'action' => 'account_locked',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'status' => 'success'
        ]);

        // Revoke current token too
        $user->currentAccessToken()->delete();

        return response()->json(['message' => 'Account locked successfully']);
    }
}
