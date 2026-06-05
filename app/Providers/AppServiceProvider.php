<?php

namespace App\Providers;

use Illuminate\Support\Facades\File;
use Illuminate\Support\ServiceProvider;
use RuntimeException;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (config('database.default') !== 'sqlite') {
            return;
        }

        $databasePath = (string) config('database.connections.sqlite.database');
        $persistentDatabasePath = database_path('database.sqlite');

        if (app()->runningUnitTests() && $databasePath === $persistentDatabasePath) {
            throw new RuntimeException(
                'Tests are configured to use the persistent SQLite database at ['.$databasePath.']. '
                .'This is blocked to prevent data loss. Configure phpunit.xml to use DB_DATABASE=:memory:.'
            );
        }

        if ($databasePath === ':memory:' && ! app()->runningUnitTests() && ! app()->environment('testing')) {
            throw new RuntimeException('SQLite in-memory database is disabled outside tests to protect persistent data.');
        }

        if ($databasePath !== '' && $databasePath !== ':memory:' && ! File::exists($databasePath)) {
            $backupDir = storage_path('app/backups/database');

            throw new RuntimeException(
                'Configured SQLite database file is missing at ['.$databasePath.']. '
                .'Startup is blocked to protect persisted data from being replaced with a new empty database. '
                .'Restore a backup from ['.$backupDir.'] or correct DB_DATABASE in .env.'
            );
        }
    }
}
