<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\Wallet;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WalletLimitsAndDuplicatePreventionTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_only_have_one_pocket_saver_wallet(): void
    {
        $student = User::factory()->create([
            'role' => 'user',
            'portal' => 'student',
        ]);

        Sanctum::actingAs($student);

        // Can create Pocket Saver
        $response1 = $this->postJson('/api/wallets', [
            'walletType' => 'pocket_saver_wallet',
        ]);
        $response1->assertStatus(201)
            ->assertJsonPath('walletType', 'pocket_saver_wallet');

        // Cannot create Travelling wallet
        $response2 = $this->postJson('/api/wallets', [
            'walletType' => 'travelling_wallet',
        ]);
        $response2->assertStatus(422)
            ->assertJsonFragment(['message' => 'Student accounts can only use Pocket Saver Wallet.']);

        // Cannot create Medical wallet
        $response3 = $this->postJson('/api/wallets', [
            'walletType' => 'medical_emergency_wallet',
        ]);
        $response3->assertStatus(422)
            ->assertJsonFragment(['message' => 'Student accounts can only use Pocket Saver Wallet.']);

        // Cannot create second Pocket Saver wallet
        $response4 = $this->postJson('/api/wallets', [
            'walletType' => 'pocket_saver_wallet',
        ]);
        $response4->assertStatus(422)
            ->assertJsonFragment(['message' => 'Student accounts can activate only one wallet.']);

        $this->assertSame(1, Wallet::query()->where('user_id', $student->id)->count());
    }

    public function test_business_user_can_create_up_to_three_allowed_wallets(): void
    {
        $businessUser = User::factory()->create([
            'role' => 'business_user',
            'portal' => 'business_user',
        ]);

        Sanctum::actingAs($businessUser);

        // 1. Travelling wallet
        $res1 = $this->postJson('/api/wallets', ['walletType' => 'travelling_wallet']);
        $res1->assertStatus(201)->assertJsonPath('walletType', 'travelling_wallet');

        // 2. Medical Emergency wallet
        $res2 = $this->postJson('/api/wallets', ['walletType' => 'medical_emergency_wallet']);
        $res2->assertStatus(201)->assertJsonPath('walletType', 'medical_emergency_wallet');

        // 3. Pocket Saver wallet
        $res3 = $this->postJson('/api/wallets', ['walletType' => 'pocket_saver_wallet']);
        $res3->assertStatus(201)->assertJsonPath('walletType', 'pocket_saver_wallet');

        $this->assertSame(3, Wallet::query()->where('user_id', $businessUser->id)->count());

        $indexRes = $this->getJson('/api/wallets');
        $indexRes->assertOk()->assertJsonCount(3);
    }

    public function test_business_user_cannot_create_duplicate_wallet_types(): void
    {
        $businessUser = User::factory()->create([
            'role' => 'business_user',
            'portal' => 'business_user',
        ]);

        Sanctum::actingAs($businessUser);

        // Create Travelling wallet
        $this->postJson('/api/wallets', ['walletType' => 'travelling_wallet'])
            ->assertStatus(201);

        // Duplicate request for Travelling wallet
        $dupRes = $this->postJson('/api/wallets', ['walletType' => 'travelling_wallet']);
        $dupRes->assertStatus(422)
            ->assertJsonFragment(['message' => 'You already have an active Travelling Wallet.']);

        // Create Medical Emergency wallet
        $this->postJson('/api/wallets', ['walletType' => 'medical_emergency_wallet'])
            ->assertStatus(201);

        // Duplicate request for Medical Emergency wallet
        $dupRes2 = $this->postJson('/api/wallets', ['walletType' => 'medical_emergency_wallet']);
        $dupRes2->assertStatus(422)
            ->assertJsonFragment(['message' => 'You already have an active Medical Emergency Wallet.']);

        $this->assertSame(2, Wallet::query()->where('user_id', $businessUser->id)->count());
    }

    public function test_business_user_cannot_exceed_three_wallets(): void
    {
        $businessUser = User::factory()->create([
            'role' => 'business_user',
            'portal' => 'business_user',
        ]);

        Sanctum::actingAs($businessUser);

        $this->postJson('/api/wallets', ['walletType' => 'travelling_wallet'])->assertStatus(201);
        $this->postJson('/api/wallets', ['walletType' => 'medical_emergency_wallet'])->assertStatus(201);
        $this->postJson('/api/wallets', ['walletType' => 'pocket_saver_wallet'])->assertStatus(201);

        // Attempting to create a 4th wallet
        $excess = $this->postJson('/api/wallets', ['walletType' => 'travelling_wallet']);
        $excess->assertStatus(422);
        // It will fail with either already active or maximum wallets reached
        $this->assertSame(3, Wallet::query()->where('user_id', $businessUser->id)->count());
    }

    public function test_business_user_cannot_create_invalid_wallet_type(): void
    {
        $businessUser = User::factory()->create([
            'role' => 'business_user',
            'portal' => 'business_user',
        ]);

        Sanctum::actingAs($businessUser);

        $invalid = $this->postJson('/api/wallets', ['walletType' => 'crypto_wallet']);
        $invalid->assertStatus(422)
            ->assertJsonFragment(['message' => 'Invalid wallet type. Allowed types are Travel, Medical, and Pocket Saver.']);
    }

    public function test_database_unique_constraint_enforces_one_wallet_per_type_per_user(): void
    {
        $user = User::factory()->create([
            'role' => 'business_user',
            'portal' => 'business_user',
        ]);

        Wallet::create([
            'user_id' => $user->id,
            'name' => 'Original Travel',
            'wallet_type' => 'travelling_wallet',
            'balance' => 500,
        ]);

        $this->expectException(\Illuminate\Database\QueryException::class);

        Wallet::create([
            'user_id' => $user->id,
            'name' => 'Duplicate Travel',
            'wallet_type' => 'travelling_wallet',
            'balance' => 300,
        ]);
    }

    public function test_portal_role_and_helpers(): void
    {
        $studentUser = User::factory()->create([
            'role' => 'user',
            'portal' => 'student',
        ]);
        $this->assertTrue($studentUser->isStudent());
        $this->assertFalse($studentUser->isBusiness());

        $businessUser = User::factory()->create([
            'role' => 'user',
            'portal' => 'business_user',
        ]);
        $this->assertFalse($businessUser->isStudent());
        $this->assertTrue($businessUser->isBusiness());

        $superAdmin = User::factory()->create([
            'role' => 'super_admin',
            'portal' => 'student',
        ]);
        $this->assertTrue($superAdmin->isAdmin());
        $this->assertTrue($superAdmin->isStudent());
        $this->assertTrue($superAdmin->isBusiness());

        $adminUser = User::factory()->create([
            'role' => 'admin',
        ]);
        $this->assertTrue($adminUser->isAdmin());
        $this->assertTrue($adminUser->isStudent());
        $this->assertTrue($adminUser->isBusiness());
    }

    public function test_admin_has_no_wallet_or_feature_restrictions(): void
    {
        $admin = User::factory()->create([
            'role' => 'super_admin',
            'is_super_admin' => true,
        ]);

        Sanctum::actingAs($admin);

        // Admin can create all wallet types
        $this->postJson('/api/wallets', ['walletType' => 'travelling_wallet'])->assertStatus(201);
        $this->postJson('/api/wallets', ['walletType' => 'medical_emergency_wallet'])->assertStatus(201);
        $this->postJson('/api/wallets', ['walletType' => 'pocket_saver_wallet'])->assertStatus(201);

        $this->assertSame(3, Wallet::query()->where('user_id', $admin->id)->count());

        // Admin can access all wallet details without 403
        $wallets = Wallet::query()->where('user_id', $admin->id)->get();
        foreach ($wallets as $wallet) {
            $this->getJson('/api/wallets/'.$wallet->id)->assertOk();
        }

        // Admin can access loans (not blocked as student)
        $this->getJson('/api/loans')->assertOk();
    }
}
