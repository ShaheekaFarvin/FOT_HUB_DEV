import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ElectionProvider } from './context/ElectionContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import NotificationPopup from './components/NotificationPopup';
import { useAuth } from './context/AuthContext';

import Login          from './pages/student/Login';
import Register       from './pages/student/Register';
import ForgotPassword from './pages/student/ForgotPassword';
import Dashboard      from './pages/student/Dashboard';
import VotingPage     from './pages/student/VotingPage';
import MyVotes        from './pages/student/MyVotes';
import Announcements  from './pages/student/Announcements';
import Complaints     from './pages/student/Complaints';
import LostFound      from './pages/student/LostFound';
import Profile        from './pages/student/Profile';
import Notifications  from './pages/student/Notifications';
import Elections      from './pages/student/Elections';

import AdminDashboard     from './pages/admin/AdminDashboard';
import AdminElections     from './pages/admin/AdminElections';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import AdminComplaints    from './pages/admin/AdminComplaints';
import AdminLostFound     from './pages/admin/AdminLostFound';
import AdminUsers         from './pages/admin/AdminUsers';
import AdminActivity      from './pages/admin/AdminActivity';
import AdminProfile       from './pages/admin/AdminProfile';
import RegistrationConfig from './pages/admin/RegistrationConfig';

// Sends the user to the right home page: admins land on the admin
// dashboard, students land on the student dashboard.
const RoleHome = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
};

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
      <AuthProvider>
        <NotificationProvider>
        <ElectionProvider>
          <Router>
            <NotificationPopup />
            <Routes>
              <Route path="/login"    element={<Login/>}/>
              <Route path="/register" element={<Register/>}/>
              <Route path="/forgot-password" element={<ForgotPassword/>}/>

              <Route path="/dashboard"      element={<ProtectedRoute><Dashboard/></ProtectedRoute>}/>
              <Route path="/elections"      element={<ProtectedRoute blockLimitedStaff><Elections/></ProtectedRoute>}/>
              <Route path="/elections/:id"  element={<ProtectedRoute blockLimitedStaff><VotingPage/></ProtectedRoute>}/>
              <Route path="/my-votes"       element={<ProtectedRoute><MyVotes/></ProtectedRoute>}/>
              <Route path="/announcements"  element={<ProtectedRoute><Announcements/></ProtectedRoute>}/>
              <Route path="/complaints"     element={<ProtectedRoute><Complaints/></ProtectedRoute>}/>
              <Route path="/lost-found"     element={<ProtectedRoute><LostFound/></ProtectedRoute>}/>
              <Route path="/profile"        element={<ProtectedRoute studentOnly><Profile/></ProtectedRoute>}/>
              <Route path="/notifications"   element={<ProtectedRoute><Notifications/></ProtectedRoute>}/>

              <Route path="/admin"               element={<ProtectedRoute adminOnly><AdminDashboard/></ProtectedRoute>}/>
              <Route path="/admin/elections"     element={<ProtectedRoute adminOnly><AdminElections/></ProtectedRoute>}/>
              <Route path="/admin/announcements" element={<ProtectedRoute adminOnly><AdminAnnouncements/></ProtectedRoute>}/>
              <Route path="/admin/complaints"    element={<ProtectedRoute adminOnly><AdminComplaints/></ProtectedRoute>}/>
              <Route path="/admin/lost-found"    element={<ProtectedRoute adminOnly><AdminLostFound/></ProtectedRoute>}/>
              <Route path="/admin/users"         element={<ProtectedRoute adminOnly><AdminUsers/></ProtectedRoute>}/>
              <Route path="/admin/activity"      element={<ProtectedRoute adminOnly><AdminActivity/></ProtectedRoute>}/>
              <Route path="/admin/reg-settings"  element={<ProtectedRoute adminOnly><RegistrationConfig/></ProtectedRoute>}/>
              <Route path="/admin/profile"       element={<ProtectedRoute adminOnly><AdminProfile/></ProtectedRoute>}/>

              <Route path="/" element={<RoleHome/>}/>
              <Route path="*" element={<RoleHome/>}/>
            </Routes>
          </Router>
        </ElectionProvider>
        </NotificationProvider>
      </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
