<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-900 leading-tight">Transactions</h2>
    </x-slot>

    <div class="py-10">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
            @if (session('status'))
                <div class="mb-4 p-3 rounded-md bg-green-100 text-green-800">{{ session('status') }}</div>
            @endif

            <div class="mb-4 flex justify-end">
                <a href="{{ route('transactions.create') }}" class="vf-btn">Add Transaction</a>
            </div>

            <div class="vf-card overflow-hidden">
                <table class="min-w-full divide-y divide-purple-100">
                    <thead class="bg-purple-50/60">
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Title</th>
                            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                            <th class="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Amount</th>
                            <th class="px-4 py-3"></th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-purple-50">
                        @forelse($transactions as $transaction)
                            <tr>
                                <td class="px-4 py-3 text-sm text-gray-900">{{ $transaction->title }}</td>
                                <td class="px-4 py-3 text-sm text-gray-600">{{ $transaction->category?->name ?? 'Uncategorized' }}</td>
                                <td class="px-4 py-3 text-sm capitalize text-gray-700">{{ $transaction->type }}</td>
                                <td class="px-4 py-3 text-sm text-gray-600">{{ $transaction->date->format('Y-m-d') }}</td>
                                <td class="px-4 py-3 text-sm text-right font-semibold {{ $transaction->type === 'income' ? 'text-green-600' : 'text-red-600' }}">
                                    {{ $transaction->type === 'income' ? '+' : '-' }}${{ number_format((float) $transaction->amount, 2) }}
                                </td>
                                <td class="px-4 py-3 text-sm text-right space-x-3">
                                    <a href="{{ route('transactions.edit', $transaction) }}" class="text-purple-700 hover:text-purple-900">Edit</a>
                                    <form method="POST" action="{{ route('transactions.destroy', $transaction) }}" class="inline">
                                        @csrf
                                        @method('DELETE')
                                        <button type="submit" class="text-red-600 hover:text-red-800">Delete</button>
                                    </form>
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="6" class="px-4 py-6 text-center text-sm text-gray-500">No transactions found.</td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>

            <div class="mt-4">{{ $transactions->links() }}</div>
        </div>
    </div>
</x-app-layout>
