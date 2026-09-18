<?php

namespace Modules\Collection\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Modules\Collection\Models\CollectionRecord;
use Modules\Collection\Services\CollectionService;

class CollectionController extends Controller
{
    protected $collectionService;

    public function __construct(CollectionService $collectionService)
    {
        $this->collectionService = $collectionService;
    }

    // Sab collection records, ya ek loan ke (agar loanId diya ho)
    public function index($loanId = null)
    {
        $query = CollectionRecord::with('loan.lead');

        if ($loanId) {
            $query->where('loan_id', $loanId);
        }

        $records = $query->latest()->get();

        return response()->json([
            'success' => true,
            'data' => $records
        ]);
    }

    // Sab active loans ke liye overdue recalculate karo (manual trigger / cron dono se chalega)
    public function recalculate()
    {
        $records = $this->collectionService->recalculateAll();

        return response()->json([
            'success' => true,
            'message' => count($records) . ' loan(s) recalculated',
            'data' => $records
        ]);
    }

    // Recovery agent assign karo, remarks add karo, status change karo
    public function update(Request $request, $id)
    {
        $record = CollectionRecord::findOrFail($id);

        $validated = $request->validate([
            'recovery_agent' => 'nullable|string',
            'remarks' => 'nullable|string',
            'status' => 'nullable|in:active,recovered,legal_notice',
        ]);

        $record->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Collection record updated',
            'data' => $record
        ]);
    }
}