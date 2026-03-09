<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Salary', 'type' => 'income', 'color' => 'green', 'icon' => 'fa-briefcase'],
            ['name' => 'Investments', 'type' => 'income', 'color' => 'blue', 'icon' => 'fa-chart-line'],
            ['name' => 'Freelance', 'type' => 'income', 'color' => 'purple', 'icon' => 'fa-laptop'],
            ['name' => 'Business', 'type' => 'income', 'color' => 'orange', 'icon' => 'fa-store'],
            ['name' => 'Other Income', 'type' => 'income', 'color' => 'gray', 'icon' => 'fa-plus'],
            ['name' => 'Food & Dining', 'type' => 'expense', 'color' => 'red', 'icon' => 'fa-utensils'],
            ['name' => 'Transportation', 'type' => 'expense', 'color' => 'orange', 'icon' => 'fa-car'],
            ['name' => 'Shopping', 'type' => 'expense', 'color' => 'pink', 'icon' => 'fa-bag-shopping'],
            ['name' => 'Entertainment', 'type' => 'expense', 'color' => 'purple', 'icon' => 'fa-film'],
            ['name' => 'Bills & Utilities', 'type' => 'expense', 'color' => 'blue', 'icon' => 'fa-file-invoice-dollar'],
            ['name' => 'Healthcare', 'type' => 'expense', 'color' => 'green', 'icon' => 'fa-heart-pulse'],
            ['name' => 'Education', 'type' => 'expense', 'color' => 'indigo', 'icon' => 'fa-graduation-cap'],
            ['name' => 'Travel', 'type' => 'expense', 'color' => 'cyan', 'icon' => 'fa-plane'],
            ['name' => 'Other Expenses', 'type' => 'expense', 'color' => 'gray', 'icon' => 'fa-minus'],
        ];

        foreach ($categories as $category) {
            Category::updateOrCreate(
                ['name' => $category['name'], 'type' => $category['type']],
                $category
            );
        }
    }
}
