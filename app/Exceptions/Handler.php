<?php

namespace App\Exceptions;

use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * The list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });

        $this->renderable(function (QueryException $exception, Request $request): ?JsonResponse {
            if (! $request->is('api/*')) {
                return null;
            }

            $message = strtolower($exception->getMessage());
            if (
                str_contains($message, 'no such column: webauthn_rp_id')
                || str_contains($message, 'no such column: webauthn_credentials_json')
            ) {
                return response()->json([
                    'message' => 'Security setup is temporarily unavailable. Please run database migrations and try again.',
                    'code' => 'missing_schema_column',
                ], 503);
            }

            return null;
        });
    }
}
