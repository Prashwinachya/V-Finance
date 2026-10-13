<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BankConnectionController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\LoanController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\SecurityController;
use App\Http\Controllers\Api\SubscriptionRadarController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\TripController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\WalletController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\FinancialAutopilotController;
use App\Http\Controllers\Api\EmergencyModeController;
use App\Http\Controllers\Api\FinancialPulseController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function (): void {
	Route::get('/auth/me', [AuthController::class, 'me']);

	Route::get('/dashboard', [DashboardController::class, 'index']);

	Route::get('/transactions', [TransactionController::class, 'index']);
	Route::post('/transactions', [TransactionController::class, 'store']);
	Route::put('/transactions/{transaction}', [TransactionController::class, 'update']);
	Route::delete('/transactions/{transaction}', [TransactionController::class, 'destroy']);

	Route::get('/wallets', [WalletController::class, 'index']);
	Route::post('/wallets', [WalletController::class, 'store']);
	Route::get('/wallets/{wallet}', [WalletController::class, 'show']);
	Route::put('/wallets/{wallet}', [WalletController::class, 'update']);
	Route::post('/wallets/{wallet}/add-money', [WalletController::class, 'addMoney']);
	Route::post('/wallets/{wallet}/withdraw-money', [WalletController::class, 'withdrawMoney']);

	Route::get('/trips', [TripController::class, 'index']);
	Route::post('/trips', [TripController::class, 'store']);
	Route::put('/trips/{tripBudget}', [TripController::class, 'update']);
	Route::delete('/trips/{tripBudget}', [TripController::class, 'destroy']);

	Route::get('/loans', [LoanController::class, 'index']);
	Route::post('/loans', [LoanController::class, 'store']);
	Route::put('/loans/{loan}', [LoanController::class, 'update']);
	Route::delete('/loans/{loan}', [LoanController::class, 'destroy']);
	Route::get('/loans/optimizer/summary', [LoanController::class, 'summary']);

	Route::get('/payments', [PaymentController::class, 'index']);
	Route::get('/payments/overview', [PaymentController::class, 'overview']);
	Route::post('/payments', [PaymentController::class, 'store']);
	Route::put('/payments/{scheduledPayment}', [PaymentController::class, 'update']);
	Route::delete('/payments/{scheduledPayment}', [PaymentController::class, 'destroy']);
	Route::post('/payments/{scheduledPayment}/pay-now', [PaymentController::class, 'payNow']);
	Route::post('/payments/scan-pay', [PaymentController::class, 'scanPay']);

	Route::get('/subscriptions/radar', [SubscriptionRadarController::class, 'index']);

	Route::put('/user/profile', [UserController::class, 'updateProfile']);
	Route::post('/user/avatar', [UserController::class, 'uploadAvatar']);
	Route::get('/user/avatar/backups', [UserController::class, 'listAvatarBackups']);
	Route::post('/user/avatar/restore', [UserController::class, 'restoreAvatarBackup']);
	Route::put('/user/password', [UserController::class, 'updatePassword']);
	Route::put('/user/password/forgot', [UserController::class, 'forgotPasswordReset']);
	Route::put('/user/pin', [UserController::class, 'updatePin']);
	Route::delete('/user/pin', [UserController::class, 'resetPin']);
	Route::put('/user/security', [UserController::class, 'updateSecurity']);

	// Settings & FCC
	Route::get('/settings', [SettingsController::class, 'getSettings']);
	Route::put('/settings', [SettingsController::class, 'updateSettings']);
	Route::get('/settings/sessions', [SettingsController::class, 'getActiveSessions']);
	Route::delete('/settings/sessions/{id}', [SettingsController::class, 'revokeSession']);
	Route::post('/settings/lock-account', [SettingsController::class, 'lockAccount']);

	Route::get('/audit-logs', [AuditLogController::class, 'index']);
	Route::get('/financial-autopilot', [FinancialAutopilotController::class, 'index']);
	Route::get('/emergency-mode', [EmergencyModeController::class, 'getEmergencyData']);
	Route::get('/financial-pulse', [FinancialPulseController::class, 'getPulse']);

	Route::get('/banks', [BankConnectionController::class, 'index']);
	Route::post('/banks/connect', [BankConnectionController::class, 'store']);
	Route::post('/banks/demo-sync', [BankConnectionController::class, 'demoSync']);
	Route::put('/banks/primary-selection', [BankConnectionController::class, 'updatePrimarySelection']);
	Route::post('/banks/sync-primary', [BankConnectionController::class, 'syncPrimary']);
	Route::post('/banks/{bankConnection}/primary', [BankConnectionController::class, 'setPrimary']);
	Route::post('/banks/{bankConnection}/sync', [BankConnectionController::class, 'sync']);
	Route::delete('/banks/{bankConnection}', [BankConnectionController::class, 'destroy']);

	Route::get('/security/webauthn/register-options', [SecurityController::class, 'registerOptions']);
	Route::post('/security/webauthn/register', [SecurityController::class, 'register']);
	Route::delete('/security/webauthn/reset', [SecurityController::class, 'resetFingerprints']);
	Route::get('/security/webauthn/auth-options', [SecurityController::class, 'authOptions']);
	Route::post('/security/verify-payment', [SecurityController::class, 'verifyPayment']);
	Route::post('/security/verify-login-biometric', [SecurityController::class, 'verifyLoginBiometric']);

	Route::middleware('admin')->group(function (): void {
		Route::get('/admin/stats', [AdminController::class, 'stats']);
		Route::get('/admin/users', [AdminController::class, 'users']);
		Route::post('/admin/users', [AdminController::class, 'storeUser']);
		Route::patch('/admin/users/{user}', [AdminController::class, 'updateUser']);
		Route::delete('/admin/users/{user}', [AdminController::class, 'destroyUser']);
		Route::get('/admin/transactions', [AdminController::class, 'transactions']);
		Route::get('/admin/budgets', [AdminController::class, 'budgets']);
	});
});
