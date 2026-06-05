<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\PaymentVerification;
use App\Support\Webauthn;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Hash;

class SecurityController extends Controller
{
    public function registerOptions(Request $request): JsonResponse
    {
        $challenge = Webauthn::generateChallenge();
        $rpId = Webauthn::relyingPartyId($request);
        $credentialIds = Webauthn::credentialIds($request->user());

        $request->user()->forceFill([
            'webauthn_register_challenge' => $challenge,
        ])->save();

        return response()->json([
            'challenge' => $challenge,
            'rp' => ['name' => config('app.name'), 'id' => $rpId],
            'user' => [
                'id' => Webauthn::userHandle($request->user()),
                'name' => $request->user()->email,
                'displayName' => $request->user()->name,
            ],
            'pubKeyCredParams' => [
                ['type' => 'public-key', 'alg' => -7],
                ['type' => 'public-key', 'alg' => -257],
            ],
            'timeout' => 60000,
            'attestation' => 'none',
            'authenticatorSelection' => [
                'authenticatorAttachment' => 'platform',
                'residentKey' => 'preferred',
                'userVerification' => 'required',
            ],
            'excludeCredentials' => array_map(static fn (string $id): array => [
                'id' => $id,
                'type' => 'public-key',
            ], $credentialIds),
            'residentKey' => 'preferred',
        ]);
    }

    public function register(Request $request): JsonResponse
    {
        $rpId = Webauthn::relyingPartyId($request);

        $data = $request->validate([
            'credentialId' => ['nullable', 'string'],
            'id' => ['nullable', 'string'],
            'rawId' => ['nullable', 'string'],
            'publicKey' => ['nullable', 'string'],
            'response' => ['nullable', 'array'],
        ]);

        $credentialId = $data['credentialId'] ?? $data['id'] ?? ($data['rawId'] ?? null);
        if (! $credentialId) {
            return response()->json(['message' => 'Credential id is required'], 422);
        }

        $publicKey = $data['publicKey'] ?? null;
        if (! $publicKey && ! empty($data['response'])) {
            $publicKey = json_encode($data['response']);
        }

        $user = $request->user();
        $credentials = Webauthn::credentials($user);
        $credentialIds = Webauthn::credentialIds($user);

        if (in_array($credentialId, $credentialIds, true)) {
            return response()->json([
                'message' => 'This fingerprint is already added.',
                'fingerprintCount' => count($credentialIds),
                'maxFingerprints' => Webauthn::MAX_FINGERPRINTS,
            ]);
        }

        if (count($credentialIds) >= Webauthn::MAX_FINGERPRINTS) {
            return response()->json([
                'message' => 'Maximum 3 fingerprints can be added. Reset fingerprints to add a new one.',
                'fingerprintCount' => count($credentialIds),
                'maxFingerprints' => Webauthn::MAX_FINGERPRINTS,
            ], 422);
        }

        $credentials[] = [
            'id' => $credentialId,
            'publicKey' => $publicKey,
            'addedAt' => now()->toISOString(),
        ];

        $primary = $credentials[0] ?? ['id' => $credentialId, 'publicKey' => $publicKey];

        try {
            $user->forceFill([
                'webauthn_credential_id' => $primary['id'],
                'webauthn_public_key' => $primary['publicKey'] ?? null,
                'webauthn_credentials_json' => $credentials,
                'fingerprint_enabled' => true,
                'require_payment_fingerprint' => true,
                'webauthn_register_challenge' => null,
                'webauthn_rp_id' => $rpId,
            ])->save();
        } catch (QueryException $exception) {
            $message = strtolower($exception->getMessage());
            if (
                str_contains($message, 'no such column: webauthn_rp_id')
                || str_contains($message, 'no such column: webauthn_credentials_json')
            ) {
                return response()->json([
                    'message' => 'Security setup is temporarily unavailable. Please run database migrations and try again.',
                    'code' => 'missing_schema_column',
                ], 503);
            }

            throw $exception;
        }

        return response()->json([
            'message' => 'Fingerprint added successfully',
            'rpId' => $rpId,
            'fingerprintCount' => count($credentials),
            'maxFingerprints' => Webauthn::MAX_FINGERPRINTS,
        ]);
    }

