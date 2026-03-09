<?php

namespace App\Http\Controllers;

use App\Models\Budget;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

class BudgetController extends Controller
{
    public function index(): View
    {
        $budgets = Budget::with('category')
            ->where('user_id', auth()->id())
            ->latest('start_date')
            ->paginate(10);

        return view('budgets.index', compact('budgets'));
    }

    public function create(): View
    {
        $categories = Category::orderBy('name')->get();

        return view('budgets.create', compact('categories'));
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'category_id' => ['required', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'period' => ['required', Rule::in(['weekly', 'monthly', 'yearly'])],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
        ]);

        $validated['user_id'] = auth()->id();

        Budget::create($validated);

        return redirect()->route('budgets.index')->with('status', 'Budget created.');
    }

    public function edit(Budget $budget): View
    {
        abort_unless($budget->user_id === auth()->id(), 403);

        $categories = Category::orderBy('name')->get();

        return view('budgets.edit', compact('budget', 'categories'));
    }

    public function update(Request $request, Budget $budget): RedirectResponse
    {
        abort_unless($budget->user_id === auth()->id(), 403);

        $validated = $request->validate([
            'category_id' => ['required', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'period' => ['required', Rule::in(['weekly', 'monthly', 'yearly'])],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
        ]);

        $budget->update($validated);

        return redirect()->route('budgets.index')->with('status', 'Budget updated.');
    }

    public function destroy(Budget $budget): RedirectResponse
    {
        abort_unless($budget->user_id === auth()->id(), 403);

        $budget->delete();

        return redirect()->route('budgets.index')->with('status', 'Budget deleted.');
    }
}
