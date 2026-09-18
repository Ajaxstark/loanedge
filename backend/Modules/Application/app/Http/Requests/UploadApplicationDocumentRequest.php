<?php

namespace Modules\Application\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadApplicationDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'customer';
    }

    public function rules(): array
    {
        return [
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
        ];
    }

    public function messages(): array
    {
        return [
            'document_type.required' =>
                'Please select a document type.',

            'document_type.in' =>
                'Please select a valid document type.',

            'file.required' =>
                'Please select a document to upload.',

            'file.mimes' =>
                'The document must be a PDF, JPG, JPEG or PNG file.',

            'file.max' =>
                'The document must not exceed 5 MB.',
        ];
    }
}