    public function authOptions(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user->fingerprint_enabled || ! Webauthn::hasCredential($user)) {
            return response()->json(['message' => 'Enable fingerprint in Settings before continuing'], 422);
        }

        $challenge = Webauthn::generateChallenge();
        $currentRpId = Webauthn::relyingPartyId($request);
        $storedRpId = $user->webauthn_rp_id;

        if ($storedRpId && $storedRpId !== $currentRpId) {
            return response()->json([
                'message' => 'Fingerprint was added on '.$storedRpId.'. Add fingerprint on '.$currentRpId.' to use it here.',
                'needsReenrollment' => true,
                'registeredRpId' => $storedRpId,
                'currentRpId' => $currentRpId,
            ], 409);
        }

        $rpId = $storedRpId ?: $currentRpId;

        $user->forceFill([
            'webauthn_auth_challenge' => $challenge,
        ])->save();

        return response()->json([
            'challenge' => $challenge,
            'rpId' => $rpId,
            'timeout' => 60000,
            'userVerification' => 'required',
            'allowCredentials' => array_map(static fn (string $id): array => [[
                'id' => $id,
                'type' => 'public-key',
            ]][0], Webauthn::credentialIds($request->user())),
        ]);
    }

    public function resetFingerprints(Request $request): JsonResponse
    {
        $data = $request->validate([
            'pin' => ['required', 'digits:4'],
        ]);

        $user = $request->user();

        if (! $user->payment_pin_enabled || ! $user->payment_pin_hash || ! Hash::check((string) $data['pin'], $user->payment_pin_hash)) {
            return response()->json(['message' => 'Invalid payment PIN'], 422);
        }

        $user->forceFill([
            'fingerprint_enabled' => false,
            'require_payment_fingerprint' => false,
            'webauthn_credential_id' => null,
            'webauthn_public_key' => null,
            'webauthn_credentials_json' => null,
            'webauthn_rp_id' => null,
            'webauthn_register_challenge' => null,
            'webauthn_auth_challenge' => null,
        ])->save();

        return response()->json([
            'message' => 'All fingerprints have been reset.',
            'fingerprintCount' => 0,
            'maxFingerprints' => Webauthn::MAX_FINGERPRINTS,
        ]);
    }

    public function verifyLoginBiometric(Request $request): JsonResponse
    {
        $data = $request->validate([
            'assertion' => ['required'],
        ]);

        $verified = Webauthn::validateAuthAssertion($request->user(), $data['assertion']);
        if (! $verified) {
            return response()->json(['message' => 'Biometric verification failed'], 422);
        }

        return response()->json(['verified' => true]);
    }

    public function verifyPayment(Request $request): JsonResponse
    {
        $data = $request->validate([
            'pin' => ['nullable', 'digits:4'],
            'paymentPin' => ['nullable', 'digits:4'],
            'assertion' => ['required'],
        ]);

        $user = $request->user();

        $pinVerified = false;
        $submittedPin = $data['paymentPin'] ?? $data['pin'] ?? null;
        if (! empty($submittedPin) && ! empty($user->payment_pin_hash)) {
            $pinVerified = Hash::check($submittedPin, $user->payment_pin_hash);
        }

        if (! $pinVerified) {
            return response()->json(['message' => 'Invalid payment PIN'], 422);
        }

        $fingerprintVerified = Webauthn::validateAuthAssertion($user, $data['assertion']);
        if (! $fingerprintVerified) {
            return response()->json(['message' => 'Fingerprint verification required'], 422);
        }

        $token = PaymentVerification::issueToken($user, $pinVerified, $fingerprintVerified);

        return response()->json([
            'verified' => true,
            'verificationToken' => $token,
            'paymentToken' => $token,
        ]);
    }
}
