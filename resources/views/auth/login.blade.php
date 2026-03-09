<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>{{ config('app.name', 'VFinance') }}</title>

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600,700,800&display=swap" rel="stylesheet" />

        @vite(['resources/css/app.css', 'resources/js/app.js'])
    </head>
    <body class="min-h-screen bg-rose-50 antialiased">
        <main class="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center px-6 pb-10 pt-10">
            <div class="flex flex-col items-center">
                <div class="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-pink-500 via-rose-500 to-purple-500 shadow-lg shadow-pink-200/70">
                    <span class="text-3xl font-semibold text-white">v</span>
                </div>

                <h1 class="mt-4 text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 leading-none">
                    VFinance
                </h1>

                <h2 class="mt-6 text-center text-4xl font-bold tracking-tight text-fuchsia-900 sm:text-5xl">Welcome Fam</h2>
                <p class="mt-3 text-center text-lg text-slate-600">Sign in to your VFinance account</p>

                <div class="mt-6 flex w-40 items-center justify-center gap-3">
                    <span class="h-px flex-1 bg-gradient-to-r from-transparent via-pink-300 to-transparent"></span>
                    <span class="h-2.5 w-2.5 rounded-full bg-pink-500"></span>
                    <span class="h-px flex-1 bg-gradient-to-r from-transparent via-pink-300 to-transparent"></span>
                </div>
            </div>

            <section class="mt-10 w-full max-w-2xl rounded-3xl bg-white/70 p-6 shadow-xl shadow-indigo-200/40 backdrop-blur-sm sm:p-8">
                @if (session('status'))
                    <p class="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                        {{ session('status') }}
                    </p>
                @endif

                <form method="POST" action="{{ route('login') }}" class="space-y-6">
                    @csrf

                    <div>
                        <label for="email" class="mb-2 block text-sm font-semibold text-slate-700">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value="{{ old('email') }}"
                            required
                            autofocus
                            autocomplete="username"
                            class="h-14 w-full rounded-xl border border-slate-300 bg-slate-200 px-4 text-base text-slate-700 outline-none transition focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
                        />
                        @error('email')
                            <p class="mt-2 text-base text-rose-600">{{ $message }}</p>
                        @enderror
                    </div>

                    <div>
                        <label for="password" class="mb-2 block text-sm font-semibold text-slate-700">Password</label>
                        <div class="relative">
                            <span class="pointer-events-none absolute inset-y-0 left-4 flex items-center text-pink-200">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-5 w-5">
                                    <path fill-rule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25V9H6a2.25 2.25 0 00-2.25 2.25v8.25A2.25 2.25 0 006 21.75h12a2.25 2.25 0 002.25-2.25v-8.25A2.25 2.25 0 0018 9h-.75V6.75A5.25 5.25 0 0012 1.5zm3.75 7.5V6.75a3.75 3.75 0 00-7.5 0V9h7.5z" clip-rule="evenodd" />
                                </svg>
                            </span>

                            <input
                                id="password"
                                type="password"
                                name="password"
                                required
                                autocomplete="current-password"
                                class="h-14 w-full rounded-xl border-2 border-pink-300 bg-white pl-12 pr-4 text-base text-slate-700 outline-none transition focus:border-pink-500 focus:ring-4 focus:ring-pink-100"
                            />
                        </div>
                        @error('password')
                            <p class="mt-2 text-base text-rose-600">{{ $message }}</p>
                        @enderror
                    </div>

                    <div class="flex items-center justify-between gap-4 text-sm">
                        <label for="remember" class="inline-flex items-center gap-2.5 text-slate-500">
                            <input
                                id="remember"
                                type="checkbox"
                                name="remember"
                                class="h-4 w-4 rounded border-slate-300 text-pink-600 focus:ring-pink-500"
                            >
                            <span>Remember me</span>
                        </label>

                        @if (Route::has('password.request'))
                            <a href="{{ route('password.request') }}" class="font-semibold text-pink-500 transition hover:text-pink-600">
                                Forgot password?
                            </a>
                        @endif
                    </div>

                    <button
                        type="submit"
                        class="mt-2 inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 px-5 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-lg shadow-pink-200 transition hover:from-pink-500 hover:to-rose-500 focus:outline-none focus:ring-4 focus:ring-pink-200"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-5 w-5">
                            <path fill-rule="evenodd" d="M15.75 2.25a.75.75 0 01.75.75v2.128a3 3 0 012.25 2.872v7.5a3 3 0 01-3 3h-2.128a.75.75 0 010-1.5h2.128a1.5 1.5 0 001.5-1.5V8a1.5 1.5 0 00-1.5-1.5h-2.128a.75.75 0 010-1.5h2.128A3 3 0 0116.5 3V3a.75.75 0 01.75-.75zM3 12a.75.75 0 01.75-.75h9.19l-2.47-2.47a.75.75 0 111.06-1.06l3.75 3.75a.75.75 0 010 1.06l-3.75 3.75a.75.75 0 11-1.06-1.06l2.47-2.47H3.75A.75.75 0 013 12z" clip-rule="evenodd" />
                        </svg>
                        SIGN IN
                    </button>
                </form>
            </section>
        </main>
    </body>
</html>
