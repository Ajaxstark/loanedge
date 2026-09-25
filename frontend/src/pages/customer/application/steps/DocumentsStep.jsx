import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';

const API_BASE =
  'http://localhost:8000/api/v1/customer';

const STORAGE_BASE =
  'http://localhost:8000/storage/';

const documentRequirements = [
  {
    type: 'aadhar',
    label: 'Aadhaar Card',
    description:
      'Upload a clear copy of your Aadhaar card.',
  },
  {
    type: 'pan',
    label: 'PAN Card',
    description:
      'Upload a clear copy of your PAN card.',
  },
  {
    type: 'salary_slip',
    label: 'Salary Slip',
    description:
      'Upload your latest salary slip or available income proof.',
  },
  {
    type: 'bank_statement',
    label: 'Bank Statement',
    description:
      'Upload a recent bank statement showing your financial activity.',
  },
];

const statusConfig = {
  pending: {
    label: 'Pending verification',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    background: 'bg-amber-50',
    border: 'border-amber-200',
  },

  approved: {
    label: 'Verified',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    background: 'bg-emerald-50',
    border: 'border-emerald-200',
  },

  rejected: {
    label: 'Action required',
    text: 'text-red-700',
    dot: 'bg-red-500',
    background: 'bg-red-50',
    border: 'border-red-200',
  },
};

