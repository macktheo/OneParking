<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->withCredentials();
        // Feature tests must carry the same browser session cookie across requests.
        $this->app['session']->start();
        $this->withCookie(config('session.cookie'), $this->app['session']->getId());
    }
}
