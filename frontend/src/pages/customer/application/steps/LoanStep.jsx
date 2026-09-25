import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const API_BASE =
  'http://localhost:8000/api/v1/customer';

function FieldError({ message }) {
  if (!message) return null;

  return (
    <p className="mt-1.5 text-[11px] font-medium text-red-600">
      {message}
    </p>
  );
}

function formatCurrency(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '₹0';
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function formatRate(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return '0.00';
  }

  return number.toFixed(2);
}

/*
 * Standard reducing-balance EMI estimate:
 *
 * EMI =
 * P × r × (1+r)^n
 * ----------------
 *    (1+r)^n - 1
 *
 * P = principal
 * r = monthly interest rate
 * n = tenure months
 */
function calculateEstimatedEmi(
  principal,
  annualRate,
  months
) {
  const amount = Number(principal);
  const rate = Number(annualRate);
  const tenure = Number(months);

  if (
    !amount ||
    amount <= 0 ||
    !tenure ||
    tenure <= 0
  ) {
    return null;
  }

  /*
   * Zero-interest product edge case.
   */
  if (!rate || rate <= 0) {
    return amount / tenure;
  }

  const monthlyRate =
    rate / 12 / 100;

  const growth = Math.pow(
    1 + monthlyRate,
    tenure
  );

  return (
    (amount * monthlyRate * growth) /
    (growth - 1)
  );
}

