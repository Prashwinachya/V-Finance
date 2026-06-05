<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BankConnection extends Model
{
    use HasFactory;

    public const MAX_CONNECTED_ACCOUNTS = 8;

    protected $fillable = [
        'user_id',
        'bank_name',
        'account_holder_name',
        'account_number',
        'ifsc_code',
        'access_token',
        'account_last4',
        'is_active',
        'is_primary',
        'last_synced_at',
        'meta',
    ];

    protected $casts = [
        'account_number' => 'encrypted',
        'ifsc_code' => 'encrypted',
        'access_token' => 'encrypted',
        'meta' => 'array',
        'is_active' => 'boolean',
        'is_primary' => 'boolean',
        'last_synced_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    public static function primaryIdsForUser(string|int $userId): array
    {
        return self::query()
            ->where('user_id', $userId)
            ->where('is_primary', true)
            ->pluck('id')
            ->map(static fn ($id): int => (int) $id)
            ->values()
            ->all();
    }
}
