<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PasswordConfirmationTest extends TestCase
{
    use RefreshDatabase;

    public function test_password_confirmation_web_flow_is_not_enabled_in_api_mode(): void
    {
        $this->markTestSkipped('Password confirmation web routes are not used in the token-based API implementation.');
    }
}
