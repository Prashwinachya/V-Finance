<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-900 leading-tight">
            {{ __('VFinance Dashboard') }}
        </h2>
    </x-slot>

    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div class="md:col-span-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl p-6 shadow-sm">
                    <p class="text-sm uppercase tracking-wide opacity-90">Total Balance</p>
                    <p class="text-4xl font-bold mt-1">₹{{ number_format($totalBalance, 2) }}</p>
                    <p class="text-sm mt-2 opacity-90">Monthly change: {{ number_format($monthlyChangePercentage, 2) }}%</p>
                </div>
                <div class="bg-white/80 backdrop-blur rounded-xl p-6 border border-purple-100">
                    <p class="text-sm text-gray-500">This Month</p>
                    <p class="mt-2 text-green-600 font-semibold">Income: ₹{{ number_format($monthlyIncome, 2) }}</p>
                    <p class="mt-1 text-red-600 font-semibold">Expenses: ₹{{ number_format($monthlyExpenses, 2) }}</p>
                </div>
                <a href="{{ route('subscriptions.radar') }}" class="bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-xl p-6 shadow-sm hover:from-rose-400 hover:to-pink-500 transition">
                    <p class="text-xs uppercase tracking-wide opacity-90">Money leaking here</p>
                    <p class="text-2xl font-black mt-1">₹{{ number_format($radarLeakYearly, 0) }}/yr</p>
                    <p class="text-sm mt-2 opacity-90">{{ $radarUnusedCount }} unused of {{ $radarDetectedCount }} recurring services</p>
                    <p class="text-xs mt-3 font-semibold">Open Smart Radar →</p>
                </a>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <a href="{{ route('transactions.create') }}" class="bg-white/80 backdrop-blur rounded-lg p-4 border border-purple-100 hover:border-purple-300 transition text-center">Add Transaction</a>
                <a href="{{ route('categories.create') }}" class="bg-white/80 backdrop-blur rounded-lg p-4 border border-purple-100 hover:border-purple-300 transition text-center">New Category</a>
                <a href="{{ route('budgets.create') }}" class="bg-white/80 backdrop-blur rounded-lg p-4 border border-purple-100 hover:border-purple-300 transition text-center">Set Budget</a>
                <a href="{{ route('transactions.index') }}" class="bg-white/80 backdrop-blur rounded-lg p-4 border border-purple-100 hover:border-purple-300 transition text-center">View History</a>
            </div>

            <div class="bg-white/80 backdrop-blur rounded-xl border border-purple-100 overflow-hidden">
                <div class="p-5 border-b border-purple-100">
                    <h3 class="font-semibold text-gray-900">Recent Transactions</h3>
                </div>
                <div class="divide-y divide-purple-50">
                    @forelse ($recentTransactions as $transaction)
                        <div class="p-5 flex items-center justify-between">
                            <div>
                                <p class="font-medium text-gray-900">{{ $transaction->title }}</p>
                                <p class="text-sm text-gray-500">{{ $transaction->category?->name ?? 'Uncategorized' }} • {{ $transaction->date->format('M d, Y') }}</p>
                            </div>
                            <p class="font-semibold {{ $transaction->type === 'income' ? 'text-green-600' : 'text-red-600' }}">
                                {{ $transaction->type === 'income' ? '+' : '-' }}₹{{ number_format((float) $transaction->amount, 2) }}
                            </p>
                        </div>
                    @empty
                        <p class="p-5 text-gray-500">No transactions yet.</p>
                    @endforelse
                </div>
            </div>
        </div>
    </div>
</x-app-layout>
