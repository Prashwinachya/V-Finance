<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Ensure only prashwin@icloud.com is the super admin
        User::updateOrCreate(
            ['email' => 'prashwin@icloud.com'],
            [
                'name' => 'Prashwin',
                'password' => Hash::make('Vaishnavi'),
                'role' => 'super_admin',
                'is_super_admin' => true,
                'portal' => 'student',
                'email_verified_at' => now(),
            ]
        );

        // Other users (non-super admin)
        User::updateOrCreate(
            ['email' => 'vaishnavi@icloud.com'],
            [
                'name' => 'Vaishnavi',
                'password' => Hash::make('SuperAdmin123!'),
                'role' => 'user',
                'is_super_admin' => false,
                'portal' => 'student',
                'email_verified_at' => now(),
            ]
        );

        User::updateOrCreate(
            ['email' => 'superadmin@vfinance.local'],
            [
                'name' => 'Legacy Super Admin',
                'password' => Hash::make('ChangeMe123!'),
                'role' => 'user',
                'is_super_admin' => false,
                'portal' => 'student',
                'email_verified_at' => now(),
            ]
        );
    }
}