function LoanStep({
  application,
  onApplicationUpdate,
  onPrevious,
}) {
  const [products, setProducts] =
    useState([]);

  const [productsLoading, setProductsLoading] =
    useState(true);

  const [productsError, setProductsError] =
    useState('');

  const [form, setForm] = useState({
    product_id: '',
    requested_amount: '',
    requested_tenure_months: '',
    loan_purpose: '',
  });

  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] =
    useState('');

  const [saving, setSaving] = useState(false);

  const token =
    localStorage.getItem('customer_token');

  /*
   * Existing application ke loan details restore.
   */
  useEffect(() => {
    setForm({
      product_id:
        application?.product_id
          ? String(application.product_id)
          : '',

      requested_amount:
        application?.requested_amount ?? '',

      requested_tenure_months:
        application?.requested_tenure_months ??
        '',

      loan_purpose:
        application?.loan_purpose || '',
    });
  }, [application]);

  /*
   * Active Product catalogue load.
   */
  useEffect(() => {
    const fetchProducts = async () => {
      if (!token) {
        setProductsLoading(false);
        setProductsError(
          'Your session is unavailable. Please sign in again.'
        );
        return;
      }

      setProductsLoading(true);
      setProductsError('');

      try {
        const response = await axios.get(
          `${API_BASE}/products`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
          }
        );

        setProducts(
          response.data.data || []
        );
      } catch (err) {
        console.error(
          'Customer products fetch error:',
          err
        );

        setProductsError(
          err.response?.data?.message ||
            'We could not load the available loan products.'
        );
      } finally {
        setProductsLoading(false);
      }
    };

    fetchProducts();
  }, [token]);

  const selectedProduct = useMemo(() => {
    return products.find(
      (product) =>
        String(product.id) ===
        String(form.product_id)
    );
  }, [products, form.product_id]);

  const estimatedEmi = useMemo(() => {
    if (!selectedProduct) {
      return null;
    }

    return calculateEstimatedEmi(
      form.requested_amount,
      selectedProduct.interest_rate,
      form.requested_tenure_months
    );
  }, [
    selectedProduct,
    form.requested_amount,
    form.requested_tenure_months,
  ]);

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

  const selectProduct = (product) => {
    const sameProduct =
      String(form.product_id) ===
      String(product.id);

    if (sameProduct) {
      return;
    }

    /*
     * Naya Product select karne par old amount/tenure
     * silently preserve karna confusing ho sakta hai,
     * kyunki new Product ke limits different ho sakte hain.
     *
     * Existing saved Product initialization is effect se
     * already preserve hoti hai. Manual product switch par
     * amount/tenure reset karenge.
     */
    setForm((current) => ({
      ...current,
      product_id: String(product.id),
      requested_amount: '',
      requested_tenure_months: '',
    }));

    setErrors({});
    setGeneralError('');
  };

  const validateProductLimits = () => {
    if (!selectedProduct) {
      setErrors((current) => ({
        ...current,
        product_id: [
          'Please select a loan product.',
        ],
      }));

      return false;
    }

    const amount = Number(
      form.requested_amount
    );

    const minAmount = Number(
      selectedProduct.min_amount
    );

    const maxAmount = Number(
      selectedProduct.max_amount
    );

    if (
      !Number.isFinite(amount) ||
      amount < minAmount ||
      amount > maxAmount
    ) {
      setErrors((current) => ({
        ...current,
        requested_amount: [
          `Please enter an amount between ${formatCurrency(
            minAmount
          )} and ${formatCurrency(
            maxAmount
          )}.`,
        ],
      }));

      return false;
    }

    const tenure = Number(
      form.requested_tenure_months
    );

    const minTenure = Number(
      selectedProduct.min_tenure_months
    );

    const maxTenure = Number(
      selectedProduct.max_tenure_months
    );

    if (
      !Number.isInteger(tenure) ||
      tenure < minTenure ||
      tenure > maxTenure
    ) {
      setErrors((current) => ({
        ...current,
        requested_tenure_months: [
          `Please select a tenure between ${minTenure} and ${maxTenure} months.`,
        ],
      }));

      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setErrors({});
    setGeneralError('');

    if (!validateProductLimits()) {
      return;
    }

    setSaving(true);

    try {
      const response = await axios.patch(
        `${API_BASE}/application/loan`,
        {
          product_id: Number(
            form.product_id
          ),

          requested_amount: Number(
            form.requested_amount
          ),

          requested_tenure_months:
            Number(
              form.requested_tenure_months
            ),

          loan_purpose:
            form.loan_purpose.trim(),
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
        5
      );
    } catch (err) {
      console.error(
        'Loan details save error:',
        err
      );

      if (err.response?.status === 422) {
        const backendErrors =
          err.response?.data?.errors;

        if (backendErrors) {
          setErrors(backendErrors);
        } else {
          setGeneralError(
            err.response?.data?.message ||
              'Please review the selected product and loan details.'
          );
        }

        return;
      }

      setGeneralError(
        err.response?.data?.message ||
          'We could not save your loan details. Please try again.'
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
          Choose your loan requirement
        </h3>

        <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
          Select an available LoanEdge product and
          specify the amount, repayment tenure and
          purpose of your loan.
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
            <circle
              cx="12"
              cy="12"
              r="9"
            />
            <path d="M12 8v5" />
            <path d="M12 17h.01" />
          </svg>

          <p className="text-xs leading-5 text-red-700">
            {generalError}
          </p>
        </div>
      )}

      {/* Product Selection */}
      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Loan product
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <p className="mt-1 text-[10.5px] text-slate-400">
              Available products are configured by
              LoanEdge.
            </p>
          </div>

          {!productsLoading &&
            products.length > 0 && (
              <span className="text-[10.5px] font-medium text-slate-400">
                {products.length}{' '}
                {products.length === 1
                  ? 'product'
                  : 'products'}{' '}
                available
              </span>
            )}
        </div>

        {productsLoading ? (
          <div className="mt-3 flex min-h-[140px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50/50">
            <div className="text-center">
              <div className="mx-auto h-6 w-6 animate-spin rounded-full border-[3px] border-blue-100 border-t-blue-600" />

              <p className="mt-3 text-[11px] text-slate-500">
                Loading available products...
              </p>
            </div>
          </div>
        ) : productsError ? (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
            {productsError}
          </div>
        ) : products.length === 0 ? (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-5 py-7 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
              <svg
                className="h-5 w-5 text-slate-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M4 7h16v13H4z" />
                <path d="M8 7V4h8v3" />
              </svg>
            </div>

            <p className="mt-3 text-xs font-semibold text-slate-700">
              No loan products are currently available
            </p>

            <p className="mt-1 text-[10.5px] text-slate-400">
              Please return later or contact LoanEdge
              support.
            </p>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-2">
            {products.map((product) => {
              const selected =
                String(form.product_id) ===
                String(product.id);

              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() =>
                    selectProduct(product)
                  }
                  className={`relative rounded-xl border p-4 text-left transition ${
                    selected
                      ? 'border-blue-500 bg-blue-50/60 ring-3 ring-blue-600/10'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/40'
                  }`}
                >
                  {selected && (
                    <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">
                      <svg
                        className="h-3 w-3"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <path d="m5 12 4 4L19 6" />
                      </svg>
                    </span>
                  )}

                  <div className="pr-8">
                    <p className="text-[13px] font-semibold text-slate-900">
                      {product.name}
                    </p>

                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-blue-700">
                      {product.loan_type
                        ?.replaceAll('_', ' ')
                        .replace(
                          /\b\w/g,
                          (letter) =>
                            letter.toUpperCase()
                        )}
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-100 pt-3">
                    <div>
                      <p className="text-[9.5px] uppercase tracking-wide text-slate-400">
                        Interest
                      </p>

                      <p className="mt-0.5 text-[12px] font-semibold text-slate-700">
                        {formatRate(
                          product.interest_rate
                        )}
                        % p.a.
                      </p>
                    </div>

                    <div>
                      <p className="text-[9.5px] uppercase tracking-wide text-slate-400">
                        Tenure
                      </p>

                      <p className="mt-0.5 text-[12px] font-semibold text-slate-700">
                        {
                          product.min_tenure_months
                        }
                        –
                        {
                          product.max_tenure_months
                        }{' '}
                        months
                      </p>
                    </div>

                    <div className="col-span-2">
                      <p className="text-[9.5px] uppercase tracking-wide text-slate-400">
                        Loan amount
                      </p>

                      <p className="mt-0.5 text-[12px] font-semibold text-slate-700">
                        {formatCurrency(
                          product.min_amount
                        )}{' '}
                        –{' '}
                        {formatCurrency(
                          product.max_amount
                        )}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <FieldError
          message={errors.product_id?.[0]}
        />
      </section>

      {/* Loan Inputs */}
      <section className="mt-7 border-t border-slate-100 pt-6">
        <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
          {/* Amount */}
          <div>
            <label
              htmlFor="requested-amount"
              className="mb-1.5 block text-xs font-semibold text-slate-700"
            >
              Requested amount
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] font-medium text-slate-400">
                ₹
              </span>

              <input
                id="requested-amount"
                type="number"
                required
                min={
                  selectedProduct
                    ? Number(
                        selectedProduct.min_amount
                      )
                    : 1
                }
                max={
                  selectedProduct
                    ? Number(
                        selectedProduct.max_amount
                      )
                    : undefined
                }
                step="1"
                disabled={!selectedProduct}
                value={form.requested_amount}
                onChange={(event) =>
                  updateField(
                    'requested_amount',
                    event.target.value
                  )
                }
                placeholder={
                  selectedProduct
                    ? String(
                        Number(
                          selectedProduct.min_amount
                        )
                      )
                    : 'Select a product first'
                }
                className={`h-11 w-full rounded-lg border pl-8 pr-3.5 text-[13px] outline-none transition placeholder:text-slate-400 focus:ring-3 disabled:cursor-not-allowed disabled:bg-slate-50 ${
                  errors.requested_amount
                    ? 'border-red-300 bg-white focus:border-red-500 focus:ring-red-500/10'
                    : 'border-slate-300 bg-white focus:border-blue-600 focus:ring-blue-600/10'
                }`}
              />
            </div>

            <FieldError
              message={
                errors.requested_amount?.[0]
              }
            />

            {selectedProduct &&
              !errors.requested_amount && (
                <p className="mt-1.5 text-[10.5px] text-slate-400">
                  Allowed range:{' '}
                  {formatCurrency(
                    selectedProduct.min_amount
                  )}{' '}
                  –{' '}
                  {formatCurrency(
                    selectedProduct.max_amount
                  )}
                </p>
              )}
          </div>

          {/* Tenure */}
          <div>
            <label
              htmlFor="requested-tenure"
              className="mb-1.5 block text-xs font-semibold text-slate-700"
            >
              Requested tenure
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <div className="relative">
              <input
                id="requested-tenure"
                type="number"
                required
                min={
                  selectedProduct
                    ? selectedProduct.min_tenure_months
                    : 1
                }
                max={
                  selectedProduct
                    ? selectedProduct.max_tenure_months
                    : undefined
                }
                step="1"
                disabled={!selectedProduct}
                value={
                  form.requested_tenure_months
                }
                onChange={(event) =>
                  updateField(
                    'requested_tenure_months',
                    event.target.value
                  )
                }
                placeholder={
                  selectedProduct
                    ? String(
                        selectedProduct.min_tenure_months
                      )
                    : 'Select product'
                }
                className={`h-11 w-full rounded-lg border px-3.5 pr-20 text-[13px] outline-none transition placeholder:text-slate-400 focus:ring-3 disabled:cursor-not-allowed disabled:bg-slate-50 ${
                  errors.requested_tenure_months
                    ? 'border-red-300 bg-white focus:border-red-500 focus:ring-red-500/10'
                    : 'border-slate-300 bg-white focus:border-blue-600 focus:ring-blue-600/10'
                }`}
              />

              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[10.5px] text-slate-400">
                months
              </span>
            </div>

            <FieldError
              message={
                errors
                  .requested_tenure_months?.[0]
              }
            />

            {selectedProduct &&
              !errors
                .requested_tenure_months && (
                <p className="mt-1.5 text-[10.5px] text-slate-400">
                  Available tenure:{' '}
                  {
                    selectedProduct.min_tenure_months
                  }
                  –
                  {
                    selectedProduct.max_tenure_months
                  }{' '}
                  months
                </p>
              )}
          </div>

          {/* Purpose */}
          <div className="sm:col-span-2">
            <label
              htmlFor="loan-purpose"
              className="mb-1.5 block text-xs font-semibold text-slate-700"
            >
              Loan purpose
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <textarea
              id="loan-purpose"
              required
              rows={3}
              maxLength={255}
              value={form.loan_purpose}
              onChange={(event) =>
                updateField(
                  'loan_purpose',
                  event.target.value
                )
              }
              placeholder="Briefly describe how you intend to use the loan"
              className={`w-full resize-none rounded-lg border bg-white px-3.5 py-3 text-[13px] leading-5 outline-none transition placeholder:text-slate-400 focus:ring-3 ${
                errors.loan_purpose
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                  : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
              }`}
            />

            <div className="flex justify-between">
              <FieldError
                message={
                  errors.loan_purpose?.[0]
                }
              />

              <span className="mt-1.5 text-[10px] text-slate-400">
                {form.loan_purpose.length}/255
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Estimate */}
      {selectedProduct &&
        form.requested_amount &&
        form.requested_tenure_months &&
        estimatedEmi !== null && (
          <section className="mt-6 rounded-xl border border-blue-100 bg-[#f5f9ff] p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-blue-700">
                  Repayment estimate
                </p>

                <p className="mt-1.5 text-xs leading-5 text-slate-500">
                  Indicative estimate based on the
                  selected product's current interest
                  rate.
                </p>
              </div>

              <div className="sm:text-right">
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  Estimated monthly EMI
                </p>

                <p className="mt-1 text-xl font-bold text-[#0f2d52]">
                  {formatCurrency(
                    Math.round(estimatedEmi)
                  )}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 divide-x divide-blue-100 border-t border-blue-100 pt-4">
              <div className="pr-3">
                <p className="text-[9.5px] text-slate-400">
                  Amount
                </p>

                <p className="mt-1 text-[11.5px] font-semibold text-slate-700">
                  {formatCurrency(
                    form.requested_amount
                  )}
                </p>
              </div>

              <div className="px-3">
                <p className="text-[9.5px] text-slate-400">
                  Rate
                </p>

                <p className="mt-1 text-[11.5px] font-semibold text-slate-700">
                  {formatRate(
                    selectedProduct.interest_rate
                  )}
                  %
                </p>
              </div>

              <div className="pl-3">
                <p className="text-[9.5px] text-slate-400">
                  Tenure
                </p>

                <p className="mt-1 text-[11.5px] font-semibold text-slate-700">
                  {
                    form.requested_tenure_months
                  }{' '}
                  months
                </p>
              </div>
            </div>

            <p className="mt-4 text-[9.5px] leading-4 text-slate-400">
              This estimate is for illustration only.
              Final sanctioned terms and repayment
              obligations may differ after assessment
              and approval.
            </p>
          </section>
        )}

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
          disabled={
            saving ||
            productsLoading ||
            !selectedProduct
          }
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

export default LoanStep;