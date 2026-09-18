<?php

namespace Modules\Application\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAddressDetailsRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if ($this->pan_number) {
            $this->merge([
                'pan_number' => strtoupper(trim($this->pan_number)),
            ]);
        }

        if ($this->pincode) {
            $this->merge([
                'pincode' => trim($this->pincode),
            ]);
        }
    }

    public function authorize(): bool
    {
        return $this->user()?->role === 'customer';
    }

    public function rules(): array
    {
        return [
            'pan_number' => [
                'required',
                'string',
                'regex:/^[A-Z]{5}[0-9]{4}[A-Z]$/',
            ],

            'address_line' => [
                'required',
                'string',
                'max:500',
            ],

            'city' => [
                'required',
                'string',
                'max:100',
            ],

            'state' => [
                'required',
                'string',
                'max:100',
            ],

            'pincode' => [
                'required',
                'regex:/^[1-9][0-9]{5}$/',
            ],

            'residence_type' => [
                'required',
                'in:owned,rented,family,company_provided,other',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'pan_number.required' =>
                'Please enter your PAN number.',

            'pan_number.regex' =>
                'Please enter a valid PAN number.',

            'address_line.required' =>
                'Please enter your current residential address.',

            'city.required' =>
                'Please enter your city.',

            'state.required' =>
                'Please select or enter your state.',

            'pincode.required' =>
                'Please enter your PIN code.',

            'pincode.regex' =>
                'Please enter a valid 6-digit Indian PIN code.',

            'residence_type.required' =>
                'Please select your residence type.',

            'residence_type.in' =>
                'Please select a valid residence type.',
        ];
    }
}