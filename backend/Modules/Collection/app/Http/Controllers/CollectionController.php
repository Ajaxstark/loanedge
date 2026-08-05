<?php

namespace Modules\Collection\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Modules\Collection\Models\CollectionRecord;

class CollectionController extends Controller
{
    // Sab records, ya ek lead ke records (agar leadId diya ho)
    public function index($leadId = null)
    {
        $query = CollectionRecord::with('lead');

        if ($leadId) {
            $query->where('lead_id', $leadId);
        }

        $records = $query->latest()->get();

        return response()->json([
            'success' => true,
            'data' => $records
        ]);
    }

    // Naya collection record banao (overdue tracking start)
    public function store(Request $request)
    {
        $validated = $request->validate([
            'lead_id' => 'required|exists:leads,id',
            'loan_amount' => 'required|numeric|min:0',
            'overdue_days' => 'required|integer|min:0',
        ]);

        $bucket = $this->calculateBucket($validated['overdue_days']);
        $isNpa = $validated['overdue_days'] >= 90;

        $record = CollectionRecord::create([
            'lead_id' => $validated['lead_id'],
            'loan_amount' => $validated['loan_amount'],
            'overdue_days' => $validated['overdue_days'],
            'bucket' => $bucket,
            'is_npa' => $isNpa,
            'status' => 'active',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Collection record created',
            'data' => $record
        ], 201);
    }

    // Overdue days update karo -> bucket aur NPA status auto recalculate
    public function update(Request $request, $id)
    {
        $record = CollectionRecord::findOrFail($id);

        $validated = $request->validate([
            'overdue_days' => 'nullable|integer|min:0',
            'recovery_agent' => 'nullable|string',
            'remarks' => 'nullable|string',
            'status' => 'nullable|in:active,recovered,legal_notice',
        ]);

        if (isset($validated['overdue_days'])) {
            $validated['bucket'] = $this->calculateBucket($validated['overdue_days']);
            $validated['is_npa'] = $validated['overdue_days'] >= 90;
        }

        $record->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Collection record updated',
            'data' => $record
        ]);
    }

    private function calculateBucket($overdueDays)
    {
        if ($overdueDays <= 0) {
            return 'current';
        } elseif ($overdueDays <= 30) {
            return '0-30';
        } elseif ($overdueDays <= 60) {
            return '30-60';
        } elseif ($overdueDays <= 90) {
            return '60-90';
        }

        return '90+';
    }
}