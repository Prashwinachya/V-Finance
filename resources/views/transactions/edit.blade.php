<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-900 leading-tight">Edit Transaction</h2>
    </x-slot>

    <div class="py-10">
        <div class="max-w-3xl mx-auto sm:px-6 lg:px-8">
            <form method="POST" action="{{ route('transactions.update', $transaction) }}" class="vf-card p-6 space-y-4">
                @csrf
                @method('PUT')

                <div>
                    <label class="block text-sm font-medium text-gray-700">Title</label>
                    <input name="title" value="{{ old('title', $transaction->title) }}" class="vf-input mt-1" required>
                    @error('title') <p class="text-sm text-red-600 mt-1">{{ $message }}</p> @enderror
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700">Description</label>
                    <textarea name="description" class="vf-input mt-1">{{ old('description', $transaction->description) }}</textarea>
                    @error('description') <p class="text-sm text-red-600 mt-1">{{ $message }}</p> @enderror
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Category</label>
                        <select name="category_id" class="vf-input mt-1" required>
                            @foreach($categories as $category)
                                <option value="{{ $category->id }}" @selected(old('category_id', $transaction->category_id) == $category->id)>
                                    {{ $category->name }} ({{ $category->type }})
                                </option>
                            @endforeach
                        </select>
                        @error('category_id') <p class="text-sm text-red-600 mt-1">{{ $message }}</p> @enderror
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700">Type</label>
                        <select name="type" class="vf-input mt-1" required>
                            <option value="income" @selected(old('type', $transaction->type) === 'income')>Income</option>
                            <option value="expense" @selected(old('type', $transaction->type) === 'expense')>Expense</option>
                        </select>
                        @error('type') <p class="text-sm text-red-600 mt-1">{{ $message }}</p> @enderror
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Amount</label>
                        <input name="amount" value="{{ old('amount', $transaction->amount) }}" type="number" step="0.01" min="0.01" class="vf-input mt-1" required>
                        @error('amount') <p class="text-sm text-red-600 mt-1">{{ $message }}</p> @enderror
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700">Date</label>
                        <input name="date" value="{{ old('date', $transaction->date->toDateString()) }}" type="date" class="vf-input mt-1" required>
                        @error('date') <p class="text-sm text-red-600 mt-1">{{ $message }}</p> @enderror
                    </div>
                </div>

                <div class="flex justify-end gap-3">
                    <a href="{{ route('transactions.index') }}" class="px-4 py-2 rounded-md border border-purple-200 text-gray-700">Cancel</a>
                    <button class="vf-btn" type="submit">Update Transaction</button>
                </div>
            </form>
        </div>
    </div>
</x-app-layout>
