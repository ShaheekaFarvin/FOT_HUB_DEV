import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import BrandMark from '../../components/BrandMark';
import {
  Eye, EyeOff, Loader2, AlertCircle, Shield, Sun, Moon,
  Mail, RefreshCw, CheckCircle2, KeyRound, ChevronLeft,
} from 'lucide-react';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

const ForgotPassword = () => {
  // Step: 'email' | 'otp' | 'reset' | 'done'
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [sentEmail, setSentEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [pwMismatch, setPwMismatch] = useState('');

  const {
    sendForgotPasswordOtp, verifyForgotPasswordOtp,
    resetPassword, resendForgotPasswordOtp,
    loading, error,
  } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // ── Step 1: Send OTP ──
  const handleSendOtp = async (e) => {
    e.preventDefault();
    try {
      const data = await sendForgotPasswordOtp(email);
      setSentEmail(data.email || email);
      setStep('otp');
      setCountdown(RESEND_COOLDOWN);
    } catch {}
  };

  // ── Step 2: Verify OTP ──
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    try {
      await verifyForgotPasswordOtp(sentEmail, otp.trim());
      setStep('reset');
    } catch {}
  };

  // ── Step 3: Set new password ──
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setPwMismatch('');
    if (newPassword !== confirmPassword) {
      setPwMismatch('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPwMismatch('Password must be at least 6 characters.');
      return;
    }
    try {
      await resetPassword(sentEmail, otp.trim(), newPassword);
      setStep('done');
    } catch {}
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    try {
      await resendForgotPasswordOtp(sentEmail);
      setCountdown(RESEND_COOLDOWN);
      setOtp('');
    } catch {}
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ fontFamily: 'DM Sans, system-ui, sans-serif', background: 'var(--bg-page)' }}>

      <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#0d1b2a]/5 blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-[#c9a84c]/5 blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <button onClick={toggleTheme} className="theme-toggle absolute top-5 right-5" aria-label="Toggle theme">
        {theme === 'dark' ? <Sun size={16} style={{ color: 'var(--gold)' }}/> : <Moon size={16}/>}
      </button>

      <div className="w-full max-w-sm relative z-10">

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <BrandMark size={56} radius="rounded-2xl" variant="navy" />
          </div>
          <h1 className="text-2xl font-bold text-primary" style={{ fontFamily: 'Playfair Display,serif' }}>
            Reset Password
          </h1>
          <p className="text-secondary text-sm mt-1">FOT Student Hub · Rajarata University</p>
        </div>

        <div className="bg-[var(--bg-card)] rounded-2xl shadow-lg border border-[var(--border-card)] p-6">

          {/* ══ STEP 1: Enter email ══ */}
          {step === 'email' && (
            <>
              <div className="flex flex-col items-center mb-6">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #0d1b2a, #1a2f4a)' }}>
                  <KeyRound size={24} style={{ color: '#c9a84c' }}/>
                </div>
                <p className="text-sm text-center text-secondary">
                  Enter your campus email and we'll send you an OTP to reset your password.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                  <AlertCircle size={14} className="text-red-500 flex-shrink-0"/>
                  <p className="text-red-600 text-xs">{error}</p>
                </div>
              )}

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-primary mb-1.5">Campus Email</label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    placeholder="yourname@tec.rjt.ac.lk" className="input-field"
                  />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#0d1b2a,#243b6a)', color: '#c9a84c', boxShadow: '0 4px 16px rgba(13,27,42,0.3)' }}>
                  {loading
                    ? <><Loader2 size={15} className="animate-spin"/>Sending OTP…</>
                    : <>Send OTP</>}
                </button>
              </form>
            </>
          )}

          {/* ══ STEP 2: Verify OTP ══ */}
          {step === 'otp' && (
            <>
              <div className="flex flex-col items-center mb-6">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #0d1b2a, #1a2f4a)' }}>
                  <Mail size={24} style={{ color: '#c9a84c' }}/>
                </div>
                <p className="text-sm text-center text-secondary">A 6-digit OTP was sent to</p>
                <p className="text-sm font-bold mt-1" style={{ color: '#c9a84c' }}>{sentEmail}</p>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                  <AlertCircle size={14} className="text-red-500 flex-shrink-0"/>
                  <p className="text-red-600 text-xs">{error}</p>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-primary mb-1.5">Enter OTP Code</label>
                  <input
                    type="text" value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH))}
                    required maxLength={OTP_LENGTH} inputMode="numeric" pattern="\d{6}"
                    placeholder="• • • • • •"
                    className="input-field text-center text-2xl font-bold"
                    style={{ letterSpacing: '0.4em' }}
                  />
                  {otp.length === OTP_LENGTH && (
                    <p className="flex items-center gap-1 text-xs text-green-600 mt-1.5">
                      <CheckCircle2 size={11}/> OTP entered — tap Verify to continue
                    </p>
                  )}
                </div>

                <button type="submit" disabled={loading || otp.length !== OTP_LENGTH}
                  className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#0d1b2a,#243b6a)', color: '#c9a84c', boxShadow: '0 4px 16px rgba(13,27,42,0.3)' }}>
                  {loading
                    ? <><Loader2 size={15} className="animate-spin"/>Verifying…</>
                    : <>Verify OTP</>}
                </button>
              </form>

              <div className="flex items-center justify-center gap-2 mt-4">
                <button onClick={handleResend} disabled={countdown > 0 || loading}
                  className="flex items-center gap-1.5 text-sm font-medium transition-colors disabled:opacity-40"
                  style={{ color: countdown > 0 ? 'var(--text-muted)' : '#c9a84c' }}>
                  <RefreshCw size={13} className={loading ? 'animate-spin' : ''}/>
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                </button>
              </div>

              <button onClick={() => { setStep('email'); setOtp(''); }}
                className="w-full flex items-center justify-center gap-1 text-center text-sm mt-3 transition-colors"
                style={{ color: 'var(--text-muted)' }}>
                <ChevronLeft size={14}/> Use a different email
              </button>
            </>
          )}

          {/* ══ STEP 3: Set new password ══ */}
          {step === 'reset' && (
            <>
              <div className="flex flex-col items-center mb-6">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #0d1b2a, #1a2f4a)' }}>
                  <KeyRound size={24} style={{ color: '#c9a84c' }}/>
                </div>
                <p className="text-sm text-center text-secondary">Set a new password for your account</p>
              </div>

              {(error || pwMismatch) && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                  <AlertCircle size={14} className="text-red-500 flex-shrink-0"/>
                  <p className="text-red-600 text-xs">{pwMismatch || error}</p>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-primary mb-1.5">New Password</label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'} value={newPassword}
                      onChange={e => setNewPassword(e.target.value)} required
                      placeholder="Minimum 6 characters" className="input-field pr-10"
                    />
                    <button type="button" onClick={() => setShowPw(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-secondary transition">
                      {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-primary mb-1.5">Confirm New Password</label>
                  <input
                    type={showPw ? 'text' : 'password'} value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)} required
                    placeholder="Re-enter new password" className="input-field"
                  />
                </div>

                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#0d1b2a,#243b6a)', color: '#c9a84c', boxShadow: '0 4px 16px rgba(13,27,42,0.3)' }}>
                  {loading
                    ? <><Loader2 size={15} className="animate-spin"/>Resetting…</>
                    : <>Reset Password</>}
                </button>
              </form>
            </>
          )}

          {/* ══ STEP 4: Done ══ */}
          {step === 'done' && (
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg bg-green-50">
                <CheckCircle2 size={32} className="text-green-500"/>
              </div>
              <h2 className="text-xl font-bold text-primary mb-2" style={{ fontFamily: 'Playfair Display,serif' }}>
                Password Reset!
              </h2>
              <p className="text-sm text-secondary mb-6">
                Your password has been changed successfully. You can now sign in with your new password.
              </p>
              <button onClick={() => navigate('/login')}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all duration-200"
                style={{ background: 'linear-gradient(135deg,#0d1b2a,#243b6a)', color: '#c9a84c', boxShadow: '0 4px 16px rgba(13,27,42,0.3)' }}>
                Go to Login
              </button>
            </div>
          )}

          {step !== 'done' && (
            <p className="text-center text-sm text-secondary mt-5">
              Remembered your password?{' '}
              <Link to="/login" className="text-[var(--navy)] font-bold hover:text-[#c9a84c] transition-colors">Sign in</Link>
            </p>
          )}
        </div>

        <div className="flex items-center justify-center gap-1.5 mt-5">
          <Shield size={11} style={{ color: 'var(--text-muted)' }}/>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Faculty of Technology · Rajarata University of Sri Lanka</p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
