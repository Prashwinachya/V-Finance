<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wallets', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('wallet_type')->default('default_wallet');
            $table->decimal('balance', 15, 2)->default(0);
            $table->timestamp('last_withdrawal_date')->nullable();
            $table->timestamps();
        });

        Schema::create('loans', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('lender')->nullable();
            $table->decimal('annual_rate', 8, 2);
            $table->decimal('remaining_principal', 15, 2);
            $table->decimal('emi', 15, 2);
            $table->date('start_date')->nullable();
            $table->unsignedInteger('tenure_months')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('trip_budgets', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('budget_name');
            $table->string('destination')->nullable();
            $table->decimal('amount', 15, 2);
            $table->string('period')->default('monthly');
            $table->string('category')->default('travel');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->unsignedInteger('people_count')->default(1);
            $table->json('breakdown')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trip_budgets');
        Schema::dropIfExists('loans');
        Schema::dropIfExists('wallets');
    }
};
