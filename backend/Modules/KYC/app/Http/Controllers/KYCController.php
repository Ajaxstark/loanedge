<?php

namespace Modules\KYC\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Modules\KYC\Models\Document;

class KYCController extends Controller
{
    // Ek lead ke saare documents dikhao
    public function index($leadId)
    {
        $documents = Document::where('lead_id', $leadId)->get();

        return response()->json([
            'success' => true,
            'data' => $documents
        ]);
    }

    // Naya document upload karo
    public function store(Request $request)
    {
        $validated = $request->validate([
            'lead_id' => 'required|exists:leads,id',
            'document_type' => 'required|in:aadhar,pan,salary_slip,bank_statement',
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        // File ko storage mein save karo
        $path = $request->file('file')->store('kyc_documents', 'public');

        $document = Document::create([
            'lead_id' => $validated['lead_id'],
            'document_type' => $validated['document_type'],
            'file_path' => $path,
            'status' => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Document uploaded successfully',
            'data' => $document
        ], 201);
    }

    // Document verify karo (approve/reject)
    public function updateStatus(Request $request, $id)
    {
        $document = Document::findOrFail($id);

        $validated = $request->validate([
            'status' => 'required|in:approved,rejected',
            'remarks' => 'nullable|string',
        ]);

        $document->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Document status updated',
            'data' => $document
        ]);
    }

    // Document delete karo
    public function destroy($id)
    {
        $document = Document::findOrFail($id);
        $document->delete();

        return response()->json([
            'success' => true,
            'message' => 'Document deleted successfully'
        ]);
    }
}