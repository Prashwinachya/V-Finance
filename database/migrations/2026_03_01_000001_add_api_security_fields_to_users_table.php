<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('role')->default('user')->after('password');
            $table->timestamp('last_login_at')->nullable()->after('role');
            $table->unsignedInteger('login_count')->default(0)->after('last_login_at');
            $table->string('avatar_url')->nullable()->after('login_count');

            $table->boolean('require_payment_pin')->default(false)->after('avatar_url');
            $table->boolean('require_payment_fingerprint')->default(false)->after('require_payment_pin');
            $table->boolean('payment_pin_enabled')->default(false)->after('require_payment_fingerprint');
            $table->string('payment_pin_hash')->nullable()->after('payment_pin_enabled');

            $table->boolean('fingerprint_enabled')->default(false)->after('payment_pin_hash');
            $table->string('webauthn_credential_id')->nullable()->after('fingerprint_enabled');
            $table->text('webauthn_public_key')->nullable()->after('webauthn_credential_id');
            $table->string('webauthn_register_challenge')->nullable()->after('webauthn_public_key');
            $table->string('webauthn_auth_challenge')->nullable()->after('webauthn_register_challenge');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn([
                'role',
                'last_login_at',
                'login_count',
                'avatar_url',
                'require_payment_pin',
                'require_payment_fingerprint',
                'payment_pin_enabled',
                'payment_pin_hash',
                'fingerprint_enabled',
                'webauthn_credential_id',
                'webauthn_public_key',
                'webauthn_register_challenge',
                'webauthn_auth_challenge',
            ]);
        });
    }
};
