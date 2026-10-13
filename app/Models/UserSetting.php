<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'theme',
        'currency',
        'date_format',
        'language',
        'layout_density',
        'alerts_config',
        'privacy_config',
        'payment_config',
        'investment_config',
        'notification_preferences',
    ];

    protected $casts = [
        'alerts_config' => 'array',
        'privacy_config' => 'array',
        'payment_config' => 'array',
        'investment_config' => 'array',
        'notification_preferences' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
