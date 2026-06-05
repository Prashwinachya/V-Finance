<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Http\Request;

class Webauthn
{
    public const MAX_FINGERPRINTS = 3;

    public static function generateChallenge(): string
    {
        return self::base64UrlEncode(random_bytes(32));
    }

    public static function userHandle(User $user): string
    {
        return self::base64UrlEncode((string) $user->id);
    }

    public static function relyingPartyId(Request $request): string
    {
        $originHost = self::hostFromUrl($request->headers->get('Origin'));
        $refererHost = self::hostFromUrl($request->headers->get('Referer'));
        $requestHost = $request->getHost();
        $configHost = self::hostFromUrl(config('app.url'));

        foreach ([$originHost, $refererHost, $requestHost, $configHost] as $candidate) {
            if (is_string($candidate) && $candidate !== '') {
                return $candidate;
            }
        }

        return 'localhost';
    }

    public static function validateAuthAssertion(User $user, mixed $assertion, bool $consumeChallenge = true): bool
    {
        if (! $user->fingerprint_enabled || ! self::hasCredential($user)) {
            return false;
        }

        $challenge = (string) ($user->webauthn_auth_challenge ?? '');
        if ($challenge === '') {
            return false;
        }

        $normalized = self::toArray($assertion);
        if (! is_array($normalized)) {
            return false;
        }

        $assertionId = (string) ($normalized['id'] ?? $normalized['rawId'] ?? '');
        if ($assertionId === '' || ! in_array($assertionId, self::credentialIds($user), true)) {
            return false;
        }

        $response = self::toArray($normalized['response'] ?? null);
        if (! is_array($response)) {
            return false;
        }

        $clientDataJson = (string) ($response['clientDataJSON'] ?? '');
        if ($clientDataJson === '') {
            return false;
        }

        $decodedClientData = self::decodeBase64Url($clientDataJson);
        if ($decodedClientData === null) {
            return false;
        }

        $clientData = json_decode($decodedClientData, true);
        if (! is_array($clientData)) {
            return false;
        }

        if (($clientData['type'] ?? '') !== 'webauthn.get') {
            return false;
        }

        if (($clientData['challenge'] ?? '') !== $challenge) {
            return false;
        }

        if ($consumeChallenge) {
            $user->forceFill(['webauthn_auth_challenge' => null])->save();
        }

        return true;
    }

    public static function credentials(User $user): array
    {
        $items = $user->webauthn_credentials_json;
        if (! is_array($items)) {
            $items = [];
        }

        $normalized = [];

        foreach ($items as $item) {
            if (! is_array($item)) {
                continue;
            }

            $id = trim((string) ($item['id'] ?? ''));
            if ($id === '') {
                continue;
            }

            $normalized[] = [
                'id' => $id,
                'publicKey' => isset($item['publicKey']) ? (string) $item['publicKey'] : null,
                'addedAt' => isset($item['addedAt']) ? (string) $item['addedAt'] : null,
            ];
        }

        if (empty($normalized) && ! empty($user->webauthn_credential_id)) {
            $normalized[] = [
                'id' => (string) $user->webauthn_credential_id,
                'publicKey' => $user->webauthn_public_key ? (string) $user->webauthn_public_key : null,
                'addedAt' => null,
            ];
        }

        return $normalized;
    }

    public static function credentialIds(User $user): array
    {
        return array_values(array_unique(array_map(
            static fn (array $item): string => (string) $item['id'],
            self::credentials($user)
        )));
    }

    public static function credentialCount(User $user): int
    {
        return count(self::credentialIds($user));
    }

    public static function hasCredential(User $user): bool
    {
        return self::credentialCount($user) > 0;
    }

    public static function base64UrlEncode(string $binary): string
    {
        return rtrim(strtr(base64_encode($binary), '+/', '-_'), '=');
    }

    public static function decodeBase64Url(string $value): ?string
    {
        $base64 = strtr($value, '-_', '+/');
        $padding = strlen($base64) % 4;
        if ($padding > 0) {
            $base64 .= str_repeat('=', 4 - $padding);
        }

        $decoded = base64_decode($base64, true);

        return $decoded === false ? null : $decoded;
    }

    private static function toArray(mixed $value): mixed
    {
        if (is_array($value)) {
            return $value;
        }

        if (is_object($value)) {
            return json_decode(json_encode($value), true);
        }

        return $value;
    }

    private static function hostFromUrl(?string $url): ?string
    {
        if (! is_string($url) || trim($url) === '') {
            return null;
        }

        $host = parse_url(trim($url), PHP_URL_HOST);

        return is_string($host) && $host !== '' ? $host : null;
    }
}
