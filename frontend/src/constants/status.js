/* ============================================================
 * LOAN STATUS
 * ============================================================ */
export const LOAN_STATUS = {
  sanctioned: { label: 'Sanctioned', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  disbursed: { label: 'Disbursed', badge: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  active: { label: 'Active', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  closed: { label: 'Closed', badge: 'bg-slate-50 text-slate-600 border-slate-200' },
  npa: { label: 'NPA', badge: 'bg-red-50 text-red-700 border-red-200' },
};

/* ============================================================
 * APPLICATION STATUS
 * ============================================================ */
export const APPLICATION_STATUS = {
  draft: { label: 'In Progress', badge: 'border-amber-200 bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  submitted: { label: 'Submitted', badge: 'border-blue-200 bg-blue-50 text-blue-700', dot: 'bg-blue-500' },
  under_review: { label: 'Under Review', badge: 'border-violet-200 bg-violet-50 text-violet-700', dot: 'bg-violet-500' },
  approved: { label: 'Approved', badge: 'border-emerald-200 bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  rejected: { label: 'Rejected', badge: 'border-red-200 bg-red-50 text-red-700', dot: 'bg-red-500' },
  cancelled: { label: 'Cancelled', badge: 'border-slate-200 bg-slate-50 text-slate-600', dot: 'bg-slate-400' },
};

/* ============================================================
 * APPROVAL STATUS
 * ============================================================ */
export const APPROVAL_STATUS = {
  pending: { label: 'Pending', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  approved: { label: 'Approved', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Rejected', badge: 'bg-red-50 text-red-700 border-red-200' },
};

/* ============================================================
 * EMI STATUS
 * ============================================================ */
export const EMI_STATUS = {
  pending: { label: 'Pending', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  partial: { label: 'Partial', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  paid: { label: 'Paid', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  overdue: { label: 'Overdue', badge: 'bg-red-50 text-red-700 border-red-200' },
};

/* ============================================================
 * COLLECTION BUCKET
 * ============================================================ */
export const COLLECTION_BUCKET = {
  current: { label: 'Current', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  '0-30': { label: '0-30 days', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  '30-60': { label: '30-60 days', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  '60-90': { label: '60-90 days', badge: 'bg-orange-50 text-orange-700 border-orange-200' },
  '90+': { label: '90+ days', badge: 'bg-red-50 text-red-700 border-red-200' },
};

/* ============================================================
 * COLLECTION STATUS
 * ============================================================ */
export const COLLECTION_STATUS = {
  active: { label: 'Active', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  recovered: { label: 'Recovered', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  legal_notice: { label: 'Legal Notice', badge: 'bg-red-50 text-red-700 border-red-200' },
};

/* ============================================================
 * KYC DOCUMENT STATUS
 * ============================================================ */
export const DOCUMENT_STATUS = {
  pending: { label: 'Pending', badge: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  approved: { label: 'Verified', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  rejected: { label: 'Action Required', badge: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
};

/* ============================================================
 * RISK CATEGORY
 * ============================================================ */
export const RISK_CATEGORY = {
  low: { label: 'Low Risk', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  medium: { label: 'Medium Risk', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  high: { label: 'High Risk', badge: 'bg-red-50 text-red-700 border-red-200' },
};

/* ============================================================
 * APPROVER LEVEL
 * ============================================================ */
export const APPROVER_LEVEL = {
  branch_manager: { label: 'Branch Manager', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  credit_committee: { label: 'Credit Committee', badge: 'bg-violet-50 text-violet-700 border-violet-200' },
};

/* ============================================================
 * DOCUMENT TYPE
 * ============================================================ */
export const DOCUMENT_TYPE = {
  aadhar: { label: 'Aadhaar', badge: 'border-cyan-100 bg-cyan-50 text-cyan-700' },
  pan: { label: 'PAN', badge: 'border-indigo-100 bg-indigo-50 text-indigo-700' },
  salary_slip: { label: 'Salary Slip', badge: 'border-pink-100 bg-pink-50 text-pink-700' },
  bank_statement: { label: 'Bank Statement', badge: 'border-orange-100 bg-orange-50 text-orange-700' },
};

/* ============================================================
 * LOAN TYPE
 * ============================================================ */
export const LOAN_TYPE = {
  personal: { label: 'Personal Loan', badge: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
  business: { label: 'Business Loan', badge: 'bg-orange-50 text-orange-700 border-orange-100' },
  gold: { label: 'Gold Loan', badge: 'bg-amber-50 text-amber-700 border-amber-100' },
  vehicle: { label: 'Vehicle Loan', badge: 'bg-cyan-50 text-cyan-700 border-cyan-100' },
};