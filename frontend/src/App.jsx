import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

// Protected Route Components
import ProtectedRoute from './components/ProtectedRoute';
import CustomerProtectedRoute from './components/CustomerProtectedRoute';

// Staff Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Products from './pages/Products';
import KYC from './pages/KYC';
import Underwriting from './pages/Underwriting';
import Approval from './pages/Approval';
import Loan from './pages/Loan';
import Emi from './pages/Emi';
import Collection from './pages/Collection';

// Customer Pages
import CustomerRegister from './pages/customer/CustomerRegister';
import CustomerVerifyOtp from './pages/customer/CustomerVerifyOtp';
import CustomerLogin from './pages/customer/CustomerLogin';
import CustomerDashboard from './pages/customer/CustomerDashboard';

// Customer Loan Application
import CustomerApply from './pages/customer/application/CustomerApply';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ==================== PUBLIC ROUTES ==================== */}

        {/* Default redirect to login */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        {/* Staff Auth */}
        <Route path="/login" element={<Login />} />

        {/* Customer Auth */}
        <Route
          path="/customer/register"
          element={<CustomerRegister />}
        />

        <Route
          path="/customer/verify-otp"
          element={<CustomerVerifyOtp />}
        />

        <Route
          path="/customer/login"
          element={<CustomerLogin />}
        />

        {/* ==================== STAFF PROTECTED ROUTES ==================== */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/leads"
          element={
            <ProtectedRoute>
              <Leads />
            </ProtectedRoute>
          }
        />

        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          }
        />

        {/* KYC */}
        <Route
          path="/kyc"
          element={
            <ProtectedRoute>
              <KYC />
            </ProtectedRoute>
          }
        />

        <Route
          path="/kyc/:leadId"
          element={
            <ProtectedRoute>
              <KYC />
            </ProtectedRoute>
          }
        />

        {/* Underwriting */}
        <Route
          path="/underwriting"
          element={
            <ProtectedRoute>
              <Underwriting />
            </ProtectedRoute>
          }
        />

        <Route
          path="/underwriting/:leadId"
          element={
            <ProtectedRoute>
              <Underwriting />
            </ProtectedRoute>
          }
        />

        {/* Approval */}
        <Route
          path="/approval"
          element={
            <ProtectedRoute>
              <Approval />
            </ProtectedRoute>
          }
        />

        <Route
          path="/approval/:leadId"
          element={
            <ProtectedRoute>
              <Approval />
            </ProtectedRoute>
          }
        />

        {/* Loans */}
        <Route
          path="/loans"
          element={
            <ProtectedRoute>
              <Loan />
            </ProtectedRoute>
          }
        />

        <Route
          path="/loans/:leadId"
          element={
            <ProtectedRoute>
              <Loan />
            </ProtectedRoute>
          }
        />

        {/* EMI */}
        <Route
          path="/emi"
          element={
            <ProtectedRoute>
              <Emi />
            </ProtectedRoute>
          }
        />

        <Route
          path="/emi/:loanId"
          element={
            <ProtectedRoute>
              <Emi />
            </ProtectedRoute>
          }
        />

        {/* Collection */}
        <Route
          path="/collection"
          element={
            <ProtectedRoute>
              <Collection />
            </ProtectedRoute>
          }
        />

        <Route
          path="/collection/:loanId"
          element={
            <ProtectedRoute>
              <Collection />
            </ProtectedRoute>
          }
        />

        {/* ==================== CUSTOMER PROTECTED ROUTES ==================== */}

        <Route
          path="/customer/dashboard"
          element={
            <CustomerProtectedRoute>
              <CustomerDashboard />
            </CustomerProtectedRoute>
          }
        />

        <Route
          path="/customer/apply"
          element={
            <CustomerProtectedRoute>
              <CustomerApply />
            </CustomerProtectedRoute>
          }
        />

        {/* ==================== FALLBACK ==================== */}

        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;