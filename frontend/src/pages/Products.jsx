import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

const API_URL = 'http://localhost:8000/api/v1/products';

const initialForm = {
  name: '',
  loan_type: 'personal',
  interest_rate: '',
  min_amount: '',
  max_amount: '',
  min_tenure_months: '',
  max_tenure_months: '',
  status: 'active',
};

const loanTypeLabels = {
  personal: 'Personal Loan',
  business: 'Business Loan',
  gold: 'Gold Loan',
  vehicle: 'Vehicle Loan',
};

const loanTypeStyles = {
  personal: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  business: 'bg-orange-50 text-orange-700 border-orange-100',
  gold: 'bg-amber-50 text-amber-700 border-amber-100',
  vehicle: 'bg-cyan-50 text-cyan-700 border-cyan-100',
};

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function LoanTypeBadge({ type }) {
  return (
    <span
      className={`inline-flex rounded-md border px-2 py-1 text-[11px] font-semibold ${
        loanTypeStyles[type] ||
        'border-slate-200 bg-slate-50 text-slate-600'
      }`}
    >
      {loanTypeLabels[type] || type || '—'}
    </span>
  );
}

function StatusBadge({ status }) {
  const active = status === 'active';

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${
        active ? 'text-emerald-700' : 'text-slate-500'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? 'bg-emerald-500' : 'bg-slate-400'
        }`}
      />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

function SummaryItem({ label, value, accent = false }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-400">
        {label}
      </p>
      <p
        className={`mt-1 text-lg font-semibold ${
          accent ? 'text-blue-700' : 'text-slate-900'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function FieldLabel({ children }) {
  return (
    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
      {children}
    </label>
  );
}

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const token =
    localStorage.getItem('token') ||
    sessionStorage.getItem('token');

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.get(API_URL, authConfig);

      setProducts(
        response.data.data ||
          response.data.products ||
          []
      );
    } catch (err) {
      console.error('Product fetch error:', err);

      setError(
        err.response?.data?.message ||
          'Unable to load loan products. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !query ||
        product.name?.toLowerCase().includes(query) ||
        product.loan_type
          ?.toLowerCase()
          .includes(query);

      const matchesType =
        typeFilter === 'all' ||
        product.loan_type === typeFilter;

      const matchesStatus =
        statusFilter === 'all' ||
        product.status === statusFilter;

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus
      );
    });
  }, [
    products,
    search,
    typeFilter,
    statusFilter,
  ]);

  const summary = useMemo(() => {
    const active = products.filter(
      (product) => product.status === 'active'
    ).length;

    const types = new Set(
      products.map((product) => product.loan_type)
    ).size;

    const averageRate =
      products.length > 0
        ? (
            products.reduce(
              (total, product) =>
                total +
                Number(product.interest_rate || 0),
              0
            ) / products.length
          ).toFixed(2)
        : '0.00';

    return {
      total: products.length,
      active,
      types,
      averageRate,
    };
  }, [products]);

  const updateForm = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const openDrawer = () => {
    setForm(initialForm);
    setFormError('');
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    if (saving) return;

    setDrawerOpen(false);
    setForm(initialForm);
    setFormError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    if (
      Number(form.max_amount) <
      Number(form.min_amount)
    ) {
      setFormError(
        'Maximum amount must be greater than or equal to the minimum amount.'
      );
      return;
    }

    if (
      Number(form.max_tenure_months) <
      Number(form.min_tenure_months)
    ) {
      setFormError(
        'Maximum tenure must be greater than or equal to the minimum tenure.'
      );
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        loan_type: form.loan_type,
        interest_rate: Number(form.interest_rate),
        min_amount: Number(form.min_amount),
        max_amount: Number(form.max_amount),
        min_tenure_months: Number(
          form.min_tenure_months
        ),
        max_tenure_months: Number(
          form.max_tenure_months
        ),
        status: form.status,
      };

      const response = await axios.post(
        API_URL,
        payload,
        authConfig
      );

      const createdProduct = response.data.data;

      if (createdProduct) {
        setProducts((current) => [
          createdProduct,
          ...current,
        ]);
      } else {
        await fetchProducts();
      }

      setDrawerOpen(false);
      setForm(initialForm);
    } catch (err) {
      console.error('Product creation error:', err);

      const validationErrors =
        err.response?.data?.errors;

      const firstValidationError =
        validationErrors
          ? Object.values(validationErrors)[0]?.[0]
          : null;

      setFormError(
        firstValidationError ||
          err.response?.data?.message ||
          'Unable to create the loan product. Please review the information and try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const hasFilters =
    search ||
    typeFilter !== 'all' ||
    statusFilter !== 'all';

  return (
    <div className="flex min-h-screen bg-[#f6f8fb]">
      <Sidebar />

      <main className="min-w-0 flex-1">
        {/* Header */}
        <header className="border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between px-8 py-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                <span>Lending</span>
                <span>/</span>
                <span className="text-slate-600">
                  Product Configuration
                </span>
              </div>

              <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-950">
                Loan Products
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Configure the loan offerings available
                across LoanEdge.
              </p>
            </div>

            <button
              type="button"
              onClick={openDrawer}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-600/15"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>

              New product
            </button>
          </div>
        </header>

        <div className="p-8">
          {/* Summary strip */}
          <section className="mb-6 rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
            <div className="grid grid-cols-2 gap-y-5 divide-x-0 sm:grid-cols-4 sm:divide-x sm:divide-slate-100">
              <div className="sm:pr-6">
                <SummaryItem
                  label="Total products"
                  value={summary.total}
                />
              </div>

              <div className="sm:px-6">
                <SummaryItem
                  label="Active offerings"
                  value={summary.active}
                  accent
                />
              </div>

              <div className="sm:px-6">
                <SummaryItem
                  label="Loan categories"
                  value={summary.types}
                />
              </div>

              <div className="sm:pl-6">
                <SummaryItem
                  label="Average rate"
                  value={`${summary.averageRate}%`}
                />
              </div>
            </div>
          </section>

          {/* Main workspace */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Product catalogue
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  {loading
                    ? 'Loading configured products...'
                    : `${filteredProducts.length} of ${products.length} products shown`}
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative sm:w-64">
                  <svg
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle
                      cx="11"
                      cy="11"
                      r="7"
                    />
                    <path d="m20 20-3.5-3.5" />
                  </svg>

                  <input
                    type="search"
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search products"
                    className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-3 focus:ring-blue-600/10"
                  />
                </div>

                <select
                  value={typeFilter}
                  onChange={(event) =>
                    setTypeFilter(event.target.value)
                  }
                  className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 outline-none focus:border-blue-600"
                >
                  <option value="all">
                    All loan types
                  </option>
                  <option value="personal">
                    Personal
                  </option>
                  <option value="business">
                    Business
                  </option>
                  <option value="gold">
                    Gold
                  </option>
                  <option value="vehicle">
                    Vehicle
                  </option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value
                    )
                  }
                  className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 outline-none focus:border-blue-600"
                >
                  <option value="all">
                    All statuses
                  </option>
                  <option value="active">
                    Active
                  </option>
                  <option value="inactive">
                    Inactive
                  </option>
                </select>
              </div>
            </div>

            {error && (
              <div className="m-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex min-h-[330px] flex-col items-center justify-center">
                <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-blue-100 border-t-blue-600" />
                <p className="mt-3 text-xs text-slate-500">
                  Loading loan products...
                </p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex min-h-[330px] flex-col items-center justify-center px-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-100 bg-blue-50">
                  <svg
                    className="h-6 w-6 text-blue-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  >
                    <path d="M4 7h16v13H4z" />
                    <path d="M8 7V4h8v3" />
                    <path d="M8 12h8" />
                  </svg>
                </div>

                <h3 className="mt-4 text-sm font-semibold text-slate-900">
                  {hasFilters
                    ? 'No products match these filters'
                    : 'No loan products configured'}
                </h3>

                <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
                  {hasFilters
                    ? 'Change or clear your filters to view other products.'
                    : 'Create the first loan product to make an offering available for lending.'}
                </p>

                {!hasFilters && (
                  <button
                    type="button"
                    onClick={openDrawer}
                    className="mt-5 text-xs font-semibold text-blue-700 hover:text-blue-800"
                  >
                    Create first product →
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70">
                      <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Product
                      </th>
                      <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Type
                      </th>
                      <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Interest
                      </th>
                      <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Amount range
                      </th>
                      <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Tenure
                      </th>
                      <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map(
                      (product) => (
                        <tr
                          key={product.id}
                          className="transition hover:bg-slate-50/60"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eaf1ff] text-xs font-bold text-blue-700">
                                {product.name
                                  ?.charAt(0)
                                  ?.toUpperCase() ||
                                  'L'}
                              </div>

                              <div>
                                <p className="text-[13px] font-semibold text-slate-900">
                                  {product.name}
                                </p>

                                <p className="mt-0.5 text-[10.5px] text-slate-400">
                                  Product ID #
                                  {product.id}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <LoanTypeBadge
                              type={
                                product.loan_type
                              }
                            />
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-[13px] font-semibold text-slate-800">
                              {
                                product.interest_rate
                              }
                              %
                            </p>
                            <p className="mt-0.5 text-[10px] text-slate-400">
                              per annum
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-[12.5px] font-medium text-slate-700">
                              {formatCurrency(
                                product.min_amount
                              )}
                              {' – '}
                              {formatCurrency(
                                product.max_amount
                              )}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-[12.5px] font-medium text-slate-700">
                              {
                                product.min_tenure_months
                              }
                              {' – '}
                              {
                                product.max_tenure_months
                              }{' '}
                              months
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge
                              status={product.status}
                            />
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-[1px]"
          onClick={closeDrawer}
        />
      )}

      {/* Create product drawer */}
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-[520px] transform bg-white shadow-[-20px_0_50px_-30px_rgba(15,23,42,0.35)] transition-transform duration-300 ${
          drawerOpen
            ? 'translate-x-0'
            : 'translate-x-full'
        }`}
      >
        <form
          onSubmit={handleSubmit}
          className="flex h-full flex-col"
        >
          <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-700">
                Product configuration
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                New loan product
              </h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Define pricing, lending limits and
                tenure for this offering.
              </p>
            </div>

            <button
              type="button"
              onClick={closeDrawer}
              disabled={saving}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {formError && (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700">
                {formError}
              </div>
            )}

            <div className="space-y-6">
              {/* General */}
              <div>
                <div className="mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                    General information
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <FieldLabel>
                      Product name
                    </FieldLabel>

                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(event) =>
                        updateForm(
                          'name',
                          event.target.value
                        )
                      }
                      placeholder="e.g. Personal Loan Standard"
                      className="h-10 w-full rounded-lg border border-slate-300 px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-3 focus:ring-blue-600/10"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>
                        Loan type
                      </FieldLabel>

                      <select
                        value={form.loan_type}
                        onChange={(event) =>
                          updateForm(
                            'loan_type',
                            event.target.value
                          )
                        }
                        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-600"
                      >
                        <option value="personal">
                          Personal Loan
                        </option>
                        <option value="business">
                          Business Loan
                        </option>
                        <option value="gold">
                          Gold Loan
                        </option>
                        <option value="vehicle">
                          Vehicle Loan
                        </option>
                      </select>
                    </div>

                    <div>
                      <FieldLabel>
                        Status
                      </FieldLabel>

                      <select
                        value={form.status}
                        onChange={(event) =>
                          updateForm(
                            'status',
                            event.target.value
                          )
                        }
                        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-600"
                      >
                        <option value="active">
                          Active
                        </option>
                        <option value="inactive">
                          Inactive
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Pricing */}
              <div>
                <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                  Pricing
                </h3>

                <div>
                  <FieldLabel>
                    Interest rate (% p.a.)
                  </FieldLabel>

                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="0"
                      max="999.99"
                      step="0.01"
                      value={form.interest_rate}
                      onChange={(event) =>
                        updateForm(
                          'interest_rate',
                          event.target.value
                        )
                      }
                      placeholder="12.50"
                      className="h-10 w-full rounded-lg border border-slate-300 px-3.5 pr-12 text-sm outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-600/10"
                    />

                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                      %
                    </span>
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Lending limits */}
              <div>
                <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                  Lending limits
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>
                      Minimum amount
                    </FieldLabel>

                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                        ₹
                      </span>

                      <input
                        type="number"
                        required
                        min="0"
                        value={form.min_amount}
                        onChange={(event) =>
                          updateForm(
                            'min_amount',
                            event.target.value
                          )
                        }
                        placeholder="50000"
                        className="h-10 w-full rounded-lg border border-slate-300 pl-7 pr-3 text-sm outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-600/10"
                      />
                    </div>
                  </div>

                  <div>
                    <FieldLabel>
                      Maximum amount
                    </FieldLabel>

                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                        ₹
                      </span>

                      <input
                        type="number"
                        required
                        min="0"
                        value={form.max_amount}
                        onChange={(event) =>
                          updateForm(
                            'max_amount',
                            event.target.value
                          )
                        }
                        placeholder="1000000"
                        className="h-10 w-full rounded-lg border border-slate-300 pl-7 pr-3 text-sm outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-600/10"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Tenure */}
              <div>
                <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                  Repayment tenure
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>
                      Minimum tenure
                    </FieldLabel>

                    <div className="relative">
                      <input
                        type="number"
                        required
                        min="1"
                        value={
                          form.min_tenure_months
                        }
                        onChange={(event) =>
                          updateForm(
                            'min_tenure_months',
                            event.target.value
                          )
                        }
                        placeholder="12"
                        className="h-10 w-full rounded-lg border border-slate-300 px-3 pr-16 text-sm outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-600/10"
                      />

                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                        months
                      </span>
                    </div>
                  </div>

                  <div>
                    <FieldLabel>
                      Maximum tenure
                    </FieldLabel>

                    <div className="relative">
                      <input
                        type="number"
                        required
                        min="1"
                        value={
                          form.max_tenure_months
                        }
                        onChange={(event) =>
                          updateForm(
                            'max_tenure_months',
                            event.target.value
                          )
                        }
                        placeholder="60"
                        className="h-10 w-full rounded-lg border border-slate-300 px-3 pr-16 text-sm outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-600/10"
                      />

                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                        months
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3">
                <p className="text-[11px] leading-5 text-slate-600">
                  Active products can be presented to
                  eligible customers through the
                  customer application journey.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/60 px-6 py-4">
            <p className="hidden text-[10.5px] text-slate-400 sm:block">
              All fields are required.
            </p>

            <div className="ml-auto flex gap-2.5">
              <button
                type="button"
                onClick={closeDrawer}
                disabled={saving}
                className="h-9 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="flex h-9 min-w-[125px] items-center justify-center rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <span className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Creating...
                  </>
                ) : (
                  'Create product'
                )}
              </button>
            </div>
          </div>
        </form>
      </aside>
    </div>
  );
}

export default Products;