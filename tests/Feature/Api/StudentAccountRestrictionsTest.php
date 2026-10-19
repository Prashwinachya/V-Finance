<?php

namespace Tests\Feature\Api;

use App\Models\Category;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StudentAccountRestrictionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_only_create_one_pocket_saver_wallet(): void
    {
        $student = User::factory()->create([
            'role' => 'student',
        ]);

        Sanctum::actingAs($student);

        $first = $this->postJson('/api/wallets', [
            'walletType' => 'pocket_saver_wallet',
        ]);

        $first->assertStatus(201)
            ->assertJsonPath('walletType', 'pocket_saver_wallet');

        $second = $this->postJson('/api/wallets', [
            'walletType' => 'medical_emergency_wallet',
        ]);

        $second->assertStatus(422)
            ->assertJsonFragment(['message' => 'Student accounts can only use Pocket Saver Wallet.']);

        $third = $this->postJson('/api/wallets', [
            'walletType' => 'pocket_saver_wallet',
        ]);

        $third->assertStatus(422)
            ->assertJsonFragment(['message' => 'Student accounts can activate only one wallet.']);

        $this->assertSame(1, Wallet::query()->where('user_id', $student->id)->count());
    }

    public function test_student_is_blocked_from_loan_optimizer_endpoints(): void
    {
        $student = User::factory()->create([
            'role' => 'student',
        ]);

        Sanctum::actingAs($student);

        $this->getJson('/api/loans')->assertStatus(403);
        $this->getJson('/api/loans/optimizer/summary')->assertStatus(403);

        $this->postJson('/api/loans', [
            'name' => 'Test Loan',
            'annualRate' => 10,
            'remainingPrincipal' => 10000,
            'emi' => 1000,
        ])->assertStatus(403);
    }

    public function test_student_cannot_access_non_pocket_saver_wallet_details(): void
    {
        $student = User::factory()->create([
            'role' => 'student',
        ]);

        $category = Category::create([
            'name' => 'General',
            'type' => 'expense',
            'color' => '#4B5563',
            'icon' => 'tag',
        ]);

        $medicalWallet = Wallet::create([
            'user_id' => $student->id,
            'name' => 'Medical Wallet',
            'wallet_type' => 'medical_emergency_wallet',
            'balance' => 1000,
        ]);

        Sanctum::actingAs($student);

        $this->getJson('/api/wallets/'.$medicalWallet->id)
            ->assertStatus(403)
            ->assertJsonFragment(['message' => 'Student accounts can access only Pocket Saver Wallet.']);
    }

    public function test_student_activation_migrates_legacy_wallet_to_pocket_saver(): void
    {
        $student = User::factory()->create([
            'role' => 'student',
        ]);

        Wallet::create([
            'user_id' => $student->id,
            'name' => 'Legacy Wallet',
            'wallet_type' => 'travelling_wallet',
            'balance' => 1500,
        ]);

        Sanctum::actingAs($student);

        $response = $this->postJson('/api/wallets', [
            'walletType' => 'pocket_saver_wallet',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('walletType', 'pocket_saver_wallet');

        $this->assertSame(1, Wallet::query()->where('user_id', $student->id)->count());
        $this->assertSame(
            1,
            Wallet::query()
                ->where('user_id', $student->id)
                ->where('wallet_type', 'pocket_saver_wallet')
                ->count()
        );
    }

    public function test_student_index_returns_only_one_pocket_saver_wallet_even_with_other_wallets(): void
    {
        $student = User::factory()->create([
            'role' => 'student',
        ]);

        $firstPocket = Wallet::create([
            'user_id' => $student->id,
            'name' => 'Pocket A',
            'wallet_type' => 'pocket_saver_wallet',
            'balance' => 200,
        ]);

        $secondWallet = Wallet::create([
            'user_id' => $student->id,
            'name' => 'Medical B',
            'wallet_type' => 'medical_emergency_wallet',
            'balance' => 300,
        ]);

        Sanctum::actingAs($student);

        $this->getJson('/api/wallets')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0._id', (string) $firstPocket->id);

        $this->getJson('/api/wallets/'.$secondWallet->id)
            ->assertStatus(403)
            ->assertJsonFragment(['message' => 'Student accounts can access only Pocket Saver Wallet.']);

        // Verify database unique constraint prevents duplicate wallet of same type
        $this->expectException(\Illuminate\Database\QueryException::class);
        Wallet::create([
            'user_id' => $student->id,
            'name' => 'Duplicate Pocket',
            'wallet_type' => 'pocket_saver_wallet',
            'balance' => 100,
        ]);
    }

    public function test_legacy_user_role_is_restricted_to_single_pocket_saver_wallet(): void
    {
        $legacyStudent = User::factory()->create([
            'role' => 'user',
        ]);

        Sanctum::actingAs($legacyStudent);

        $this->postJson('/api/wallets', [
            'walletType' => 'pocket_saver_wallet',
        ])->assertStatus(201);

        $this->postJson('/api/wallets', [
            'walletType' => 'travelling_wallet',
        ])->assertStatus(422)
            ->assertJsonFragment(['message' => 'Student accounts can only use Pocket Saver Wallet.']);

        $this->postJson('/api/wallets', [
            'walletType' => 'pocket_saver_wallet',
        ])->assertStatus(422)
            ->assertJsonFragment(['message' => 'Student accounts can activate only one wallet.']);
    }
}
