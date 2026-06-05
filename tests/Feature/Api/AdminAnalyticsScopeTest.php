<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminAnalyticsScopeTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_super_admin_sees_only_student_users_in_admin_analytics(): void
    {
        $studentAdmin = User::factory()->create([
            'role' => 'super_admin_student',
            'is_super_admin' => true,
        ]);

        User::factory()->create(['role' => 'student']);
        User::factory()->create(['role' => 'user']);
        User::factory()->create(['role' => 'business_user']);

        Sanctum::actingAs($studentAdmin);

        $stats = $this->getJson('/api/admin/stats');
        $stats->assertOk()
            ->assertJsonPath('totalUsers', 2);

        $users = $this->getJson('/api/admin/users');
        $users->assertOk()->assertJsonCount(2);

        $roles = collect($users->json())->pluck('role')->all();
        $this->assertContains('student', $roles);
    }

    public function test_business_super_admin_sees_only_business_users_in_admin_analytics(): void
    {
        $businessAdmin = User::factory()->create([
            'role' => 'super_admin_business',
            'is_super_admin' => true,
        ]);

        User::factory()->create(['role' => 'business_user']);
        User::factory()->create(['role' => 'business_user']);
        User::factory()->create(['role' => 'student']);

        Sanctum::actingAs($businessAdmin);

        $stats = $this->getJson('/api/admin/stats');
        $stats->assertOk()
            ->assertJsonPath('totalUsers', 2);

        $users = $this->getJson('/api/admin/users');
        $users->assertOk()->assertJsonCount(2);

        $roles = collect($users->json())->pluck('role')->unique()->values()->all();
        $this->assertSame(['business_user'], $roles);
    }
}
