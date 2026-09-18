<?php

namespace Modules\Application\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLoanDetailsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'customer';
    }

    public function rules(): array
    {
        return [
            'product_id' => [
                'required',
                'integer',
                'exists:loan_products,id',
            ],

            'requested_amount' => [
                'required',
                'numeric',
                'min:1',
            ],

            'requested_tenure_months' => [
                'required',
                'integer',
                'min:1',
            ],

            'loan_purpose' => [
                'required',
                'string',
                'max:255',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'product_id.required' =>
                'Please select a loan product.',

            'product_id.exists' =>
                'The selected loan product is not available.',

            'requested_amount.required' =>
                'Please enter the requested loan amount.',

            'requested_amount.numeric' =>
                'Please enter a valid loan amount.',

            'requested_amount.min' =>
                'The requested loan amount must be greater than zero.',

            'requested_tenure_months.required' =>
                'Please select the requested loan tenure.',

            'requested_tenure_months.integer' =>
                'Please enter a valid loan tenure.',

            'requested_tenure_months.min' =>
                'The requested loan tenure must be greater than zero.',

            'loan_purpose.required' =>
                'Please enter the purpose of the loan.',

            'loan_purpose.max' =>
                'The loan purpose may not exceed 255 characters.',
        ];
    }
}