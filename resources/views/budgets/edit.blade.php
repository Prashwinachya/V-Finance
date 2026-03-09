<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-900 leading-tight">Edit Budget</h2>
    </x-slot>

    <div class="py-10">
        <div class="max-w-3xl mx-auto sm:px-6 lg:px-8">
            <form method="POST" action="{{ route('budgets.update', $budget) }}" class="vf-card p-6 space-y-4">
                @csrf
                @method('PUT')

                <div>
                    <label class="block text-sm font-medium text-gray-700">Budget Name</label>
                    <input name="name" value="{{ old('name', $budget->name) }}" class="vf-input mt-1" required>
                    @error('name') <p class="text-sm text-red-600 mt-1">{{ $message }}</p> @enderror
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Category</label>
                        <select name="category_id" class="vf-input mt-1" required>
                            @foreach($categories as $category)
                                <option value="{{ $category->id }}" @selected(old('category_id', $budget->category_id) == $category->id)>{{ $category->name }}</option>
                            @endforeach
                        </select>
                        @error('category_id') <p class="text-sm text-red-600 mt-1">{{ $message }}</p> @enderror
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700">Period</label>
                        <select name="period" class="vf-input mt-1" required>
                            <option value="weekly" @selected(old('period', $budget->period) === 'weekly')>Weekly</option>
                            <option value="monthly" @selected(old('period', $budget->period) === 'monthly')>Monthly</option>
                            <option value="yearly" @selected(old('period', $budget->period) === 'yearly')>Yearly</option>
                        </select>
                        @error('period') <p class="text-sm text-red-600 mt-1">{{ $message }}</p> @enderror
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700">Amount</label>
                        <input name="amount" value="{{ old('amount', $budget->amount) }}" type="number" step="0.01" min="0.01" class="vf-input mt-1" required>
                        @error('amount') <p class="text-sm text-red-600 mt-1">{{ $message }}</p> @enderror
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Start Date</label>
                        <input name="start_date" value="{{ old('start_date', $budget->start_date->toDateString()) }}" type="date" class="vf-input mt-1" required>
                        @error('start_date') <p class="text-sm text-red-600 mt-1">{{ $message }}</p> @enderror
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700">End Date</label>
                        <input name="end_date" value="{{ old('end_date', $budget->end_date->toDateString()) }}" type="date" class="vf-input mt-1" required>
                        @error('end_date') <p class="text-sm text-red-600 mt-1">{{ $message }}</p> @enderror
                    </div>
                </div>

                <div class="flex justify-end gap-3">
                    <a href="{{ route('budgets.index') }}" class="px-4 py-2 rounded-md border border-purple-200 text-gray-700">Cancel</a>
                    <button class="vf-btn" type="submit">Update Budget</button>
                </div>
            </form>
        </div>
    </div>
</x-app-layout>
