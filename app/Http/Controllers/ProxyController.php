<?php

namespace App\Http\Controllers;

use Illuminate\Http\Client\Response as ClientResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Symfony\Component\HttpFoundation\Response;

class ProxyController extends Controller
{
    public function api(Request $request, ?string $path = null): Response
    {
        $targetUrl = rtrim(config('services.vfinance.node_api_url'), '/').'/api/'.ltrim((string) $path, '/');
        $method = strtoupper($request->method());

        $options = [
            'query' => $request->query(),
        ];

        if (! in_array($method, ['GET', 'HEAD'], true)) {
            if ($request->allFiles()) {
                $options['multipart'] = $this->buildMultipartPayload($request);
            } elseif ($this->isJsonRequest($request)) {
                $options['json'] = $request->all();
            } else {
                $options['form_params'] = $request->request->all();
            }
        }

        $upstream = Http::withHeaders($this->forwardHeaders($request))
            ->withOptions(['http_errors' => false])
            ->send($method, $targetUrl, $options);

        return response($upstream->body(), $upstream->status())
            ->withHeaders($this->responseHeaders($upstream));
    }

    private function buildMultipartPayload(Request $request): array
    {
        $payload = [];

        foreach ($request->request->all() as $key => $value) {
            $payload[] = [
                'name' => $key,
                'contents' => is_scalar($value) ? (string) $value : json_encode($value),
            ];
        }

        foreach ($request->allFiles() as $key => $file) {
            $payload[] = [
                'name' => $key,
                'contents' => fopen($file->getRealPath(), 'r'),
                'filename' => $file->getClientOriginalName(),
                'headers' => [
                    'Content-Type' => $file->getMimeType() ?: 'application/octet-stream',
                ],
            ];
        }

        return $payload;
    }

    private function forwardHeaders(Request $request): array
    {
        return array_filter([
            'Accept' => $request->header('Accept'),
            'Authorization' => $request->header('Authorization'),
            'X-Requested-With' => $request->header('X-Requested-With'),
        ]);
    }

    private function responseHeaders(ClientResponse $response): array
    {
        $excluded = ['connection', 'content-length', 'host', 'transfer-encoding'];

        return collect($response->headers())
            ->reject(fn ($value, $key) => in_array(strtolower($key), $excluded, true))
            ->map(fn ($value) => is_array($value) ? implode(', ', $value) : $value)
            ->all();
    }

    private function isJsonRequest(Request $request): bool
    {
        $contentType = (string) $request->header('Content-Type', '');

        return $request->isJson() || str_contains($contentType, 'application/json');
    }
}