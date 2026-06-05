<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Loan extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'bank_connection_id',
        'name',
        'lender',
        'annual_rate',
        'remaining_principal',
        'emi',
        'start_date',
        'tenure_months',
        'notes',
    ];

    protected $casts = [
        'annual_rate' => 'decimal:2',
        'remaining_principal' => 'decimal:2',
        'emi' => 'decimal:2',
        'start_date' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function bankConnection(): BelongsTo
    {
        return $this->belongsTo(BankConnection::class);
    }
}
