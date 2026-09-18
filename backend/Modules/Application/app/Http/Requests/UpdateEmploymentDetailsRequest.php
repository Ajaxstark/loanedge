<?php

namespace Modules\Application\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEmploymentDetailsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'customer';
    }

    public function rules(): array
    {
        return [
            'employment_type' => [
                'required',
                'in:salaried,self_employed',
            ],

            'employer_business_name' => [
                'required',
                'string',
                'max:255',
            ],

            'monthly_income' => [
                'required',
                'numeric',
                'min:1',
            ],

            'existing_emi' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'work_experience_months' => [
                'required',
                'integer',
                'min:0',
                'max:600',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'employment_type.required' =>
                'Please select your employment type.',

            'employment_type.in' =>
                'Please select a valid employment type.',

            'employer_business_name.required' =>
                'Please enter your employer or business name.',

            'monthly_income.required' =>
                'Please enter your monthly income.',

            'monthly_income.numeric' =>
                'Please enter a valid monthly income.',

            'monthly_income.min' =>
                'Monthly income must be greater than zero.',

            'existing_emi.numeric' =>
                'Please enter a valid existing EMI amount.',

            'existing_emi.min' =>
                'Existing EMI cannot be negative.',

            'work_experience_months.required' =>
                'Please enter your work or business experience.',

            'work_experience_months.integer' =>
                'Work experience must be entered in months.',

            'work_experience_months.max' =>
                'Please enter a valid work experience.',
        ];
    }
}