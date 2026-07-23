<?php

namespace Modules\Product\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Modules\Product\Models\LoanProduct;

class ProductController extends Controller
{
    // Saare loan products list karo
    public function index()
    {
        $products = LoanProduct::latest()->get();

        return response()->json([
            'success' => true,
            'data' => $products
        ]);
    }

    // Naya loan product create karo
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'loan_type' => 'required|in:personal,business,gold,vehicle',
            'interest_rate' => 'required|numeric|min:0|max:999.99',
            'min_amount' => 'required|numeric|min:0',
            'max_amount' => 'required|numeric|min:0',
            'min_tenure_months' => 'required|integer|min:1',
            'max_tenure_months' => 'required|integer|min:1',
            'status' => 'in:active,inactive',
        ]);

        $product = LoanProduct::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Loan product created successfully',
            'data' => $product
        ], 201);
    }

    // Ek single product dikhao
    public function show($id)
    {
        $product = LoanProduct::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $product
        ]);
    }

    // Product update karo
    public function update(Request $request, $id)
    {
        $product = LoanProduct::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'loan_type' => 'sometimes|required|in:personal,business,gold,vehicle',
            'interest_rate' => 'sometimes|required|numeric|min:0|max:999.99',
            'min_amount' => 'sometimes|required|numeric|min:0',
            'max_amount' => 'sometimes|required|numeric|min:0',
            'min_tenure_months' => 'sometimes|required|integer|min:1',
            'max_tenure_months' => 'sometimes|required|integer|min:1',
            'status' => 'in:active,inactive',
        ]);

        $product->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Loan product updated successfully',
            'data' => $product
        ]);
    }

    // Product delete karo
    public function destroy($id)
    {
        $product = LoanProduct::findOrFail($id);
        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Loan product deleted successfully'
        ]);
    }
}