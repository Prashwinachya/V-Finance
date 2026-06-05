<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_screen_can_be_rendered(): void
    {
        $response = $this->get('/login');

        $response->assertStatus(200);
    }

    public function test_users_can_authenticate_using_the_login_screen(): void
    {
        $user = User::factory()->create([
            'email' => 'person@example.com',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);

        $response->assertOk()
            ->assertJsonStructure([
                'token',
                'user' => ['id', 'email'],
            ]);
    }

    public function test_users_can_not_authenticate_with_invalid_password(): void
    {
        $user = User::factory()->create([
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_authenticated_user_can_fetch_profile_with_token(): void
    {
        $user = User::factory()->create([
            'password' => bcrypt('password123'),
        ]);

        $login = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);

        $token = $login->json('token');

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/auth/me');

        $response->assertOk()
            ->assertJsonFragment([
                'email' => $user->email,
            ]);
    }

    public function test_login_rejects_wrong_role_portal_for_student_or_business_accounts(): void
    {
        $user = User::factory()->create([
            'email' => 'biz@example.com',
            'password' => bcrypt('password123'),
            'role' => 'business_user',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password123',
            'role' => 'student',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_super_admin_can_login_to_student_and_business_portals_with_same_credentials(): void
    {
        $businessLogin = $this->postJson('/api/auth/login', [
            'email' => 'vaishnavi@icloud',
            'password' => 'vaishnavi',
            'role' => 'business_user',
        ]);

        $businessLogin->assertOk()
            ->assertJsonPath('user.role', 'super_admin')
            ->assertJsonPath('user.portalRole', 'business_user');

        $studentLogin = $this->postJson('/api/auth/login', [
            'email' => 'vaishnavi@icloud',
            'password' => 'vaishnavi',
            'role' => 'student',
        ]);

        $studentLogin->assertOk()
            ->assertJsonPath('user.role', 'super_admin')
            ->assertJsonPath('user.portalRole', 'student');

        $this->assertNotSame(
            $businessLogin->json('user.email'),
            $studentLogin->json('user.email')
        );
    }
}
