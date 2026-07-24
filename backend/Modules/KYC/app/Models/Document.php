<?php

namespace Modules\KYC\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Modules\Lead\Models\Lead;

class Document extends Model
{
    use HasFactory;

    protected $table = 'kyc_documents';

    protected $fillable = [
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
}