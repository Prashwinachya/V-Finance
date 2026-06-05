<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_password_reset_web_flow_is_not_enabled_in_api_mode(): void
    {
        $this->markTestSkipped('Password reset web routes are not implemented in the API-only backend.');
    }
}
