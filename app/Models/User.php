<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'is_super_admin',
        'role',
        'last_login_at',
        'login_count',
        'avatar_url',
        'phone',
        'date_of_birth',
        'gender',
        'city',
        'country',
        'timezone',
        'bio',
        'require_payment_pin',
        'portal',
        'require_payment_fingerprint',
        'payment_pin_enabled',
        'payment_pin_hash',
        'fingerprint_enabled',
        'webauthn_credential_id',
        'webauthn_public_key',
        'webauthn_register_challenge',
        'webauthn_auth_challenge',
        'webauthn_rp_id',
        'webauthn_credentials_json',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'payment_pin_hash',
        'webauthn_public_key',
        'webauthn_register_challenge',
        'webauthn_auth_challenge',
        'webauthn_credentials_json',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'last_login_at' => 'datetime',
        'date_of_birth' => 'date',
        'password' => 'hashed',
        'is_super_admin' => 'boolean',
        'portal' => 'string',
        'require_payment_pin' => 'boolean',
        'require_payment_fingerprint' => 'boolean',
        'payment_pin_enabled' => 'boolean',
        'fingerprint_enabled' => 'boolean',
        'webauthn_credentials_json' => 'array',
    ];

    public function wallets(): HasMany
    {
        return $this->hasMany(Wallet::class);
    }

    public function loans(): HasMany
    {
        return $this->hasMany(Loan::class);
    }

    public function tripBudgets(): HasMany
    {
        return $this->hasMany(TripBudget::class);
    }

    public function scheduledPayments(): HasMany
    {
        return $this->hasMany(ScheduledPayment::class);
    }

    public function isAdmin(): bool
    {
        return in_array($this->role, ['admin', 'super_admin'], true) || $this->is_super_admin;
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === 'super_admin' || $this->is_super_admin;
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    public function budgets(): HasMany
    {
        return $this->hasMany(Budget::class);
    }

    public function bankConnections(): HasMany
    {
        return $this->hasMany(BankConnection::class);
    }

    public function settings(): HasOne
    {
        return $this->hasOne(UserSetting::class);
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(UserActivityLog::class);
    }

    public function getTotalBalanceAttribute(): float
    {
        $income = (float) $this->transactions()->where('type', 'income')->sum('amount');
        $expense = (float) $this->transactions()->where('type', 'expense')->sum('amount');

        return $income - $expense;
    }

    public function getMonthlyIncomeAttribute(): float
    {
        return (float) $this->transactions()
            ->where('type', 'income')
            ->whereMonth('date', now()->month)
            ->whereYear('date', now()->year)
            ->sum('amount');
    }

    public function getMonthlyExpensesAttribute(): float
    {
        return (float) $this->transactions()
            ->where('type', 'expense')
            ->whereMonth('date', now()->month)
            ->whereYear('date', now()->year)
            ->sum('amount');
    }
}
