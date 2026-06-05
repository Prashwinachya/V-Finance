<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        if ((bool) env('DATA_BACKUP_ENABLED', true)) {
            $keepDays = max(1, (int) env('DATA_BACKUP_KEEP_DAYS', 30));
            $schedule
                ->command('data:backup --keep-days='.$keepDays)
                ->dailyAt('02:30')
                ->withoutOverlapping();
        }
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
