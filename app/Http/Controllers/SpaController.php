<?php

namespace App\Http\Controllers;

use Illuminate\Contracts\View\View;
use Illuminate\Support\Facades\Http;

class SpaController extends Controller
{
    public function __invoke(): View
    {
        $devServerUrl = rtrim(config('services.vfinance.dev_server_url'), '/');
        $useDevServer = app()->environment('local')
            && (bool) config('services.vfinance.use_dev_server')
            && $this->devServerIsReachable($devServerUrl);
        $manifestPath = public_path('vfinance/.vite/manifest.json');
        $entry = null;

        if (! $useDevServer && file_exists($manifestPath)) {
            $manifest = json_decode(file_get_contents($manifestPath), true);
            $entry = $manifest['index.html'] ?? null;
        }

        return view('spa', [
            'useDevServer' => $useDevServer,
            'devServerUrl' => $devServerUrl,
            'entry' => $entry,
            'baseUrl' => $useDevServer ? '/' : '/',
        ]);
    }

    private function devServerIsReachable(string $devServerUrl): bool
    {
        try {
            return Http::timeout(1)->get($devServerUrl.'/@vite/client')->successful();
        } catch (\Throwable $exception) {
            return false;
        }
    }
}