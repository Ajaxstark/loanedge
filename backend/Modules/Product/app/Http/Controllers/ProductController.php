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
            'data' => $products,
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
            'max_amount' => 'required|numeric|gte:min_amount',

            'min_tenure_months' => 'required|integer|min:1',
            'max_tenure_months' => 'required|integer|gte:min_tenure_months',

            'status' => 'sometimes|in:active,inactive',
        ]);

        $product = LoanProduct::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Loan product created successfully.',
            'data' => $product,
        ], 201);
    }

    // Ek single product dikhao
    public function show($id)
    {
        $product = LoanProduct::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $product,
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
            'status' => 'sometimes|in:active,inactive',
        ]);

        /*
         * PATCH request mein sirf ek side aa sakti hai,
         * isliye final values combine karke range validate karenge.
         */
        $minAmount = (float) ($validated['min_amount'] ?? $product->min_amount);
        $maxAmount = (float) ($validated['max_amount'] ?? $product->max_amount);

        if ($maxAmount < $minAmount) {
            return response()->json([
                'success' => false,
                'message' => 'Maximum amount must be greater than or equal to minimum amount.',
            ], 422);
        }

        $minTenure = (int) (
            $validated['min_tenure_months'] ??
            $product->min_tenure_months
        );

        $maxTenure = (int) (
            $validated['max_tenure_months'] ??
            $product->max_tenure_months
        );

        if ($maxTenure < $minTenure) {
            return response()->json([
                'success' => false,
                'message' => 'Maximum tenure must be greater than or equal to minimum tenure.',
            ], 422);
        }

        $product->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Loan product updated successfully.',
            'data' => $product,
        ]);
    }

    // Product delete karo
    public function destroy($id)
    {
        $product = LoanProduct::findOrFail($id);
        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Loan product deleted successfully.',
        ]);
    }
}