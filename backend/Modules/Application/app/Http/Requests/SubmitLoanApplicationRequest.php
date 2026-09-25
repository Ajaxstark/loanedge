<?php

namespace Modules\Application\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SubmitLoanApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'customer';
    }

    public function rules(): array
    {
        return [
            'declaration_accepted' => [
                'required',
                'accepted',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'declaration_accepted.required' =>
                'Please accept the declaration before submitting your application.',

            'declaration_accepted.accepted' =>
                'Please confirm that the information provided is accurate and complete.',
        ];
    }
}