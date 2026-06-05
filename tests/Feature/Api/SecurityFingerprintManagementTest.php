<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SecurityFingerprintManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_add_up_to_three_fingerprints(): void
    {
        $user = User::factory()->create([
            'role' => 'student',
        ]);

        Sanctum::actingAs($user);

        for ($i = 1; $i <= 3; $i++) {
            $this->postJson('/api/security/webauthn/register', [
                'credentialId' => 'credential-'.$i,
                'publicKey' => 'public-key-'.$i,
            ])
                ->assertOk()
                ->assertJsonPath('fingerprintCount', $i);
        }

        $this->postJson('/api/security/webauthn/register', [
            'credentialId' => 'credential-4',
            'publicKey' => 'public-key-4',
        ])
            ->assertStatus(422)
            ->assertJsonFragment(['message' => 'Maximum 3 fingerprints can be added. Reset fingerprints to add a new one.']);

        $authOptions = $this->getJson('/api/security/webauthn/auth-options');

        $authOptions->assertOk();
        $this->assertCount(3, $authOptions->json('allowCredentials'));
    }

    public function test_user_can_reset_fingerprints_with_valid_pin(): void
    {
        $user = User::factory()->create([
            'role' => 'student',
            'payment_pin_enabled' => true,
            'payment_pin_hash' => Hash::make('1234'),
            'fingerprint_enabled' => true,
            'webauthn_credential_id' => 'legacy-credential',
            'webauthn_public_key' => 'legacy-public-key',
            'webauthn_credentials_json' => [
                ['id' => 'legacy-credential', 'publicKey' => 'legacy-public-key', 'addedAt' => now()->toISOString()],
            ],
            'webauthn_rp_id' => 'localhost',
        ]);

        Sanctum::actingAs($user);

        $this->deleteJson('/api/security/webauthn/reset', [
            'pin' => '0000',
        ])->assertStatus(422)
            ->assertJsonFragment(['message' => 'Invalid payment PIN']);

        $this->deleteJson('/api/security/webauthn/reset', [
            'pin' => '1234',
        ])->assertOk()
            ->assertJsonPath('fingerprintCount', 0);

        $user->refresh();

        $this->assertFalse((bool) $user->fingerprint_enabled);
        $this->assertNull($user->webauthn_credential_id);
        $this->assertNull($user->webauthn_credentials_json);
    }
}
