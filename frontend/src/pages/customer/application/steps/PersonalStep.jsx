import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL =
  'http://localhost:8000/api/v1/customer/application/personal';

function FieldError({ message }) {
  if (!message) return null;

  return (
    <p className="mt-1.5 text-[11px] font-medium text-red-600">
      {message}
    </p>
  );
}

function PersonalStep({
  application,
  onApplicationUpdate,
}) {
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    date_of_birth: '',
    marital_status: '',
  });

  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem('customer_token');

  /*
   * Backend se existing draft aaye toh fields prefill.
   *
   * DOB Laravel date cast ki wajah se kabhi full ISO datetime
   * format mein aa sakti hai. HTML date input ko YYYY-MM-DD chahiye.
   */
  useEffect(() => {
    setForm({
      full_name: application?.full_name || '',
      phone: application?.phone || '',
      date_of_birth:
        application?.date_of_birth?.slice(0, 10) || '',
      marital_status:
        application?.marital_status || '',
    });
  }, [application]);

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    /*
     * Customer field correct karna start kare toh
     * purana validation error hata do.
     */
    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));

    setGeneralError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setErrors({});
    setGeneralError('');
    setSaving(true);

    try {
      const response = await axios.patch(
        API_URL,
        {
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          date_of_birth: form.date_of_birth,
          marital_status: form.marital_status,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      /*
       * Backend updated application return karta hai.
       *
       * Parent ko updated data + next step bata dete hain.
       */
      onApplicationUpdate(
        response.data.data,
        2
      );
    } catch (err) {
      console.error(
        'Personal details save error:',
        err
      );

      if (err.response?.status === 422) {
        setErrors(err.response?.data?.errors || {});

        if (!err.response?.data?.errors) {
          setGeneralError(
            err.response?.data?.message ||
              'Please review the information entered below.'
          );
        }

        return;
      }

      setGeneralError(
        err.response?.data?.message ||
          'We could not save your personal details. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Introduction */}
      <div className="mb-6 border-b border-slate-100 pb-5">
        <h3 className="text-sm font-semibold text-slate-900">
          Tell us about yourself
        </h3>

        <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
          Enter your personal information exactly as it
          appears on your official documents.
        </p>
      </div>

      {generalError && (
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
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5" />
            <path d="M12 17h.01" />
          </svg>

          <p className="text-xs leading-5 text-red-700">
            {generalError}
          </p>
        </div>
      )}

      {/* Form fields */}
      <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
        {/* Full name */}
        <div>
          <label
            htmlFor="application-full-name"
            className="mb-1.5 block text-xs font-semibold text-slate-700"
          >
            Full legal name
            <span className="ml-1 text-red-500">
              *
            </span>
          </label>

          <input
            id="application-full-name"
            type="text"
            required
            autoComplete="name"
            value={form.full_name}
            onChange={(event) =>
              updateField(
                'full_name',
                event.target.value
              )
            }
            placeholder="Enter your full legal name"
            className={`h-11 w-full rounded-lg border bg-white px-3.5 text-[13px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-3 ${
              errors.full_name
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
            }`}
          />

          <FieldError
            message={errors.full_name?.[0]}
          />
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="application-email"
            className="mb-1.5 block text-xs font-semibold text-slate-700"
          >
            Registered email
          </label>

          <div className="relative">
            <input
              id="application-email"
              type="email"
              value={application?.email || ''}
              readOnly
              className="h-11 w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3.5 pr-10 text-[13px] text-slate-500 outline-none"
            />

            <div
              className="absolute right-3 top-1/2 -translate-y-1/2"
              title="Verified account email"
            >
              <svg
                className="h-4 w-4 text-emerald-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 3 5 6v5c0 4.5 2.8 8.5 7 10 4.2-1.5 7-5.5 7-10V6l-7-3Z" />
                <path d="m9.5 12 1.7 1.7 3.5-3.7" />
              </svg>
            </div>
          </div>

          <p className="mt-1.5 text-[10.5px] text-slate-400">
            This is your verified LoanEdge account email.
          </p>
        </div>

        {/* Mobile */}
        <div>
          <label
            htmlFor="application-phone"
            className="mb-1.5 block text-xs font-semibold text-slate-700"
          >
            Mobile number
            <span className="ml-1 text-red-500">
              *
            </span>
          </label>

          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 border-r border-slate-200 pr-2.5 text-xs font-medium text-slate-500">
              +91
            </span>

            <input
              id="application-phone"
              type="tel"
              required
              inputMode="numeric"
              autoComplete="tel"
              maxLength={10}
              value={form.phone}
              onChange={(event) =>
                updateField(
                  'phone',
                  event.target.value.replace(
                    /\D/g,
                    ''
                  )
                )
              }
              placeholder="9876543210"
              className={`h-11 w-full rounded-lg border bg-white pl-[58px] pr-3.5 text-[13px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-3 ${
                errors.phone
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                  : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
              }`}
            />
          </div>

          <FieldError
            message={errors.phone?.[0]}
          />
        </div>

        {/* DOB */}
        <div>
          <label
            htmlFor="application-dob"
            className="mb-1.5 block text-xs font-semibold text-slate-700"
          >
            Date of birth
            <span className="ml-1 text-red-500">
              *
            </span>
          </label>

          <input
            id="application-dob"
            type="date"
            required
            value={form.date_of_birth}
            onChange={(event) =>
              updateField(
                'date_of_birth',
                event.target.value
              )
            }
            className={`h-11 w-full rounded-lg border bg-white px-3.5 text-[13px] text-slate-700 outline-none transition focus:ring-3 ${
              errors.date_of_birth
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
            }`}
          />

          <FieldError
            message={errors.date_of_birth?.[0]}
          />

          {!errors.date_of_birth && (
            <p className="mt-1.5 text-[10.5px] text-slate-400">
              Applicants must be at least 18 years old.
            </p>
          )}
        </div>

        {/* Marital status */}
        <div>
          <label
            htmlFor="application-marital-status"
            className="mb-1.5 block text-xs font-semibold text-slate-700"
          >
            Marital status
            <span className="ml-1 text-red-500">
              *
            </span>
          </label>

          <select
            id="application-marital-status"
            required
            value={form.marital_status}
            onChange={(event) =>
              updateField(
                'marital_status',
                event.target.value
              )
            }
            className={`h-11 w-full rounded-lg border bg-white px-3.5 text-[13px] outline-none transition focus:ring-3 ${
              form.marital_status
                ? 'text-slate-800'
                : 'text-slate-400'
            } ${
              errors.marital_status
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
            }`}
          >
            <option value="">
              Select marital status
            </option>
            <option value="single">
              Single
            </option>
            <option value="married">
              Married
            </option>
            <option value="divorced">
              Divorced
            </option>
            <option value="widowed">
              Widowed
            </option>
          </select>

          <FieldError
            message={errors.marital_status?.[0]}
          />
        </div>
      </div>

      {/* Information notice */}
      <div className="mt-6 flex items-start gap-2.5 rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3">
        <svg
          className="mt-0.5 h-4 w-4 shrink-0 text-blue-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5" />
          <path d="M12 8h.01" />
        </svg>

        <p className="text-[11px] leading-5 text-slate-600">
          Please ensure your legal name and date of birth
          match the identity documents you will provide
          later in this application.
        </p>
      </div>

      {/* Footer actions */}
      <div className="mt-7 flex items-center justify-between border-t border-slate-100 pt-5">
        <p className="hidden text-[10.5px] text-slate-400 sm:block">
          <span className="text-red-500">*</span>{' '}
          Required information
        </p>

        <button
          type="submit"
          disabled={saving}
          className="ml-auto inline-flex h-10 min-w-[155px] items-center justify-center gap-2 rounded-lg bg-[#0f2d52] px-5 text-xs font-semibold text-white transition hover:bg-[#153d6e] focus:outline-none focus:ring-4 focus:ring-[#0f2d52]/15 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Saving...
            </>
          ) : (
            <>
              Save & Continue

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
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default PersonalStep;