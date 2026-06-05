<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class RestoreDataCommand extends Command
{
    protected $signature = 'data:restore {backup? : Absolute or relative path to a sqlite backup file} {--latest : Restore the most recent backup automatically} {--force : Skip confirmation}';

    protected $description = 'Restore the persistent SQLite database from a backup copy';

    public function handle(): int
    {
        if (config('database.default') !== 'sqlite') {
            $this->info('Skipping restore: default database is not sqlite.');

            return self::SUCCESS;
        }

        $databasePath = (string) config('database.connections.sqlite.database');
        if ($databasePath === '' || $databasePath === ':memory:') {
            $this->error('Restore failed: configured sqlite database path is invalid.');

            return self::FAILURE;
        }

        $backupPath = $this->resolveBackupPath();
        if (! $backupPath) {
            return self::FAILURE;
        }

        if (! File::exists($backupPath)) {
            $this->error('Restore failed: backup file not found at '.$backupPath);

            return self::FAILURE;
        }

        if (! $this->option('force')) {
            $confirmed = $this->confirm('This will overwrite the live database at '.$databasePath.'. Continue?', false);
            if (! $confirmed) {
                $this->warn('Restore cancelled.');

                return self::SUCCESS;
            }
        }

        File::ensureDirectoryExists(dirname($databasePath));
        File::ensureDirectoryExists(storage_path('app/backups/database'));

        if (File::exists($databasePath)) {
            $safetyCopy = storage_path('app/backups/database/pre_restore_'.now()->format('Ymd_His').'.sqlite');
            if (! @copy($databasePath, $safetyCopy)) {
                $this->error('Restore failed: unable to create a safety copy of the live database.');

                return self::FAILURE;
            }

            $this->info('Safety copy created: '.$safetyCopy);
        }

        if (! @copy($backupPath, $databasePath)) {
            $this->error('Restore failed: unable to copy backup into the live database path.');

            return self::FAILURE;
        }

        $this->info('Database restored successfully from: '.$backupPath);

        return self::SUCCESS;
    }

    private function resolveBackupPath(): ?string
    {
        $provided = $this->argument('backup');
        if (is_string($provided) && trim($provided) !== '') {
            $path = trim($provided);

            return str_starts_with($path, DIRECTORY_SEPARATOR) ? $path : base_path($path);
        }

        if (! $this->option('latest')) {
            $this->error('Restore failed: provide a backup path or use --latest.');

            return null;
        }

        $candidates = File::glob(storage_path('app/backups/database/database_*.sqlite'));
        if (empty($candidates)) {
            $this->error('Restore failed: no backup files found in storage/app/backups/database.');

            return null;
        }

        usort($candidates, static fn (string $left, string $right): int => strcmp($right, $left));

        return $candidates[0];
    }
}

