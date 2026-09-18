<?php

namespace Modules\KYC\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Modules\Application\Models\LoanApplication;
use Modules\Lead\Models\Lead;

class Document extends Model
{
    use HasFactory;

    protected $table = 'kyc_documents';

    protected $fillable = [
        'application_id',
        'lead_id',
        'document_type',
        'file_path',
        'status',
        'remarks',
    ];

    public function lead()
    {
        return $this->belongsTo(Lead::class);
    }

    public function application()
    {
        return $this->belongsTo(
            LoanApplication::class,
            'application_id'
        );
    }
}