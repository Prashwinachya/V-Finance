<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('wallets', function (Blueprint $table): void {
            $table->foreignId('bank_connection_id')->nullable()->after('user_id')->constrained('bank_connections')->nullOnDelete();
        });

        Schema::table('loans', function (Blueprint $table): void {
            $table->foreignId('bank_connection_id')->nullable()->after('user_id')->constrained('bank_connections')->nullOnDelete();
        });

        Schema::table('trip_budgets', function (Blueprint $table): void {
            $table->foreignId('bank_connection_id')->nullable()->after('user_id')->constrained('bank_connections')->nullOnDelete();
        });

        Schema::table('scheduled_payments', function (Blueprint $table): void {
            $table->foreignId('bank_connection_id')->nullable()->after('user_id')->constrained('bank_connections')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('scheduled_payments', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('bank_connection_id');
        });

        Schema::table('trip_budgets', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('bank_connection_id');
        });

        Schema::table('loans', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('bank_connection_id');
        });

        Schema::table('wallets', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('bank_connection_id');
        });
    }
};