<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CopySqliteToPostgres extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'data:copy-sqlite-to-postgres {--source=sqlite} {--dest=pgsql} {--tables=*}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Copy selected tables from a sqlite connection into a Postgres connection (preserves ids)';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $source = $this->option('source');
        $dest = $this->option('dest');
        $tables = $this->option('tables') ?: [];

        if (empty($tables)) {
            // default list — adjust as needed
            $tables = [
                'users',
                'categories',
                'wallets',
                'transactions',
                'budgets',
                'bank_connections',
                'loans',
                'scheduled_payments',
                'personal_access_tokens',
                'password_resets',
            ];
        }

        $this->info("Copying tables from connection '{$source}' to '{$dest}'...");

        // Disable FK checks on Postgres by setting replication role
        $this->info('Disabling foreign key checks on destination (if Postgres)...');
        try {
            DB::connection($dest)->statement("SET session_replication_role = 'replica';");
        } catch (\Throwable $e) {
            // ignore for non-postgres
        }

        foreach ($tables as $table) {
            if (! Schema::connection($source)->hasTable($table)) {
                $this->warn("Source table '{$table}' does not exist on connection '{$source}', skipping.");
                continue;
            }

            if (! Schema::connection($dest)->hasTable($table)) {
                $this->warn("Destination table '{$table}' does not exist on connection '{$dest}', skipping.");
                continue;
            }

            $this->info("Copying table: {$table}");

            $bar = $this->output->createProgressBar();

            $count = DB::connection($source)->table($table)->count();
            $bar->setFormat("%current%/%max% [%bar%] %percent:3s%% | %message%");
            $bar->start($count ?: 1);

            DB::connection($source)->table($table)->orderBy('id')->chunk(500, function ($rows) use ($dest, $table, $bar) {
                $inserts = [];
                foreach ($rows as $row) {
                    $arr = (array) $row;
                    // ensure we don't attempt to insert null id for tables with serial primary keys
                    $inserts[] = $arr;
                }

                if (! empty($inserts)) {
                    // Use insertOrIgnore to avoid conflicts if rows already exist
                    DB::connection($dest)->table($table)->insertOrIgnore($inserts);
                }

                $bar->advance(count($rows));
            });

            $bar->finish();
            $this->line('');

            // Reset Postgres sequence if present
            try {
                $maxId = DB::connection($dest)->table($table)->max('id');
                if ($maxId !== null) {
                    DB::connection($dest)->statement("SELECT setval(pg_get_serial_sequence('".$table."','id'), GREATEST({$maxId},1));");
                }
            } catch (\Throwable $e) {
                // ignore if not postgres or no serial
            }
        }

        // Re-enable FK checks
        try {
            DB::connection($dest)->statement("SET session_replication_role = 'origin';");
        } catch (\Throwable $e) {
            // ignore
        }

        $this->info('Data copy complete.');

        return 0;
    }
}
