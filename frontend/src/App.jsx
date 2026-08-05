import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Leads */}
        <Route path="/leads" element={<Leads />} />

        {/* Products */}
        <Route path="/products" element={<Products />} />

        {/* KYC */}
        <Route path="/kyc" element={<KYC />} />
        <Route path="/kyc/:leadId" element={<KYC />} />

        {/* Underwriting */}
        <Route path="/underwriting" element={<Underwriting />} />
        <Route path="/underwriting/:leadId" element={<Underwriting />} />

        {/* Approval */}
        <Route path="/approval" element={<Approval />} />
        <Route path="/approval/:leadId" element={<Approval />} />

        {/* Loans */}
        <Route path="/loans" element={<Loan />} />
        <Route path="/loans/:leadId" element={<Loan />} />
        
        {/* EMI */}
        <Route path="/emi" element={<Emi />} />
        <Route path="/emi/:loanId" element={<Emi />} />

        {/* Collection */}
        <Route path="/collection" element={<Collection />} />
        <Route path="/collection/:loanId" element={<Collection />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;