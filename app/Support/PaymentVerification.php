<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Facades\Crypt;

class PaymentVerification
{
    public static function issueToken(User $user, bool $pinVerified, bool $fingerprintVerified): string
    {
        return Crypt::encryptString(json_encode([
            'id' => (string) $user->id,
            'pay' => true,
            'pinVerified' => $pinVerified,
            'fingerprintVerified' => $fingerprintVerified,
            'expiresAt' => now()->addMinutes(2)->timestamp,
        ], JSON_THROW_ON_ERROR));
    }

    public static function validateToken(?string $token, User $user): ?array
    {
        if (! is_string($token) || $token === '') {
            return null;
        }

        try {
            $payload = json_decode(Crypt::decryptString($token), true, 512, JSON_THROW_ON_ERROR);
        } catch (\Throwable $exception) {
            return null;
        }

        if (($payload['pay'] ?? false) !== true) {
            return null;
        }

        if ((string) ($payload['id'] ?? '') !== (string) $user->id) {
            return null;
        }

        if ((int) ($payload['expiresAt'] ?? 0) < now()->timestamp) {
            return null;
        }

        return $payload;
    }
}
