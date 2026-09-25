import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL =
  'http://localhost:8000/api/v1/customer/application/address';

function FieldError({ message }) {
  if (!message) return null;

  return (
    <p className="mt-1.5 text-[11px] font-medium text-red-600">
      {message}
    </p>
  );
}

function AddressStep({
  application,
  onApplicationUpdate,
  onPrevious,
}) {
  const [form, setForm] = useState({
    pan_number: '',
    address_line: '',
    city: '',
    state: '',
    pincode: '',
    residence_type: '',
  });

  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem('customer_token');

  useEffect(() => {
    setForm({
      pan_number: application?.pan_number || '',
      address_line: application?.address_line || '',
      city: application?.city || '',
      state: application?.state || '',
      pincode: application?.pincode || '',
      residence_type:
        application?.residence_type || '',
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
          pan_number: form.pan_number
            .trim()
            .toUpperCase(),

          address_line:
            form.address_line.trim(),

          city: form.city.trim(),

          state: form.state.trim(),

          pincode: form.pincode.trim(),

          residence_type:
            form.residence_type,
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
        3
      );
    } catch (err) {
      console.error(
        'Address details save error:',
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
          'We could not save your identity and address details. Please try again.'
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
          Identity and residential information
        </h3>

        <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
          Enter your PAN and current residential address.
          Please ensure the information matches your
          supporting documents.
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

      <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
        {/* PAN */}
        <div>
          <label
            htmlFor="application-pan"
            className="mb-1.5 block text-xs font-semibold text-slate-700"
          >
            PAN number
            <span className="ml-1 text-red-500">
              *
            </span>
          </label>

          <input
            id="application-pan"
            type="text"
            required
            maxLength={10}
            autoComplete="off"
            value={form.pan_number}
            onChange={(event) =>
              updateField(
                'pan_number',
                event.target.value
                  .replace(/\s/g, '')
                  .toUpperCase()
              )
            }
            placeholder="ABCDE1234F"
            className={`h-11 w-full rounded-lg border bg-white px-3.5 font-mono text-[13px] uppercase tracking-[0.08em] text-slate-900 outline-none transition placeholder:tracking-normal placeholder:text-slate-400 focus:ring-3 ${
              errors.pan_number
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
            }`}
          />

          <FieldError
            message={errors.pan_number?.[0]}
          />

          {!errors.pan_number && (
            <p className="mt-1.5 text-[10.5px] text-slate-400">
              Enter the 10-character PAN shown on your
              PAN card.
            </p>
          )}
        </div>

        {/* Residence */}
        <div>
          <label
            htmlFor="application-residence"
            className="mb-1.5 block text-xs font-semibold text-slate-700"
          >
            Residence type
            <span className="ml-1 text-red-500">
              *
            </span>
          </label>

          <select
            id="application-residence"
            required
            value={form.residence_type}
            onChange={(event) =>
              updateField(
                'residence_type',
                event.target.value
              )
            }
            className={`h-11 w-full rounded-lg border bg-white px-3.5 text-[13px] outline-none transition focus:ring-3 ${
              form.residence_type
                ? 'text-slate-800'
                : 'text-slate-400'
            } ${
              errors.residence_type
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
            }`}
          >
            <option value="">
              Select residence type
            </option>
            <option value="owned">
              Self-owned
            </option>
            <option value="rented">
              Rented
            </option>
            <option value="family">
              Family-owned
            </option>
            <option value="company_provided">
              Company provided
            </option>
            <option value="other">
              Other
            </option>
          </select>

          <FieldError
            message={
              errors.residence_type?.[0]
            }
          />
        </div>

        {/* Address */}
        <div className="sm:col-span-2">
          <label
            htmlFor="application-address"
            className="mb-1.5 block text-xs font-semibold text-slate-700"
          >
            Current residential address
            <span className="ml-1 text-red-500">
              *
            </span>
          </label>

          <textarea
            id="application-address"
            required
            rows={3}
            maxLength={500}
            autoComplete="street-address"
            value={form.address_line}
            onChange={(event) =>
              updateField(
                'address_line',
                event.target.value
              )
            }
            placeholder="House / flat number, building, street or locality"
            className={`w-full resize-none rounded-lg border bg-white px-3.5 py-3 text-[13px] leading-5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-3 ${
              errors.address_line
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
            }`}
          />

          <div className="flex justify-between">
            <FieldError
              message={
                errors.address_line?.[0]
              }
            />

            <span className="mt-1.5 text-[10px] text-slate-400">
              {form.address_line.length}/500
            </span>
          </div>
        </div>

        {/* City */}
        <div>
          <label
            htmlFor="application-city"
            className="mb-1.5 block text-xs font-semibold text-slate-700"
          >
            City
            <span className="ml-1 text-red-500">
              *
            </span>
          </label>

          <input
            id="application-city"
            type="text"
            required
            maxLength={100}
            autoComplete="address-level2"
            value={form.city}
            onChange={(event) =>
              updateField(
                'city',
                event.target.value
              )
            }
            placeholder="e.g. Dehradun"
            className={`h-11 w-full rounded-lg border bg-white px-3.5 text-[13px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-3 ${
              errors.city
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
            }`}
          />

          <FieldError
            message={errors.city?.[0]}
          />
        </div>

        {/* State */}
        <div>
          <label
            htmlFor="application-state"
            className="mb-1.5 block text-xs font-semibold text-slate-700"
          >
            State
            <span className="ml-1 text-red-500">
              *
            </span>
          </label>

          <input
            id="application-state"
            type="text"
            required
            maxLength={100}
            autoComplete="address-level1"
            value={form.state}
            onChange={(event) =>
              updateField(
                'state',
                event.target.value
              )
            }
            placeholder="e.g. Uttarakhand"
            className={`h-11 w-full rounded-lg border bg-white px-3.5 text-[13px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-3 ${
              errors.state
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
            }`}
          />

          <FieldError
            message={errors.state?.[0]}
          />
        </div>

        {/* PIN */}
        <div>
          <label
            htmlFor="application-pincode"
            className="mb-1.5 block text-xs font-semibold text-slate-700"
          >
            PIN code
            <span className="ml-1 text-red-500">
              *
            </span>
          </label>

          <input
            id="application-pincode"
            type="text"
            required
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={6}
            value={form.pincode}
            onChange={(event) =>
              updateField(
                'pincode',
                event.target.value.replace(
                  /\D/g,
                  ''
                )
              )
            }
            placeholder="248001"
            className={`h-11 w-full rounded-lg border bg-white px-3.5 text-[13px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-3 ${
              errors.pincode
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
            }`}
          />

          <FieldError
            message={errors.pincode?.[0]}
          />
        </div>
      </div>

      {/* Notice */}
      <div className="mt-6 flex items-start gap-2.5 rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3">
        <svg
          className="mt-0.5 h-4 w-4 shrink-0 text-blue-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M12 3 5 6v5c0 4.5 2.8 8.5 7 10 4.2-1.5 7-5.5 7-10V6l-7-3Z" />
          <path d="m9.5 12 1.7 1.7 3.5-3.7" />
        </svg>

        <p className="text-[11px] leading-5 text-slate-600">
          Your PAN and address information will be used
          during application verification. Supporting
          documents will be requested in the Documents
          section.
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

export default AddressStep;