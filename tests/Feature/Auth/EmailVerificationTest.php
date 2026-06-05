<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmailVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_email_verification_flow_is_not_enabled_in_api_mode(): void
    {
        $this->markTestSkipped('Email verification web routes are not part of the current API-first authentication flow.');
    }
}
