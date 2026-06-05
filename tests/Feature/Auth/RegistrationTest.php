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
            ->assertJsonPath('user.role', 'student');

        $business = $this->postJson('/api/auth/register', [
            'name' => 'Business User',
            'email' => 'business@example.com',
            'password' => 'password123',
            'role' => 'business_user',
        ]);

        $business->assertStatus(201)
            ->assertJsonPath('user.role', 'business_user');
    }
}
