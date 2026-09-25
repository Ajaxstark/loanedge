import { Navigate, useLocation } from 'react-router-dom';

/**
 * Customer Protected Route
 *
 * Customer ke liye alag token use hota hai: `customer_token`
 * Agar customer login nahi hai, toh /customer/login par bhejo.
 */
function CustomerProtectedRoute({ children }) {
  const location = useLocation();

  const token = localStorage.getItem('customer_token');

  if (!token) {
    return (
      <Navigate
        to="/customer/login"
        state={{ from: location }}
        replace
      />
    );
  }

  return children;
}

export default CustomerProtectedRoute;