<?php

namespace Modules\Application\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePersonalDetailsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'customer';
    }

    public function rules(): array
    {
        return [
            'full_name' => [
                'required',
                'string',
                'max:255',
            ],

            'phone' => [
                'required',
                'string',
                'regex:/^[6-9][0-9]{9}$/',
            ],

            'date_of_birth' => [
                'required',
                'date',
                'before_or_equal:' . now()->subYears(18)->toDateString(),
            ],

            'marital_status' => [
                'required',
                'in:single,married,divorced,widowed',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'full_name.required' =>
                'Please enter your full name.',

            'phone.required' =>
                'Please enter your mobile number.',

            'phone.regex' =>
                'Please enter a valid 10-digit Indian mobile number.',

            'date_of_birth.required' =>
                'Please enter your date of birth.',

            'date_of_birth.before_or_equal' =>
                'You must be at least 18 years old to apply for a loan.',

            'marital_status.required' =>
                'Please select your marital status.',

            'marital_status.in' =>
                'Please select a valid marital status.',
        ];
    }
}