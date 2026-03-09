<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::query()->update(['is_super_admin' => false]);

        User::updateOrCreate(
            ['email' => 'vaishnavi@icloud.com'],
            [
                'name' => 'vaishnavi',
                'password' => Hash::make('vaishnavi'),
                'is_super_admin' => true,
                'email_verified_at' => now(),
            ]
        );

        User::updateOrCreate(
            ['email' => 'superadmin@vfinance.local'],
            [
                'name' => 'super admin',
                'password' => Hash::make('SuperAdmin123!'),
                'is_super_admin' => false,
                'email_verified_at' => now(),
            ]
        );
    }
}
