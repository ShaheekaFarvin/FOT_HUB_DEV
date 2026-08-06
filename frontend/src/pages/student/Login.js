import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import BrandMark from '../../components/BrandMark';
import { Eye, EyeOff, Loader2, AlertCircle, Shield, Sun, Moon, Lock, ArrowRight, ShieldCheck, BadgeCheck, UserCheck, Briefcase, Megaphone, ClipboardList, Search } from 'lucide-react';

const SLIDES = [
  '/back.jpeg',
  'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&h=1600&q=90',
  '/fot-hero.jpeg',
];

const Login = () => {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [imgIdx,   setImgIdx]   = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const { login, loading, error } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await login(email, password);
      navigate(data.role === 'admin' ? '/admin' : '/dashboard');
    } catch {}
  };

  const handleImgError = () => {
    const next = imgIdx + 1;
    if (next < SLIDES.length) { setImgIdx(next); setImgLoaded(false); }
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: 'DM Sans, system-ui, sans-serif', background: 'var(--bg-page)' }}>

      {/* ── LEFT — FOT Technology Faculty image ── */}
      <div className="hidden lg:block w-[48%] relative overflow-hidden flex-shrink-0">
        {!imgLoaded && (
          <div className="absolute inset-0 animate-pulse" style={{ background: 'linear-gradient(135deg, #070d18, #0d1b2a)' }}/>
        )}
        <img
          key={imgIdx}
          src={SLIDES[imgIdx]}
          alt="Faculty of Technology, Rajarata University of Sri Lanka"
          onLoad={() => setImgLoaded(true)}
          onError={handleImgError}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ objectPosition: 'center 40%' }}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, rgba(5,10,20,0.72) 0%, rgba(8,18,35,0.55) 50%, rgba(5,10,20,0.45) 100%)' }}/>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(5,10,20,0.60) 0%, transparent 40%)' }}/>
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full pointer-events-none" style={{ background: 'rgba(201,168,76,0.09)', filter: 'blur(55px)' }}/>
        <div className="absolute -bottom-24 -right-10 w-72 h-72 rounded-full pointer-events-none" style={{ background: 'rgba(13,54,120,0.38)', filter: 'blur(55px)' }}/>

        {/* Dot pattern top-right */}
        <div className="absolute top-8 right-10 grid grid-cols-6 gap-2 opacity-30 pointer-events-none">
          {Array.from({ length: 24 }).map((_, i) => (
            <span key={i} className="w-1 h-1 rounded-full" style={{ background: '#fff' }}/>
          ))}
        </div>

        <div className="absolute inset-0 flex flex-col justify-between p-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #c9a84c, #e8c96a)' }}>
              <BrandMark size={34} />
            </div>
            <div>
              <p className="font-bold text-sm" style={{ fontFamily: 'Playfair Display, serif', color: '#ffffff', textShadow: '0 1px 6px rgba(0,0,0,0.8)' }}>FOT Student Hub</p>
              <p className="text-xs font-medium" style={{ color: 'rgba(201,168,76,0.85)', textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>Rajarata University of Sri Lanka</p>
            </div>
          </div>

          <div className="text-left">
            {/* Pill badge */}
            <div className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 mb-5"
              style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)', backdropFilter: 'blur(4px)' }}>
              <ShieldCheck size={12} style={{ color: '#e8c96a' }}/>
              <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>Secure · Official · Student Only</span>
            </div>

            <h2 className="text-4xl font-bold mb-4 leading-tight"
              style={{
                fontFamily: 'Playfair Display, serif',
                color: '#ffffff',
                textShadow: '0 2px 16px rgba(0,0,0,0.9), 0 1px 4px rgba(0,0,0,0.8)',
              }}>
              Your Campus.<br/>
              <span style={{ color: '#e8c96a', textShadow: '0 2px 16px rgba(0,0,0,0.9)' }}>Your Voice.</span>
            </h2>

            <p className="text-sm leading-relaxed mb-6"
              style={{
                color: 'rgba(255,255,255,0.80)',
                textShadow: '0 1px 8px rgba(0,0,0,0.85)',
                maxWidth: '300px',
              }}>
              A unified portal for elections, announcements, complaints &amp; lost items — built for FOT students.
            </p>

            {/* Feature grid — colored icon cards */}
            <div className="grid grid-cols-2 gap-2.5 max-w-sm">
              {[
                { Icon: Briefcase,     l: 'Online Elections', s: 'Vote your voice', bg: '#2563eb' },
                { Icon: Megaphone,     l: 'Announcements',    s: 'Stay informed',   bg: '#7c3aed' },
                { Icon: ClipboardList, l: 'Complaints',       s: 'Report & Track',  bg: '#ea580c' },
                { Icon: Search,        l: 'Lost & Found',     s: 'Find your items', bg: '#0d9488' },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2.5 rounded-xl p-2.5"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(4px)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: f.bg }}>
                    <f.Icon size={14} style={{ color: '#fff' }}/>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: 'rgba(255,255,255,0.92)' }}>{f.l}</p>
                    <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.55)' }}>{f.s}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom — Secure Login row */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}>
              <Shield size={15} style={{ color: 'rgba(255,255,255,0.75)' }}/>
            </div>
            <div>
              <p className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.85)', textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>Secure Login</p>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>Faculty of Technology · Rajarata University of Sri Lanka</p>
            </div>
          </div>
        </div>

        <div className="absolute right-0 top-16 bottom-16 w-[1.5px]" style={{ background: 'linear-gradient(to bottom, transparent, rgba(201,168,76,0.5), transparent)' }}/>
      </div>

      {/* ── RIGHT — Login Form ── */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-6 relative overflow-y-auto" style={{ background: 'var(--bg-page)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top right, rgba(21,101,216,0.05) 0%, transparent 60%)' }}/>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at bottom left, rgba(13,27,42,0.04) 0%, transparent 60%)' }}/>

        <button
          onClick={toggleTheme}
          className="theme-toggle absolute top-5 right-5 z-20"
          aria-label="Toggle theme">
          {theme === 'dark' ? <Sun size={16} style={{ color: 'var(--gold)' }}/> : <Moon size={16}/>}
        </button>

        {/* Floating card */}
        <div className="w-full max-w-sm relative z-10 rounded-3xl p-6 my-4"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', boxShadow: '0 24px 60px rgba(13,27,42,0.14), 0 4px 16px rgba(13,27,42,0.06)' }}>

          <div className="mb-4">
            <h1 className="text-2xl font-bold mb-1 leading-tight flex items-center gap-2" style={{ fontFamily: 'Playfair Display, serif', color: 'var(--text-primary)' }}>
              Welcome back <span className="inline-block" style={{ transform: 'rotate(-8deg)' }}>👋</span>
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Sign in to your FOT Student Hub account</p>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 rounded-xl p-3 mb-4"
              style={{ background: 'var(--badge-rejt-bg)', border: '1px solid var(--badge-rejt-text)20' }}>
              <AlertCircle size={15} style={{ color: 'var(--badge-rejt-text)', flexShrink: 0 }}/>
              <p className="text-sm" style={{ color: 'var(--badge-rejt-text)' }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>
                Campus Email
              </label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="yourname@tec.rjt.ac.lk"
                className="input-field text-sm"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs font-semibold transition-colors" style={{ color: 'var(--gold-dim)' }}>
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                  className="input-field pr-11 text-sm"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                  {showPwd ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 select-none cursor-pointer">
              <input type="checkbox" className="w-3.5 h-3.5 rounded" style={{ accentColor: 'var(--gold-dim)' }}/>
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Remember me</span>
            </label>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2 rounded-2xl text-sm">
              <Lock size={14}/>
              {loading && <Loader2 size={15} className="animate-spin"/>}
              {loading ? 'Signing in…' : 'Sign In'}
              {!loading && <ArrowRight size={15}/>}
            </button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="h-px flex-1" style={{ background: 'var(--border-muted)' }}/>
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>or</span>
            <div className="h-px flex-1" style={{ background: 'var(--border-muted)' }}/>
          </div>

          <button type="button"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 mb-4"
            style={{ background: 'var(--bg-muted)', color: 'var(--gold-dim)', border: '1px solid var(--border-card)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--border-card)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-muted)'}>
            <ShieldCheck size={15}/> Secure login with Faculty ID
          </button>

          <p className="text-center text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Don't have an account?{' '}
            <Link to="/register" className="font-bold transition-colors" style={{ color: 'var(--text-primary)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--gold-dim)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-primary)'}>
              Register here
            </Link>
          </p>

          {/* Trust bar */}
          <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid var(--border-muted)' }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(21,101,216,0.12)' }}>
                <Lock size={12} style={{ color: 'var(--gold-dim)' }}/>
              </div>
              <div>
                <p className="text-xs font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>100% Secure</p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Your data is protected</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(34,197,94,0.12)' }}>
                <BadgeCheck size={12} style={{ color: '#22c55e' }}/>
              </div>
              <div>
                <p className="text-xs font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>Official Portal</p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>University verified</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(236,72,153,0.12)' }}>
                <UserCheck size={12} style={{ color: '#ec4899' }}/>
              </div>
              <div>
                <p className="text-xs font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>Student First</p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Built for FOT</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
