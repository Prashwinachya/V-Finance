<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add indexes to improve query performance on transactions
        Schema::table('transactions', function (Blueprint $table) {
            $table->index(['user_id', 'date'], 'tx_user_date_idx');
            $table->index(['category_id', 'date'], 'tx_category_date_idx');
        });

        // If using Postgres, consider creating partial and expression indexes
        if (config('database.default') === 'pgsql') {
            DB::statement('CREATE INDEX IF NOT EXISTS tx_amount_idx ON transactions (amount);');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex('tx_user_date_idx');
            $table->dropIndex('tx_category_date_idx');
        });

        if (config('database.default') === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS tx_amount_idx');
        }
    }
};
