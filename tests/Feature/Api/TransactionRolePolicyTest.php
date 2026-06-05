<?php

namespace Tests\Feature\Api;

use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use App\Support\PaymentVerification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TransactionRolePolicyTest extends TestCase
{
    use RefreshDatabase;

    public function test_business_user_cannot_create_manual_transaction(): void
    {
        $user = User::factory()->create([
            'role' => 'business_user',
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/transactions', [
            'title' => 'Manual Expense',
            'category' => 'Office',
            'amount' => 999,
            'type' => 'expense',
        ]);

        $response->assertStatus(403)
            ->assertJsonFragment([
                'message' => 'Business accounts are read-only in Transactions. Sync your bank accounts to import transactions automatically.',
            ]);
    }

    public function test_student_user_can_create_manual_transaction_when_verified(): void
    {
        $user = User::factory()->create([
            'role' => 'student',
            'payment_pin_enabled' => true,
            'payment_pin_hash' => bcrypt('1234'),
            'fingerprint_enabled' => true,
            'webauthn_credential_id' => 'demo-credential',
        ]);

        Sanctum::actingAs($user);

            $token = PaymentVerification::issueToken($user, true, true);

        $response = $this->postJson('/api/transactions', [
            'title' => 'Manual Expense',
            'category' => 'Office',
            'amount' => 999,
            'type' => 'expense',
            'verificationToken' => $token,
        ], [
            'X-Payment-Verification-Token' => $token,
        ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('transactions', [
            'user_id' => $user->id,
            'title' => 'Manual Expense',
            'type' => 'expense',
            'source' => 'manual',
        ]);
    }

    public function test_business_user_cannot_edit_or_delete_transaction(): void
    {
        $user = User::factory()->create([
            'role' => 'business_user',
        ]);

            $category = Category::create([
                'name' => 'Office',
            'type' => 'expense',
                'color' => '#4B5563',
                'icon' => 'tag',
        ]);

        $transaction = Transaction::create([
            'user_id' => $user->id,
            'category_id' => $category->id,
            'title' => 'Synced Item',
            'category' => 'Office',
            'amount' => 500,
            'type' => 'expense',
            'transaction_type' => 'bank',
            'source' => 'bank_sync',
            'date' => now()->toDateString(),
            'timestamp' => now(),
            'user_deleted' => false,
        ]);

        Sanctum::actingAs($user);

        $this->putJson('/api/transactions/'.$transaction->id, [
            'title' => 'Changed',
        ])->assertStatus(403);

        $this->deleteJson('/api/transactions/'.$transaction->id)
            ->assertStatus(403);
    }
}
