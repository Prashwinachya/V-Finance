<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-900 leading-tight">
            {{ __('Smart Subscription Radar') }}
        </h2>
    </x-slot>

    <div class="py-10" x-data="subscriptionRadar(@js($subscriptions), @js($summary))" x-init="init()">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
            <div class="bg-gradient-to-r from-purple-700 via-pink-600 to-rose-500 text-white rounded-2xl p-6 shadow-sm">
                <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
                    <div>
                        <p class="text-xs uppercase tracking-[0.22em] opacity-90">AI Budget Defense</p>
                        <h3 class="text-2xl md:text-3xl font-bold mt-2">Money leaking here</h3>
                        <p class="mt-2 opacity-90">Recurring services are detected from your transaction history and annualized for impact.</p>
                    </div>
                    <div class="md:text-right">
                        <p class="text-xs uppercase tracking-wide opacity-90">Potential leak/year</p>
                        <p class="text-4xl font-black mt-1">₹<span x-text="formatNumber(liveLeakCost)"></span></p>
                        <p class="text-sm mt-1 opacity-90" x-text="`${liveUnusedCount} service(s) need review`"></p>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="vf-card p-5">
                    <p class="text-sm text-gray-500">Detected Recurring</p>
                    <p class="mt-1 text-2xl font-bold text-gray-900" x-text="liveCount"></p>
                </div>
                <div class="vf-card p-5">
                    <p class="text-sm text-gray-500">Annual Recurring Cost</p>
                    <p class="mt-1 text-2xl font-bold text-gray-900">₹<span x-text="formatNumber(liveAnnualCost)"></span></p>
                </div>
                <div class="vf-card p-5">
                    <p class="text-sm text-gray-500">Unused / At Risk</p>
                    <p class="mt-1 text-2xl font-bold text-rose-600" x-text="liveUnusedCount"></p>
                </div>
                <div class="vf-card p-5">
                    <p class="text-sm text-gray-500">Portfolio Health</p>
                    <p class="mt-1 text-2xl font-bold" :class="healthClass" x-text="healthLabel"></p>
                </div>
            </div>

            <div class="vf-card p-5">
                <div class="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                    <div class="md:col-span-2">
                        <label class="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Search Service</label>
                        <input type="text" class="vf-input" placeholder="Netflix, ChatGPT, Prime..." x-model.debounce.250ms="search">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Cadence</label>
                        <select class="vf-input" x-model="cadence">
                            <option value="all">All</option>
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                            <option value="yearly">Yearly</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Sort By</label>
                        <select class="vf-input" x-model="sortBy">
                            <option value="annual_desc">Annual Cost (High to Low)</option>
                            <option value="annual_asc">Annual Cost (Low to High)</option>
                            <option value="risk_desc">Unused Risk (High to Low)</option>
                            <option value="confidence_desc">Confidence (High to Low)</option>
                        </select>
                    </div>
                    <div class="flex items-center gap-2">
                        <button class="vf-btn w-full" @click="leakOnly = !leakOnly" :class="leakOnly ? '' : 'opacity-85'" type="button">
                            <span x-text="leakOnly ? 'Showing Leak Only' : 'Focus Leak Mode'"></span>
                        </button>
                    </div>
                </div>
            </div>

            <div class="space-y-3" x-show="filtered.length > 0">
                <template x-for="subscription in filtered" :key="subscription.group_key">
                    <div class="vf-card p-5">
                        <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                            <div class="space-y-2">
                                <div class="flex flex-wrap items-center gap-2">
                                    <h4 class="text-lg font-semibold text-gray-900" x-text="subscription.name"></h4>
                                    <span class="text-xs font-semibold px-2 py-1 rounded-full bg-purple-50 text-purple-700" x-text="titleCase(subscription.cadence)"></span>
                                    <span class="text-xs font-semibold px-2 py-1 rounded-full"
                                          :class="statusClass(subscription.status)"
                                          x-text="statusLabel(subscription.status)"></span>
                                </div>
                                <p class="text-sm text-gray-500">
                                    Last paid <span x-text="formatDate(subscription.last_payment)"></span> •
                                    <span x-text="subscription.days_since_last"></span> day(s) ago
                                </p>
                                <div class="w-full bg-purple-50 rounded-full h-2.5 overflow-hidden">
                                    <div class="h-2.5 rounded-full bg-gradient-to-r from-amber-400 to-rose-500" :style="`width: ${Math.min(subscription.unused_score, 100)}%`"></div>
                                </div>
                                <p class="text-xs text-gray-500">Unused likelihood: <span class="font-semibold" x-text="`${subscription.unused_score}%`"></span></p>
                            </div>

                            <div class="lg:text-right space-y-2 lg:min-w-[260px]">
                                <p class="text-sm text-gray-500">Annual Cost</p>
                                <p class="text-3xl font-black text-gray-900">₹<span x-text="formatNumber(subscription.annual_cost)"></span></p>
                                <p class="text-xs text-gray-500">Confidence: <span class="font-semibold" x-text="`${subscription.confidence}%`"></span></p>
                                <div class="flex lg:justify-end gap-2 pt-1">
                                    <button class="px-3 py-1.5 text-xs rounded-md border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                            type="button"
                                            @click="overrideStatus(subscription.group_key, 'active')">
                                        Mark Active
                                    </button>
                                    <button class="px-3 py-1.5 text-xs rounded-md border border-rose-200 text-rose-700 hover:bg-rose-50"
                                            type="button"
                                            @click="overrideStatus(subscription.group_key, 'likely_unused')">
                                        Mark Unused
                                    </button>
                                    <button class="px-3 py-1.5 text-xs rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50"
                                            type="button"
                                            @click="clearOverride(subscription.group_key)">
                                        Reset
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </div>

            <div x-show="filtered.length === 0" class="vf-card p-8 text-center text-gray-600">
                <p class="font-semibold text-gray-800">No recurring subscriptions match this filter.</p>
                <p class="text-sm mt-1">Try clearing search or leak mode to explore all detected services.</p>
            </div>
        </div>
    </div>

    <script>
        function subscriptionRadar(seedSubscriptions, seedSummary) {
            return {
                all: seedSubscriptions || [],
                summary: seedSummary || {},
                filtered: [],
                search: '',
                cadence: 'all',
                sortBy: 'annual_desc',
                leakOnly: false,
                overrides: {},
                liveAnnualCost: 0,
                liveLeakCost: 0,
                liveUnusedCount: 0,
                liveCount: 0,
                init() {
                    this.loadOverrides();
                    this.$watch('search', () => this.refresh());
                    this.$watch('cadence', () => this.refresh());
                    this.$watch('sortBy', () => this.refresh());
                    this.$watch('leakOnly', () => this.refresh());
                    this.refresh();
                },
                get healthLabel() {
                    if (this.liveCount === 0) return 'No Data';
                    const riskRatio = this.liveLeakCost / Math.max(1, this.liveAnnualCost);
                    if (riskRatio >= 0.45) return 'Critical';
                    if (riskRatio >= 0.2) return 'Warning';
                    return 'Healthy';
                },
                get healthClass() {
                    if (this.healthLabel === 'Critical') return 'text-rose-600';
                    if (this.healthLabel === 'Warning') return 'text-amber-600';
                    return 'text-emerald-600';
                },
                effectiveStatus(subscription) {
                    return this.overrides[subscription.group_key] || subscription.status;
                },
                refresh() {
                    const term = this.search.trim().toLowerCase();
                    const withStatus = this.all.map((item) => ({ ...item, status: this.effectiveStatus(item) }));

                    let output = withStatus.filter((item) => {
                        const matchesSearch = !term || item.name.toLowerCase().includes(term);
                        const matchesCadence = this.cadence === 'all' || item.cadence === this.cadence;
                        const matchesLeak = !this.leakOnly || item.status !== 'active';
                        return matchesSearch && matchesCadence && matchesLeak;
                    });

                    output.sort((a, b) => {
                        if (this.sortBy === 'annual_asc') return a.annual_cost - b.annual_cost;
                        if (this.sortBy === 'risk_desc') return b.unused_score - a.unused_score;
                        if (this.sortBy === 'confidence_desc') return b.confidence - a.confidence;
                        return b.annual_cost - a.annual_cost;
                    });

                    this.filtered = output;
                    this.computeLiveSummary(withStatus);
                },
                computeLiveSummary(items) {
                    this.liveCount = items.length;
                    this.liveAnnualCost = items.reduce((sum, item) => sum + Number(item.annual_cost || 0), 0);
                    this.liveLeakCost = items
                        .filter((item) => item.status !== 'active')
                        .reduce((sum, item) => sum + Number(item.annual_cost || 0), 0);
                    this.liveUnusedCount = items.filter((item) => item.status !== 'active').length;
                },
                overrideStatus(groupKey, status) {
                    this.overrides[groupKey] = status;
                    this.persistOverrides();
                    this.refresh();
                },
                clearOverride(groupKey) {
                    delete this.overrides[groupKey];
                    this.persistOverrides();
                    this.refresh();
                },
                persistOverrides() {
                    localStorage.setItem('subscription-radar-overrides', JSON.stringify(this.overrides));
                },
                loadOverrides() {
                    try {
                        this.overrides = JSON.parse(localStorage.getItem('subscription-radar-overrides') || '{}');
                    } catch (error) {
                        this.overrides = {};
                    }
                },
                titleCase(value) {
                    return value.charAt(0).toUpperCase() + value.slice(1);
                },
                formatNumber(value) {
                    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(value || 0));
                },
                formatDate(value) {
                    return new Date(value).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                    });
                },
                statusLabel(status) {
                    if (status === 'likely_unused') return 'Likely Unused';
                    if (status === 'review') return 'Review Needed';
                    return 'Active';
                },
                statusClass(status) {
                    if (status === 'likely_unused') return 'bg-rose-50 text-rose-700';
                    if (status === 'review') return 'bg-amber-50 text-amber-700';
                    return 'bg-emerald-50 text-emerald-700';
                }
            }
        }
    </script>
</x-app-layout>
