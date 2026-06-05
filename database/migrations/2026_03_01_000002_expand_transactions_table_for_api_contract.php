<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table): void {
            $table->foreignId('wallet_id')->nullable()->after('category_id')->constrained()->nullOnDelete();
            $table->string('category')->nullable()->after('title');
            $table->string('transaction_type')->default('cash')->after('type');
            $table->boolean('is_recurring')->default(false)->after('transaction_type');
            $table->string('recurrence')->nullable()->after('is_recurring');
            $table->boolean('user_deleted')->default(false)->after('recurrence');
            $table->timestamp('user_deleted_at')->nullable()->after('user_deleted');
            $table->timestamp('timestamp')->nullable()->after('date');
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('wallet_id');
            $table->dropColumn([
                'category',
                'transaction_type',
                'is_recurring',
                'recurrence',
                'user_deleted',
                'user_deleted_at',
                'timestamp',
            ]);
        });
    }
};
