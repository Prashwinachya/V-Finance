<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_can_be_rendered(): void
    {
        $response = $this->get('/register');

        $response->assertStatus(200);
    }

    public function test_new_users_can_register(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'token',
                'user' => ['id', 'email', 'name'],
            ]);
    }

    public function test_new_users_can_choose_student_or_business_role_on_signup(): void
    {
        $student = $this->postJson('/api/auth/register', [
            'name' => 'Student User',
            'email' => 'student@example.com',
            'password' => 'password123',
            'role' => 'student',
        ]);

        $student->assertStatus(201)
            ->assertJsonPath('user.role', 'student')
            ->assertJsonPath('user.portal', 'student')
            ->assertJsonPath('user.portalRole', 'student');

        $this->assertDatabaseHas('users', [
            'email' => 'student@example.com',
            'role' => 'student',
            'portal' => 'student',
        ]);

        $business = $this->postJson('/api/auth/register', [
            'name' => 'Business User',
            'email' => 'business@example.com',
            'password' => 'password123',
            'role' => 'business_user',
        ]);

        $business->assertStatus(201)
            ->assertJsonPath('user.role', 'business_user')
            ->assertJsonPath('user.portal', 'business_user')
            ->assertJsonPath('user.portalRole', 'business_user');

        $this->assertDatabaseHas('users', [
            'email' => 'business@example.com',
            'role' => 'business_user',
            'portal' => 'business_user',
        ]);

        // Support 'business' as an alias for business_user
        $businessAlias = $this->postJson('/api/auth/register', [
            'name' => 'Business User Two',
            'email' => 'business2@example.com',
            'password' => 'password123',
            'role' => 'business',
        ]);

        $businessAlias->assertStatus(201)
            ->assertJsonPath('user.role', 'business_user')
            ->assertJsonPath('user.portalRole', 'business_user');
    }

    public function test_registered_users_can_login_and_access_settings(): void
    {
        $this->postJson('/api/auth/register', [
            'name' => 'Active Business User',
            'email' => 'active_biz@example.com',
            'password' => 'secret123',
            'role' => 'business_user',
        ])->assertStatus(201);

        $login = $this->postJson('/api/auth/login', [
            'email' => 'active_biz@example.com',
            'password' => 'secret123',
            'role' => 'business_user',
        ]);

        $login->assertOk()
            ->assertJsonPath('user.role', 'business_user')
            ->assertJsonPath('user.portalRole', 'business_user');

        $token = $login->json('token');

        // Test settings endpoint immediately visited post-registration
        $settingsResponse = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/settings');

        $settingsResponse->assertOk()
            ->assertJsonPath('currency', 'INR');
    }

    public function test_duplicate_email_registration_is_rejected(): void
    {
        $this->postJson('/api/auth/register', [
            'name' => 'First User',
            'email' => 'unique@example.com',
            'password' => 'password123',
            'role' => 'student',
        ])->assertStatus(201);

        $duplicate = $this->postJson('/api/auth/register', [
            'name' => 'Duplicate User',
            'email' => 'unique@example.com',
            'password' => 'password123',
            'role' => 'student',
        ]);

        $duplicate->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_registration_validates_required_fields_and_min_password(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => '',
            'email' => 'invalid-email',
            'password' => '123',
            'role' => 'invalid_role',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'password', 'role']);
    }

    public function test_cannot_register_as_admin(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Hacker Admin',
            'email' => 'hacker@example.com',
            'password' => 'password123',
            'role' => 'super_admin',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['role']);
    }
}
