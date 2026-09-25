import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL =
  'http://localhost:8000/api/v1/customer/application/employment';

function FieldError({ message }) {
  if (!message) return null;

  return (
    <p className="mt-1.5 text-[11px] font-medium text-red-600">
      {message}
    </p>
  );
}

function EmploymentStep({
  application,
  onApplicationUpdate,
  onPrevious,
}) {
  const [form, setForm] = useState({
    employment_type: '',
    employer_business_name: '',
    monthly_income: '',
    existing_emi: '',
    experience_years: '',
    experience_months: '',
  });

  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem('customer_token');

  /*
   * Existing application ko form mein restore karo.
   *
   * Backend experience total months mein store karta hai.
   * UI mein usse years + months mein convert karenge.
   */
  useEffect(() => {
    const totalExperience = Number(
      application?.work_experience_months || 0
    );

    setForm({
      employment_type:
        application?.employment_type || '',

      employer_business_name:
        application?.employer_business_name || '',

      monthly_income:
        application?.monthly_income ?? '',

      existing_emi:
        application?.existing_emi ?? '',

      experience_years:
        totalExperience > 0
          ? String(Math.floor(totalExperience / 12))
          : '',

      experience_months:
        totalExperience > 0
          ? String(totalExperience % 12)
          : '',
    });
  }, [application]);

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));

    /*
     * Backend validation work_experience_months naam se
     * error bhejegi. Years/months field edit hote hi
     * wo error bhi clear karo.
     */
    if (
      field === 'experience_years' ||
      field === 'experience_months'
    ) {
      setErrors((current) => ({
        ...current,
        work_experience_months: undefined,
      }));
    }

    setGeneralError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setErrors({});
    setGeneralError('');

    const years = Number(
      form.experience_years || 0
    );

    const months = Number(
      form.experience_months || 0
    );

    if (months < 0 || months > 11) {
      setErrors({
        work_experience_months: [
          'Additional experience months must be between 0 and 11.',
        ],
      });

      return;
    }

    const totalExperienceMonths =
      years * 12 + months;

    setSaving(true);

    try {
      const response = await axios.patch(
        API_URL,
        {
          employment_type:
            form.employment_type,

          employer_business_name:
            form.employer_business_name.trim(),

          monthly_income:
            Number(form.monthly_income),

          existing_emi:
            form.existing_emi === ''
              ? 0
              : Number(form.existing_emi),

          work_experience_months:
            totalExperienceMonths,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      onApplicationUpdate(
        response.data.data,
        4
      );
    } catch (err) {
      console.error(
        'Employment details save error:',
        err
      );

      if (err.response?.status === 422) {
        setErrors(
          err.response?.data?.errors || {}
        );

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
          'We could not save your employment and financial details. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const isSalaried =
    form.employment_type === 'salaried';

  const isSelfEmployed =
    form.employment_type === 'self_employed';

  const organisationLabel = isSelfEmployed
    ? 'Business name'
    : 'Employer name';

  const organisationPlaceholder = isSelfEmployed
    ? 'Enter your registered or trading business name'
    : 'Enter your employer or organisation name';

  const experienceLabel = isSelfEmployed
    ? 'Business experience'
    : 'Work experience';

  return (
    <form onSubmit={handleSubmit}>
      {/* Introduction */}
      <div className="mb-6 border-b border-slate-100 pb-5">
        <h3 className="text-sm font-semibold text-slate-900">
          Employment and financial information
        </h3>

        <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
          Tell us about your employment and current monthly
          financial commitments. This information helps us
          assess your loan application.
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

      {/* Employment type */}
      <div>
        <label className="mb-2 block text-xs font-semibold text-slate-700">
          Employment type
          <span className="ml-1 text-red-500">
            *
          </span>
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() =>
              updateField(
                'employment_type',
                'salaried'
              )
            }
            className={`rounded-xl border p-4 text-left transition ${
              isSalaried
                ? 'border-blue-500 bg-blue-50/70 ring-3 ring-blue-600/10'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  isSalaried
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                <svg
                  className="h-[18px] w-[18px]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <rect
                    x="4"
                    y="7"
                    width="16"
                    height="13"
                    rx="2"
                  />
                  <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                  <path d="M4 12h16" />
                </svg>
              </div>

              <div>
                <p className="text-[13px] font-semibold text-slate-900">
                  Salaried
                </p>

                <p className="mt-1 text-[10.5px] leading-4 text-slate-500">
                  Employed by a company, organisation
                  or institution.
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              updateField(
                'employment_type',
                'self_employed'
              )
            }
            className={`rounded-xl border p-4 text-left transition ${
              isSelfEmployed
                ? 'border-blue-500 bg-blue-50/70 ring-3 ring-blue-600/10'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  isSelfEmployed
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                <svg
                  className="h-[18px] w-[18px]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M3 21h18" />
                  <path d="M5 21V9h14v12" />
                  <path d="M8 9V5h8v4" />
                  <path d="M9 14h6" />
                </svg>
              </div>

              <div>
                <p className="text-[13px] font-semibold text-slate-900">
                  Self-employed
                </p>

                <p className="mt-1 text-[10.5px] leading-4 text-slate-500">
                  Business owner, professional or
                  independent worker.
                </p>
              </div>
            </div>
          </button>
        </div>

        <FieldError
          message={errors.employment_type?.[0]}
        />
      </div>

      {/* Main fields */}
      <div className="mt-6 grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
        {/* Employer / Business */}
        <div className="sm:col-span-2">
          <label
            htmlFor="application-organisation"
            className="mb-1.5 block text-xs font-semibold text-slate-700"
          >
            {organisationLabel}
            <span className="ml-1 text-red-500">
              *
            </span>
          </label>

          <input
            id="application-organisation"
            type="text"
            required
            maxLength={255}
            disabled={!form.employment_type}
            value={form.employer_business_name}
            onChange={(event) =>
              updateField(
                'employer_business_name',
                event.target.value
              )
            }
            placeholder={
              form.employment_type
                ? organisationPlaceholder
                : 'Select employment type first'
            }
            className={`h-11 w-full rounded-lg border px-3.5 text-[13px] outline-none transition placeholder:text-slate-400 focus:ring-3 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 ${
              errors.employer_business_name
                ? 'border-red-300 bg-white focus:border-red-500 focus:ring-red-500/10'
                : 'border-slate-300 bg-white focus:border-blue-600 focus:ring-blue-600/10'
            }`}
          />

          <FieldError
            message={
              errors.employer_business_name?.[0]
            }
          />
        </div>

        {/* Monthly Income */}
        <div>
          <label
            htmlFor="application-income"
            className="mb-1.5 block text-xs font-semibold text-slate-700"
          >
            Monthly income
            <span className="ml-1 text-red-500">
              *
            </span>
          </label>

          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] font-medium text-slate-400">
              ₹
            </span>

            <input
              id="application-income"
              type="number"
              required
              min="1"
              step="1"
              inputMode="decimal"
              value={form.monthly_income}
              onChange={(event) =>
                updateField(
                  'monthly_income',
                  event.target.value
                )
              }
              placeholder="85000"
              className={`h-11 w-full rounded-lg border bg-white pl-8 pr-3.5 text-[13px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-3 ${
                errors.monthly_income
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                  : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
              }`}
            />
          </div>

          <FieldError
            message={
              errors.monthly_income?.[0]
            }
          />

          {!errors.monthly_income && (
            <p className="mt-1.5 text-[10.5px] leading-4 text-slate-400">
              Enter your average monthly income before
              existing EMI obligations.
            </p>
          )}
        </div>

        {/* Existing EMI */}
        <div>
          <label
            htmlFor="application-existing-emi"
            className="mb-1.5 block text-xs font-semibold text-slate-700"
          >
            Existing monthly EMI
            <span className="ml-1 text-[10px] font-normal text-slate-400">
              Optional
            </span>
          </label>

          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] font-medium text-slate-400">
              ₹
            </span>

            <input
              id="application-existing-emi"
              type="number"
              min="0"
              step="1"
              inputMode="decimal"
              value={form.existing_emi}
              onChange={(event) =>
                updateField(
                  'existing_emi',
                  event.target.value
                )
              }
              placeholder="0"
              className={`h-11 w-full rounded-lg border bg-white pl-8 pr-3.5 text-[13px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-3 ${
                errors.existing_emi
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                  : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
              }`}
            />
          </div>

          <FieldError
            message={errors.existing_emi?.[0]}
          />

          {!errors.existing_emi && (
            <p className="mt-1.5 text-[10.5px] leading-4 text-slate-400">
              Total monthly EMI currently payable on
              existing loans.
            </p>
          )}
        </div>

        {/* Experience */}
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-semibold text-slate-700">
            {experienceLabel}
            <span className="ml-1 text-red-500">
              *
            </span>
          </label>

          <div className="grid grid-cols-2 gap-3 sm:max-w-md">
            <div className="relative">
              <input
                type="number"
                required
                min="0"
                max="50"
                value={form.experience_years}
                onChange={(event) =>
                  updateField(
                    'experience_years',
                    event.target.value
                  )
                }
                placeholder="4"
                className={`h-11 w-full rounded-lg border bg-white px-3.5 pr-14 text-[13px] outline-none transition focus:ring-3 ${
                  errors.work_experience_months
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                    : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
                }`}
              />

              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10.5px] text-slate-400">
                years
              </span>
            </div>

            <div className="relative">
              <input
                type="number"
                min="0"
                max="11"
                value={form.experience_months}
                onChange={(event) =>
                  updateField(
                    'experience_months',
                    event.target.value
                  )
                }
                placeholder="0"
                className={`h-11 w-full rounded-lg border bg-white px-3.5 pr-16 text-[13px] outline-none transition focus:ring-3 ${
                  errors.work_experience_months
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                    : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
                }`}
              />

              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10.5px] text-slate-400">
                months
              </span>
            </div>
          </div>

          <FieldError
            message={
              errors.work_experience_months?.[0]
            }
          />
        </div>
      </div>

      {/* Information */}
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
          Enter factual financial information only.
          Loan eligibility, risk assessment and approval
          decisions are determined separately during
          application processing.
        </p>
      </div>

      {/* Actions */}
      <div className="mt-7 flex items-center justify-between border-t border-slate-100 pt-5">
        <button
          type="button"
          disabled={saving}
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
          type="submit"
          disabled={saving}
          className="inline-flex h-10 min-w-[155px] items-center justify-center gap-2 rounded-lg bg-[#0f2d52] px-5 text-xs font-semibold text-white transition hover:bg-[#153d6e] focus:outline-none focus:ring-4 focus:ring-[#0f2d52]/15 disabled:cursor-not-allowed disabled:opacity-60"
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

export default EmploymentStep;