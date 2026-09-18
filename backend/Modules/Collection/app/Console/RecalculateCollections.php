<?php

namespace Modules\Collection\Console\Commands;

use Illuminate\Console\Command;
use Modules\Collection\Services\CollectionService;

class RecalculateCollections extends Command
{
    protected $signature = 'collections:recalculate';
    protected $description = 'Recalculate overdue buckets and NPA status for all active loans';

    public function handle(CollectionService $collectionService)
    {
        $records = $collectionService->recalculateAll();
        $this->info(count($records) . ' loan(s) recalculated successfully.');
    }
}