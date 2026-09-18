<?php

namespace Modules\KYC\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Modules\KYC\Models\Document;

class KYCController extends Controller
{
    /**
     * Staff KYC workspace:
     * sabhi uploaded documents.
     */
    public function indexAll()
    {
        $documents = Document::with('lead')
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $documents,
        ]);
    }

    /**
     * Specific lead ke KYC documents.
     */
    public function index($leadId)
    {
        $documents = Document::with('lead')
            ->where('lead_id', $leadId)
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $documents,
        ]);
    }

    /**
     * Lead ke against document upload.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'lead_id' => [
                'required',
                'exists:leads,id',
            ],

            'document_type' => [
                'required',
                'in:aadhar,pan,salary_slip,bank_statement',
            ],

            'file' => [
                'required',
                'file',
                'mimes:pdf,jpg,jpeg,png',
                'max:5120',
            ],
        ]);

        $path = $request
            ->file('file')
            ->store('kyc_documents', 'public');

        $document = Document::create([
            'lead_id' => $validated['lead_id'],
            'document_type' => $validated['document_type'],
            'file_path' => $path,
            'status' => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Document uploaded successfully.',
            'data' => $document->load('lead'),
        ], 201);
    }

    /**
     * Staff document verification.
     */
    public function updateStatus(Request $request, $id)
    {
        $document = Document::findOrFail($id);

        $validated = $request->validate([
            'status' => [
                'required',
                'in:approved,rejected',
            ],

            'remarks' => [
                'nullable',
                'string',
                'max:1000',
            ],
        ]);

        if (
            $validated['status'] === 'rejected' &&
            blank($validated['remarks'] ?? null)
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Please provide a reason for rejecting this document.',
            ], 422);
        }

        $document->update([
            'status' => $validated['status'],
            'remarks' => $validated['status'] === 'rejected'
                ? $validated['remarks']
                : null,
        ]);

        return response()->json([
            'success' => true,
            'message' => $validated['status'] === 'approved'
                ? 'Document approved successfully.'
                : 'Document rejected successfully.',
            'data' => $document->fresh()->load('lead'),
        ]);
    }

    /**
     * Document record + stored file delete.
     */
    public function destroy($id)
    {
        $document = Document::findOrFail($id);

        if (
            $document->file_path &&
            Storage::disk('public')->exists($document->file_path)
        ) {
            Storage::disk('public')->delete($document->file_path);
        }

        $document->delete();

        return response()->json([
            'success' => true,
            'message' => 'Document deleted successfully.',
        ]);
    }
}