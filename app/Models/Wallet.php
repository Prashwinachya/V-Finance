<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Wallet extends Model
{
    use HasFactory;

    public const MAX_BUSINESS_WALLETS = 3;
    public const MAX_STUDENT_WALLETS = 1;
    public const MAX_WALLETS = 3;

    public const TYPE_TRAVELLING = 'travelling_wallet';
    public const TYPE_MEDICAL_EMERGENCY = 'medical_emergency_wallet';
    public const TYPE_POCKET_SAVER = 'pocket_saver_wallet';

    public const ALLOWED_BUSINESS_TYPES = [
        self::TYPE_TRAVELLING,
        self::TYPE_MEDICAL_EMERGENCY,
        self::TYPE_POCKET_SAVER,
    ];

    public const ALLOWED_STUDENT_TYPES = [
        self::TYPE_POCKET_SAVER,
    ];

    protected $fillable = [
        'user_id',
        'bank_connection_id',
        'name',
        'wallet_type',
        'balance',
        'last_withdrawal_date',
    ];

    protected $casts = [
        'balance' => 'decimal:2',
        'last_withdrawal_date' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function bankConnection(): BelongsTo
    {
        return $this->belongsTo(BankConnection::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }
}
