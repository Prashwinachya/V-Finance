<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table): void {
            $table->foreignId('bank_connection_id')->nullable()->after('wallet_id')->constrained()->nullOnDelete();
            $table->string('source')->default('manual')->after('transaction_type');
            $table->string('external_reference')->nullable()->after('source');
            $table->unique(['user_id', 'external_reference']);
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table): void {
            $table->dropUnique(['user_id', 'external_reference']);
            $table->dropConstrainedForeignId('bank_connection_id');
            $table->dropColumn(['source', 'external_reference']);
        });
    }
};
