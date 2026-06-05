<?php

use App\Models\BankConnection;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bank_connections', function (Blueprint $table): void {
            $table->boolean('is_primary')->default(false)->after('is_active');
        });

        // Backfill: make the first bank per user primary if none exists.
        $userIds = BankConnection::query()->select('user_id')->distinct()->pluck('user_id');
        foreach ($userIds as $userId) {
            $hasPrimary = BankConnection::query()
                ->where('user_id', $userId)
                ->where('is_primary', true)
                ->exists();

            if ($hasPrimary) {
                continue;
            }

            $first = BankConnection::query()
                ->where('user_id', $userId)
                ->oldest('id')
                ->first();

            if ($first) {
                $first->forceFill(['is_primary' => true])->save();
            }
        }
    }

    public function down(): void
    {
        Schema::table('bank_connections', function (Blueprint $table): void {
            $table->dropColumn('is_primary');
        });
    }
};
