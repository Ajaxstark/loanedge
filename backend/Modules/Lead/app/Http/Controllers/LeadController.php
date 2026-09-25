<?php

namespace Modules\Lead\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Modules\Lead\Models\Lead;

class LeadController extends Controller
{
    /**
     * Display a listing of leads.
     */
    public function index(Request $request)
    {
        $query = Lead::query();

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by source
        if ($request->filled('source')) {
            $query->where('source', $request->source);
        }

        // Search by name/phone/email
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $leads = $query->latest()->paginate(50);

        return response()->json([
            'success' => true,
            'data' => $leads,
        ], 200);
    }

    /**
     * Store a newly created lead.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:15',
            'email' => 'nullable|email',
            'loan_amount_required' => 'required|numeric|min:0',
            'loan_type' => 'nullable|string|max:100',
            'source' => 'required|in:website,walk_in,dsa,referral',
        ]);

        $lead = Lead::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Lead created successfully',
            'data' => $lead,
        ], 201);
    }

    /**
     * Show a specific lead.
     */
    public function show($id)
    {
        $lead = Lead::with([
            'applications',
            'underwritingReports',
            'loans',
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $lead,
        ], 200);
    }

    /**
     * Update a specific lead.
     */
    public function update(Request $request, $id)
    {
        $lead = Lead::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'sometimes|string|max:15',
            'email' => 'nullable|email',
            'loan_amount_required' => 'sometimes|numeric|min:0',
            'loan_type' => 'nullable|string|max:100',
            'source' => 'sometimes|in:website,walk_in,dsa,referral',
            'status' => 'sometimes|in:new,qualified,rejected',
        ]);

        $lead->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Lead updated successfully',
            'data' => $lead,
        ], 200);
    }

    /**
     * Remove a specific lead.
     */
    public function destroy($id)
    {
        $lead = Lead::findOrFail($id);
        $lead->delete();

        return response()->json([
            'success' => true,
            'message' => 'Lead deleted successfully',
        ], 200);
    }
}