<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class BackupDataCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'data:backup {--keep-days=30 : Number of days to retain old backups}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a persistent backup copy of the SQLite database and prune old backups';

    public function handle(): int
    {
        if (config('database.default') !== 'sqlite') {
            $this->info('Skipping data backup: default database is not sqlite.');

            return self::SUCCESS;
        }

        $databasePath = (string) config('database.connections.sqlite.database');

        if ($databasePath === '' || $databasePath === ':memory:' || ! File::exists($databasePath)) {
            $this->error('Backup failed: persistent sqlite database file not found.');

            return self::FAILURE;
        }

        $backupDir = storage_path('app/backups/database');
        File::ensureDirectoryExists($backupDir);

        $backupPath = $backupDir.'/database_'.now()->format('Ymd_His').'.sqlite';

        if (! @copy($databasePath, $backupPath)) {
            $this->error('Backup failed: unable to copy sqlite file.');

            return self::FAILURE;
        }

        $keepDays = max(1, (int) $this->option('keep-days'));
        $cutoffTimestamp = now()->subDays($keepDays)->getTimestamp();

        foreach (File::glob($backupDir.'/database_*.sqlite') as $candidate) {
            $lastModified = @filemtime($candidate) ?: 0;
            if ($lastModified > 0 && $lastModified < $cutoffTimestamp) {
                @unlink($candidate);
            }
        }

        $this->info('Database backup created: '.$backupPath);

        return self::SUCCESS;
    }
}
