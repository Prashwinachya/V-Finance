<?php

use App\Http\Controllers\SpaController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/uploads/{path}', function (string $path) {
    $filePath = public_path('uploads/'.$path);

    abort_unless(is_file($filePath), 404);

    return response()->file($filePath);
})->where('path', '.*');

Route::get('/{any?}', SpaController::class)->where('any', '^(?!api).*$');
