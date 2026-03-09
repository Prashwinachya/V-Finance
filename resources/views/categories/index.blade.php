<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-900 leading-tight">Categories</h2>
    </x-slot>

    <div class="py-10">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
            @if (session('status'))
                <div class="mb-4 p-3 rounded-md bg-green-100 text-green-800">{{ session('status') }}</div>
            @endif

            <div class="mb-4 flex justify-end">
                <a href="{{ route('categories.create') }}" class="vf-btn">Add Category</a>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                @forelse($categories as $category)
                    <div class="vf-card p-5">
                        <div class="flex items-center justify-between">
                            <h3 class="font-semibold text-gray-900">{{ $category->name }}</h3>
                            <span class="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700 uppercase">{{ $category->type }}</span>
                        </div>
                        <p class="text-sm text-gray-600 mt-2">{{ $category->description ?: 'No description' }}</p>
                        <p class="text-sm text-gray-500 mt-2"><i class="fa-solid {{ $category->icon }}"></i> {{ $category->color }}</p>
                        <div class="mt-4 flex justify-end gap-3 text-sm">
                            <a href="{{ route('categories.edit', $category) }}" class="text-purple-700 hover:text-purple-900">Edit</a>
                            <form method="POST" action="{{ route('categories.destroy', $category) }}">
                                @csrf
                                @method('DELETE')
                                <button type="submit" class="text-red-600 hover:text-red-800">Delete</button>
                            </form>
                        </div>
                    </div>
                @empty
                    <div class="col-span-full vf-card p-6 text-center text-gray-500">No categories found.</div>
                @endforelse
            </div>

            <div class="mt-4">{{ $categories->links() }}</div>
        </div>
    </div>
</x-app-layout>
