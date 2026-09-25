import { Navigate, useLocation } from 'react-router-dom';

/**
 * Admin/Staff Protected Route
 *
 * Agar user ke paas valid token nahi hai,
 * toh use /login par redirect kar deta hai.
 *
 * Agar token hai, toh children (jo bhi page) render karta hai.
 */
function ProtectedRoute({ children }) {
  const location = useLocation();

  const token =
    localStorage.getItem('token') || sessionStorage.getItem('token');

  // Agar token nahi hai, toh login page par bhejo
  // `state` mein current location save karo, taaki login ke baad wapas yahan aaye
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Agar token hai, toh page render karo
  return children;
}

export default ProtectedRoute;