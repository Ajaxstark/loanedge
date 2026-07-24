<?php

namespace Modules\Lead\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Modules\Lead\Models\Lead;
use Illuminate\Support\Facades\Validator;

class LeadController extends Controller
{
    /**
     * Display a listing of leads.
     */
    public function index()
    {
        $leads = Lead::latest()->get();

        return response()->json([
            'leads' => $leads,
        ], 200);
    }

    /**
     * Store a newly created lead.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:15',
            'email' => 'nullable|email',
            'loan_amount_required' => 'required|numeric',
            'loan_type' => 'nullable|string',
            'source' => 'required|in:website,walk_in,dsa,referral',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $lead = Lead::create($request->all());

        return response()->json([
            'message' => 'Lead created successfully',
            'lead' => $lead,
        ], 201);
    }

    /**
     * Show a specific lead.
     */
    public function show($id)
    {
        $lead = Lead::findOrFail($id);

        return response()->json([
            'lead' => $lead,
        ], 200);
    }

    /**
     * Update a specific lead.
     */
    public function update(Request $request, $id)
    {
        $lead = Lead::findOrFail($id);
        $lead->update($request->all());

        return response()->json([
            'message' => 'Lead updated successfully',
            'lead' => $lead,
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
            'message' => 'Lead deleted successfully',
        ], 200);
    }
}