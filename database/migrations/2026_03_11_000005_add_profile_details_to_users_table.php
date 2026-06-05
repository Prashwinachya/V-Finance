<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('phone', 30)->nullable()->after('avatar_url');
            $table->date('date_of_birth')->nullable()->after('phone');
            $table->string('gender', 20)->nullable()->after('date_of_birth');
            $table->string('city', 120)->nullable()->after('gender');
            $table->string('country', 120)->nullable()->after('city');
            $table->string('timezone', 80)->nullable()->after('country');
            $table->text('bio')->nullable()->after('timezone');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn([
                'phone',
                'date_of_birth',
                'gender',
                'city',
                'country',
                'timezone',
                'bio',
            ]);
        });
    }
};
