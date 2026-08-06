import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// adminType values that are restricted to Announcements + Complaints only,
// with no access to the Elections module (admin side or student side).
const LIMITED_STAFF_TYPES = ['hostel_warden', 'librarian', 'union_member'];

const ProtectedRoute = ({ children, adminOnly = false, studentOnly = false, blockLimitedStaff = false }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  if (studentOnly && user.role === 'admin') return <Navigate to="/admin/profile" replace />;
  if (blockLimitedStaff && user.role === 'admin' && LIMITED_STAFF_TYPES.includes(user.adminType)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

export default ProtectedRoute;
