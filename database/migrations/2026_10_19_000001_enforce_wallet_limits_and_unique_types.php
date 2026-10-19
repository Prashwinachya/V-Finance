<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Merge duplicate wallets per (user_id, wallet_type) before applying unique index
        // This preserves all balances and transactions without data loss.
        $duplicates = DB::table('wallets')
            ->select('user_id', 'wallet_type')
            ->groupBy('user_id', 'wallet_type')
            ->havingRaw('COUNT(*) > 1')
            ->get();

        foreach ($duplicates as $duplicateGroup) {
            $wallets = DB::table('wallets')
                ->where('user_id', $duplicateGroup->user_id)
                ->where('wallet_type', $duplicateGroup->wallet_type)
                ->orderBy('id', 'asc')
                ->get();

            $primary = $wallets->first();
            $surplusBalance = 0;

            foreach ($wallets->slice(1) as $dup) {
                // Point all transactions referencing the duplicate wallet to primary
                DB::table('transactions')
                    ->where('wallet_id', $dup->id)
                    ->update(['wallet_id' => $primary->id]);

                $surplusBalance += (float) $dup->balance;

                // Delete the duplicate wallet row
                DB::table('wallets')->where('id', $dup->id)->delete();
            }

            if ($surplusBalance > 0) {
                DB::table('wallets')
                    ->where('id', $primary->id)
                    ->increment('balance', $surplusBalance);
            }
        }

        // 2. Add unique constraint on (user_id, wallet_type)
        Schema::table('wallets', function (Blueprint $table): void {
            $table->unique(['user_id', 'wallet_type'], 'wallets_user_id_wallet_type_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('wallets', function (Blueprint $table): void {
            $table->dropUnique('wallets_user_id_wallet_type_unique');
        });
    }
};
