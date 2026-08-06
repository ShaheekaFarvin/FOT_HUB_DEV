import React, { createContext, useContext, useState } from 'react';
import {
  loginUser as apiLogin,
  sendRegisterOtp   as apiSendRegOtp,
  verifyRegisterOtp as apiVerifyRegOtp,
  resendOtp as apiResendOtp,
  sendForgotPasswordOtp   as apiSendForgotOtp,
  verifyForgotPasswordOtp as apiVerifyForgotOtp,
  resetPassword            as apiResetPassword,
  resendForgotPasswordOtp  as apiResendForgotOtp,
} from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('userInfo')); } catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  // ── Simple login: email + password, no OTP ──
  const login = async (email, password) => {
    setLoading(true); setError(null);
    try {
      const { data } = await apiLogin({ email, password });
      setUser(data); localStorage.setItem('userInfo', JSON.stringify(data)); return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed'); throw err;
    } finally { setLoading(false); }
  };

  // ── Register Step 1: validate & send OTP ──
  const sendRegisterOtp = async (form) => {
    setLoading(true); setError(null);
    try {
      const { data } = await apiSendRegOtp(form);
      return data; // { message, email }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed'); throw err;
    } finally { setLoading(false); }
  };

  // ── Register Step 2: verify OTP & create user ──
  const verifyRegisterOtp = async (email, otp) => {
    setLoading(true); setError(null);
    try {
      const { data } = await apiVerifyRegOtp({ email, otp });
      setUser(data); localStorage.setItem('userInfo', JSON.stringify(data)); return data;
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed'); throw err;
    } finally { setLoading(false); }
  };

  // ── Resend OTP (registration) ──
  const resendOtp = async (email) => {
    setLoading(true); setError(null);
    try {
      const { data } = await apiResendOtp({ email, purpose: 'register' });
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP'); throw err;
    } finally { setLoading(false); }
  };

  // ── Forgot Password Step 1: send OTP ──
  const sendForgotPasswordOtp = async (email) => {
    setLoading(true); setError(null);
    try {
      const { data } = await apiSendForgotOtp({ email });
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP'); throw err;
    } finally { setLoading(false); }
  };

  // ── Forgot Password Step 2: verify OTP ──
  const verifyForgotPasswordOtp = async (email, otp) => {
    setLoading(true); setError(null);
    try {
      const { data } = await apiVerifyForgotOtp({ email, otp });
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed'); throw err;
    } finally { setLoading(false); }
  };

  // ── Forgot Password Step 3: set new password ──
  const resetPassword = async (email, otp, newPassword) => {
    setLoading(true); setError(null);
    try {
      const { data } = await apiResetPassword({ email, otp, newPassword });
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password'); throw err;
    } finally { setLoading(false); }
  };

  // ── Resend OTP (forgot password) ──
  const resendForgotPasswordOtp = async (email) => {
    setLoading(true); setError(null);
    try {
      const { data } = await apiResendForgotOtp({ email });
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP'); throw err;
    } finally { setLoading(false); }
  };

  const logout = () => { setUser(null); localStorage.removeItem('userInfo'); };
  const updateUser = (data) => { setUser(data); localStorage.setItem('userInfo', JSON.stringify(data)); };

  return (
    <AuthContext.Provider value={{
      user, loading, error,
      login,
      sendRegisterOtp, verifyRegisterOtp, resendOtp,
      sendForgotPasswordOtp, verifyForgotPasswordOtp, resetPassword, resendForgotPasswordOtp,
      logout, updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