function DocumentsStep({
  application,
  onApplicationUpdate,
  onPrevious,
}) {
  const [documents, setDocuments] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [uploadingType, setUploadingType] =
    useState('');

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  const fileInputs = useRef({});

  const token =
    localStorage.getItem('customer_token');

  /*
   * Existing customer documents load karo.
   */
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!token) {
        setLoading(false);

        setError(
          'Your session is unavailable. Please sign in again.'
        );

        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await axios.get(
          `${API_BASE}/application/documents`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
          }
        );

        setDocuments(
          response.data.data || []
        );
      } catch (err) {
        console.error(
          'Customer document fetch error:',
          err
        );

        setError(
          err.response?.data?.message ||
            'We could not load your documents. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [token]);

  /*
   * document_type ke against quick lookup.
   *
   * Example:
   *
   * documentMap.pan
   * documentMap.aadhar
   */
  const documentMap = useMemo(() => {
    return documents.reduce(
      (result, document) => {
        result[document.document_type] =
          document;

        return result;
      },
      {}
    );
  }, [documents]);

  const uploadedCount =
    documentRequirements.filter(
      (requirement) =>
        Boolean(
          documentMap[requirement.type]
        )
    ).length;

  const allDocumentsUploaded =
    uploadedCount ===
    documentRequirements.length;

  /*
   * Hidden file input open.
   */
  const chooseFile = (type) => {
    fileInputs.current[type]?.click();
  };

  /*
   * Actual multipart document upload.
   */
  const handleFileChange = async (
    documentType,
    event
  ) => {
    const file =
      event.target.files?.[0];

    /*
     * Same file ko baad mein dobara select
     * karne ke liye input reset.
     */
    event.target.value = '';

    if (!file) return;

    setError('');
    setSuccess('');

    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
    ];

    if (
      !allowedMimeTypes.includes(file.type)
    ) {
      setError(
        'Please upload a PDF, JPG, JPEG or PNG document.'
      );

      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setError(
        'The selected document must not exceed 5 MB.'
      );

      return;
    }

    const existingDocument =
      documentMap[documentType];

    /*
     * Backend bhi approved document replacement
     * block karta hai.
     *
     * Frontend sirf better UX ke liye pehle hi
     * block kar raha hai.
     */
    if (
      existingDocument?.status ===
      'approved'
    ) {
      setError(
        'This document has already been verified and cannot be replaced.'
      );

      return;
    }

    const formData =
      new FormData();

    formData.append(
      'document_type',
      documentType
    );

    formData.append(
      'file',
      file
    );

    setUploadingType(documentType);

    try {
      const response =
        await axios.post(
          `${API_BASE}/application/documents`,
          formData,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,

              Accept:
                'application/json',

              /*
               * Content-Type intentionally manually
               * set nahi kar rahe.
               *
               * Browser multipart boundary khud
               * generate karega.
               */
            },
          }
        );

      const uploadedDocument =
        response.data.data;

      /*
       * New upload:
       * list mein add.
       *
       * Replacement:
       * existing document replace.
       */
      setDocuments((current) => {
        const exists =
          current.some(
            (document) =>
              document.document_type ===
              documentType
          );

        if (!exists) {
          return [
            uploadedDocument,
            ...current,
          ];
        }

        return current.map(
          (document) =>
            document.document_type ===
            documentType
              ? uploadedDocument
              : document
        );
      });

      setSuccess(
        response.data.message ||
          'Document uploaded successfully.'
      );

      /*
       * Backend first document upload par
       * current_step = max(current_step, 6)
       * karta hai.
       *
       * Parent application state ko bhi update
       * kar dete hain without changing active UI
       * step immediately.
       */
      if (
        application &&
        Number(application.current_step) < 6
      ) {
        onApplicationUpdate?.(
          {
            ...application,
            current_step: 6,
          },
          5
        );
      }
    } catch (err) {
      console.error(
        'Customer document upload error:',
        err
      );

      const backendErrors =
        err.response?.data?.errors;

      const firstValidationError =
        backendErrors
          ? Object.values(
              backendErrors
            )?.[0]?.[0]
          : null;

      setError(
        firstValidationError ||
          err.response?.data?.message ||
          'We could not upload the document. Please try again.'
      );
    } finally {
      setUploadingType('');
    }
  };

  /*
   * Review Step par tabhi jana hai jab
   * required documents uploaded hon.
   *
   * Approved hona necessary nahi:
   * verification staff baad mein karega.
   */
  const handleContinue = () => {
    setError('');
    setSuccess('');

    if (!allDocumentsUploaded) {
      setError(
        'Please upload all required documents before continuing.'
      );

      return;
    }

    /*
     * Parent convention:
     *
     * Second argument = UI ka next active step.
     *
     * Application data unchanged hai because
     * documents separate table mein stored hain.
     */
    onApplicationUpdate?.(
      application,
      6
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-7 w-7 animate-spin rounded-full border-[3px] border-blue-100 border-t-blue-600" />

          <p className="mt-3 text-[11px] font-medium text-slate-500">
            Loading your documents...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Introduction */}
      <div className="mb-6 border-b border-slate-100 pb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Upload supporting documents
            </h3>

            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
              Provide clear and readable copies of
              the documents required to verify your
              identity and financial information.
            </p>
          </div>

          <div className="shrink-0 sm:text-right">
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-slate-400">
              Uploaded
            </p>

            <p className="mt-1 text-sm font-bold text-[#0f2d52]">
              {uploadedCount} /{' '}
              {documentRequirements.length}
            </p>
          </div>
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-300"
            style={{
              width: `${
                (uploadedCount /
                  documentRequirements.length) *
                100
              }%`,
            }}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3"
        >
          <svg
            className="mt-0.5 h-4 w-4 shrink-0 text-red-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
            />
            <path d="M12 8v5" />
            <path d="M12 17h.01" />
          </svg>

          <p className="text-xs leading-5 text-red-700">
            {error}
          </p>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
          <svg
            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="m5 12 4 4L19 6" />
          </svg>

          <p className="text-xs leading-5 text-emerald-700">
            {success}
          </p>
        </div>
      )}

      {/* Document cards */}
      <div className="space-y-3">
        {documentRequirements.map(
          (requirement) => {
            const document =
              documentMap[requirement.type];

            const status =
              document?.status;

            const config =
              statusConfig[status];

            const uploading =
              uploadingType ===
              requirement.type;

            const approved =
              status === 'approved';

            return (
              <article
                key={requirement.type}
                className={`overflow-hidden rounded-xl border bg-white transition ${
                  status === 'rejected'
                    ? 'border-red-200'
                    : approved
                      ? 'border-emerald-200'
                      : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                  {/* Document icon */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#eef4ff] text-blue-700">
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <path d="M14 2v6h6" />
                      <path d="M8 14h8M8 18h5" />
                    </svg>
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[13px] font-semibold text-slate-900">
                        {requirement.label}
                      </p>

                      <span className="text-[9.5px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                        Required
                      </span>
                    </div>

                    <p className="mt-1 text-[11px] leading-4 text-slate-500">
                      {requirement.description}
                    </p>

                    {document && config && (
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[10.5px] font-semibold ${config.text}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${config.dot}`}
                          />

                          {config.label}
                        </span>

                        {document.file_path && (
                          <a
                            href={`${STORAGE_BASE}${document.file_path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10.5px] font-semibold text-blue-700 hover:underline"
                          >
                            View document
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Upload input */}
                  <input
                    ref={(element) => {
                      fileInputs.current[
                        requirement.type
                      ] = element;
                    }}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    disabled={
                      uploading || approved
                    }
                    onChange={(event) =>
                      handleFileChange(
                        requirement.type,
                        event
                      )
                    }
                  />

                  {/* Action */}
                  <button
                    type="button"
                    disabled={
                      uploading || approved
                    }
                    onClick={() =>
                      chooseFile(
                        requirement.type
                      )
                    }
                    className={`inline-flex h-9 min-w-[110px] shrink-0 items-center justify-center gap-2 rounded-lg px-3 text-[11px] font-semibold transition disabled:cursor-not-allowed ${
                      approved
                        ? 'border border-slate-200 bg-slate-50 text-slate-400'
                        : document
                          ? 'border border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-700'
                          : 'bg-[#0f2d52] text-white hover:bg-[#153d6e]'
                    }`}
                  >
                    {uploading ? (
                      <>
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current" />
                        Uploading
                      </>
                    ) : approved ? (
                      <>
                        <svg
                          className="h-3.5 w-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <path d="m5 12 4 4L19 6" />
                        </svg>
                        Verified
                      </>
                    ) : document ? (
                      'Replace'
                    ) : (
                      <>
                        <svg
                          className="h-3.5 w-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M12 16V4" />
                          <path d="m7 9 5-5 5 5" />
                          <path d="M5 20h14" />
                        </svg>

                        Upload
                      </>
                    )}
                  </button>
                </div>

                {/* Rejected feedback */}
                {status === 'rejected' && (
                  <div className="border-t border-red-100 bg-red-50/60 px-5 py-3">
                    <p className="text-[9.5px] font-bold uppercase tracking-[0.08em] text-red-600">
                      Verification feedback
                    </p>

                    <p className="mt-1 text-[11px] leading-5 text-red-700">
                      {document.remarks ||
                        'This document could not be verified. Please upload a clear replacement.'}
                    </p>
                  </div>
                )}
              </article>
            );
          }
        )}
      </div>

      {/* File rules */}
      <div className="mt-5 flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50/50 px-4 py-3">
        <svg
          className="mt-0.5 h-4 w-4 shrink-0 text-blue-700"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M12 3 5 6v5c0 4.5 2.8 8.5 7 10 4.2-1.5 7-5.5 7-10V6l-7-3Z" />
          <path d="m9.5 12 1.7 1.7 3.5-3.7" />
        </svg>

        <div>
          <p className="text-[11px] font-semibold text-slate-700">
            Document requirements
          </p>

          <p className="mt-0.5 text-[10.5px] leading-4 text-slate-500">
            PDF, JPG, JPEG and PNG files are accepted.
            Each file must not exceed 5 MB. Documents
            already verified by LoanEdge cannot be
            replaced.
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-7 flex items-center justify-between border-t border-slate-100 pt-5">
        <button
          type="button"
          disabled={Boolean(uploadingType)}
          onClick={onPrevious}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>

          Previous
        </button>

        <button
          type="button"
          disabled={
            Boolean(uploadingType) ||
            !allDocumentsUploaded
          }
          onClick={handleContinue}
          className="inline-flex h-10 min-w-[155px] items-center justify-center gap-2 rounded-lg bg-[#0f2d52] px-5 text-xs font-semibold text-white transition hover:bg-[#153d6e] focus:outline-none focus:ring-4 focus:ring-[#0f2d52]/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Review application

          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default DocumentsStep;