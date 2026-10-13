<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('theme')->default('system'); // light, dark, system
            $table->string('currency')->default('INR');
            $table->string('date_format')->default('DD MMM YYYY');
            $table->string('language')->default('en');
            $table->string('layout_density')->default('comfortable'); // compact, comfortable
            $table->json('alerts_config')->nullable();
            $table->json('privacy_config')->nullable();
            $table->json('payment_config')->nullable();
            $table->json('investment_config')->nullable();
            $table->json('notification_preferences')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_settings');
    }
};
