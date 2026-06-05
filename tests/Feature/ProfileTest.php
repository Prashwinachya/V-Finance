<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_page_is_displayed(): void
    {
        $response = $this->get('/settings');

        $response->assertStatus(200);
    }

    public function test_profile_information_can_be_updated(): void
    {
        $user = User::factory()->create([
            'password' => bcrypt('password123'),
        ]);

        $token = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password123',
        ])->json('token');

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->putJson('/api/user/profile', [
                'name' => 'Test User',
                'email' => 'test@example.com',
            ]);

        $response->assertOk();

        $user->refresh();

        $this->assertSame('Test User', $user->name);
        $this->assertSame('test@example.com', $user->email);
    }

    public function test_avatar_can_be_uploaded_for_authenticated_user(): void
    {
        $user = User::factory()->create([
            'password' => bcrypt('password123'),
        ]);

        $token = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password123',
        ])->json('token');

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->post('/api/user/avatar', [
                'avatar' => UploadedFile::fake()->image('avatar.jpg', 300, 300),
            ]);

        $response->assertOk()
            ->assertJsonStructure(['avatarUrl', 'user' => ['id', 'avatarUrl']]);

        $this->assertNotNull($user->fresh()->avatar_url);
    }

    public function test_user_security_preferences_can_be_updated(): void
    {
        $user = User::factory()->create([
            'password' => bcrypt('password123'),
            'payment_pin_enabled' => true,
            'payment_pin_hash' => bcrypt('1234'),
        ]);

        $token = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password123',
        ])->json('token');

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->putJson('/api/user/security', [
                'requirePaymentPin' => true,
                'requirePaymentFingerprint' => false,
            ]);

        $response->assertOk();

        $user->refresh();
        $this->assertTrue($user->require_payment_pin);
        $this->assertFalse($user->require_payment_fingerprint);
    }

    public function test_payment_pin_requires_confirmation_when_provided(): void
    {
        $user = User::factory()->create([
            'password' => bcrypt('password123'),
        ]);

        $token = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password123',
        ])->json('token');

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->putJson('/api/user/pin', [
                'pin' => '1234',
                'confirmPin' => '9999',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['confirmPin']);

        $this->assertFalse((bool) $user->fresh()->payment_pin_enabled);
    }
}
