<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-900 leading-tight">Add Category</h2>
    </x-slot>

    <div class="py-10">
        <div class="max-w-3xl mx-auto sm:px-6 lg:px-8">
            <form method="POST" action="{{ route('categories.store') }}" class="vf-card p-6 space-y-4">
                @csrf

                <div>
                    <label class="block text-sm font-medium text-gray-700">Name</label>
                    <input name="name" value="{{ old('name') }}" class="vf-input mt-1" required>
                    @error('name') <p class="text-sm text-red-600 mt-1">{{ $message }}</p> @enderror
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Type</label>
                        <select name="type" class="vf-input mt-1" required>
                            <option value="income" @selected(old('type') === 'income')>Income</option>
                            <option value="expense" @selected(old('type') === 'expense')>Expense</option>
                        </select>
                        @error('type') <p class="text-sm text-red-600 mt-1">{{ $message }}</p> @enderror
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Color</label>
                        <input name="color" value="{{ old('color', 'gray') }}" class="vf-input mt-1" required>
                        @error('color') <p class="text-sm text-red-600 mt-1">{{ $message }}</p> @enderror
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Icon (Font Awesome class)</label>
                        <input name="icon" value="{{ old('icon', 'fa-circle') }}" class="vf-input mt-1" required>
                        @error('icon') <p class="text-sm text-red-600 mt-1">{{ $message }}</p> @enderror
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700">Description</label>
                    <textarea name="description" class="vf-input mt-1">{{ old('description') }}</textarea>
                    @error('description') <p class="text-sm text-red-600 mt-1">{{ $message }}</p> @enderror
                </div>

                <div class="flex justify-end gap-3">
                    <a href="{{ route('categories.index') }}" class="px-4 py-2 rounded-md border border-purple-200 text-gray-700">Cancel</a>
                    <button class="vf-btn" type="submit">Save Category</button>
                </div>
            </form>
        </div>
    </div>
</x-app-layout>
