<?php

namespace Tests\Feature\Api;

use App\Models\Loan;
use App\Models\ScheduledPayment;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BankDemoSyncTest extends TestCase
{
    use RefreshDatabase;

    public function test_demo_sync_seeds_bank_connections_transactions_and_module_data(): void
    {
        $user = User::factory()->create([
            'role' => 'business_user',
        ]);
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/banks/demo-sync');

        $response->assertOk()
            ->assertJsonPath('message', 'Demo bank sync dataset imported successfully.');

        $this->assertDatabaseCount('bank_connections', 3);

        $this->assertGreaterThanOrEqual(
            18,
            Transaction::query()->where('user_id', $user->id)->where('source', 'bank_sync')->count()
        );

        $this->assertGreaterThanOrEqual(
            1,
            Loan::query()->where('user_id', $user->id)->whereNotNull('bank_connection_id')->count()
        );

        $this->assertGreaterThanOrEqual(
            1,
            ScheduledPayment::query()->where('user_id', $user->id)->whereNotNull('bank_connection_id')->count()
        );
    }

    public function test_demo_sync_is_idempotent_for_transactions(): void
    {
        $user = User::factory()->create([
            'role' => 'business_user',
        ]);
        Sanctum::actingAs($user);

        $this->postJson('/api/banks/demo-sync')->assertOk();
        $firstCount = Transaction::query()->where('user_id', $user->id)->where('source', 'bank_sync')->count();

        $second = $this->postJson('/api/banks/demo-sync');

        $second->assertOk();

        $secondCount = Transaction::query()->where('user_id', $user->id)->where('source', 'bank_sync')->count();

        $this->assertSame($firstCount, $secondCount);
        $this->assertSame(0, (int) $second->json('inserted'));
    }
}
