<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'category_id',
        'wallet_id',
        'bank_connection_id',
        'title',
        'category',
        'description',
        'amount',
        'type',
        'transaction_type',
        'source',
        'external_reference',
        'is_recurring',
        'recurrence',
        'user_deleted',
        'user_deleted_at',
        'date',
        'timestamp',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'date' => 'datetime',
        'timestamp' => 'datetime',
        'is_recurring' => 'boolean',
        'user_deleted' => 'boolean',
        'user_deleted_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function wallet(): BelongsTo
    {
        return $this->belongsTo(Wallet::class);
    }

    public function bankConnection(): BelongsTo
    {
        return $this->belongsTo(BankConnection::class);
    }
}
