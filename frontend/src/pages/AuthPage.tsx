import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, type UserRole } from '../context/AuthContext';
import { Sun, Zap, ShoppingCart, ArrowRight, Eye, EyeOff, Check, Shield, Globe, BarChart3 } from 'lucide-react';

type Mode = 'login' | 'signup';

const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('buyer');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [formKey, setFormKey] = useState(0); // triggers re-animation on mode switch
  const [successPulse, setSuccessPulse] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Trigger entrance animations after mount
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const switchMode = (newMode: Mode) => {
    if (newMode === mode) return;
    setMode(newMode);
    setError('');
    setFormKey(k => k + 1); // re-trigger stagger animations
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let success: boolean;
      if (mode === 'login') {
        success = await login(email, password);
      } else {
        if (!name.trim()) { setError('Name is required'); setLoading(false); return; }
        success = await signup(name, email, password, role);
      }
      if (success) {
        setSuccessPulse(true);
        setTimeout(() => navigate('/'), 600);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Password strength
  const getPasswordStrength = () => {
    if (!password) return { level: 0, label: '', color: '' };
    if (password.length < 4) return { level: 1, label: 'Weak', color: '#EF4444' };
    if (password.length < 6) return { level: 2, label: 'Fair', color: '#F59E0B' };
    if (password.length < 8) return { level: 3, label: 'Good', color: '#3B82F6' };
    return { level: 4, label: 'Strong', color: '#00C853' };
  };
  const strength = getPasswordStrength();

  return (
    <div className={`auth-page ${mounted ? 'mounted' : ''} ${successPulse ? 'success' : ''}`}>

      {/* ── Left Branding Panel ── */}
      <div className="auth-left">
        {/* Background image layer */}
        <div className="auth-bg-image"></div>

        {/* Animated floating orbs */}
        <div className="auth-orb auth-orb-1"></div>
        <div className="auth-orb auth-orb-2"></div>
        <div className="auth-orb auth-orb-3"></div>

        {/* Grid pattern overlay */}
        <div className="auth-grid-pattern"></div>

        {/* Floating energy cards */}
        <div className="auth-floating-card auth-fc-1">
          <div className="auth-fc-dot green"></div>
          <span>+12 tokens sold</span>
        </div>
        <div className="auth-floating-card auth-fc-2">
          <div className="auth-fc-dot blue"></div>
          <span>$3.20 earned</span>
        </div>
        <div className="auth-floating-card auth-fc-3">
          <div className="auth-fc-dot amber"></div>
          <span>CO₂ offset: 8.2 kg</span>
        </div>

        <div className="auth-left-content">
          <div className="auth-logo anim-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="auth-logo-icon">
              <Sun className="w-6 h-6 auth-sun-spin" />
            </div>
            <span className="auth-logo-text">Solarix</span>
          </div>

          <h1 className="auth-tagline anim-slide-up" style={{ animationDelay: '0.25s' }}>
            Power the future<br />
            with <span className="auth-highlight">clean energy</span>
          </h1>
          <p className="auth-subtitle anim-slide-up" style={{ animationDelay: '0.4s' }}>
            Join thousands of prosumers trading solar energy peer-to-peer. Affordable, transparent, and empowering.
          </p>

          <div className="auth-features anim-slide-up" style={{ animationDelay: '0.55s' }}>
            <div className="auth-feature">
              <div className="auth-feature-icon">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <div className="auth-feature-title">Trade Energy</div>
                <div className="auth-feature-desc">Buy & sell directly from your community</div>
              </div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <div className="auth-feature-title">Secure & Transparent</div>
                <div className="auth-feature-desc">Every transaction is verified and tracked</div>
              </div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <div className="auth-feature-title">Community Powered</div>
                <div className="auth-feature-desc">A global network of energy prosumers</div>
              </div>
            </div>
          </div>

          <div className="auth-stats-row anim-slide-up" style={{ animationDelay: '0.7s' }}>
            <div className="auth-stat">
              <div className="auth-stat-value">10K+</div>
              <div className="auth-stat-label">Users</div>
            </div>
            <div className="auth-stat-divider"></div>
            <div className="auth-stat">
              <div className="auth-stat-value">120K+</div>
              <div className="auth-stat-label">Tokens</div>
            </div>
            <div className="auth-stat-divider"></div>
            <div className="auth-stat">
              <div className="auth-stat-value">$250K+</div>
              <div className="auth-stat-label">Saved</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="auth-right">
        <div className="auth-right-bg"></div>
        <div className="auth-form-container anim-fade-in-right" style={{ animationDelay: '0.15s' }}>

          {/* Header with animated icon */}
          <div className="auth-form-header">
            <div className="auth-form-icon-wrap">
              <div className={`auth-form-icon ${mode === 'login' ? 'login' : 'signup'}`}>
                {mode === 'login'
                  ? <BarChart3 className="w-5 h-5" />
                  : <Zap className="w-5 h-5" />
                }
              </div>
            </div>
            <h2 className="auth-form-title" key={`title-${mode}`}>
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="auth-form-desc" key={`desc-${mode}`}>
              {mode === 'login'
                ? 'Sign in to access your dashboard and marketplace'
                : 'Choose your role and start trading clean energy'}
            </p>
          </div>

          {/* Mode Toggle with sliding indicator */}
          <div className="auth-mode-toggle">
            <div className={`auth-mode-slider ${mode === 'signup' ? 'right' : 'left'}`}></div>
            <button
              className={`auth-mode-btn ${mode === 'login' ? 'active' : ''}`}
              onClick={() => switchMode('login')}
              type="button"
            >
              Log In
            </button>
            <button
              className={`auth-mode-btn ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => switchMode('signup')}
              type="button"
            >
              Sign Up
            </button>
          </div>

          <form ref={formRef} onSubmit={handleSubmit} className="auth-form" key={formKey}>
            {/* Role Selector (signup only) */}
            {mode === 'signup' && (
              <div className="auth-role-section anim-field" style={{ animationDelay: '0.05s' }}>
                <label className="auth-label">I want to</label>
                <div className="auth-role-cards">
                  <button
                    type="button"
                    className={`auth-role-card ${role === 'seller' ? 'selected seller' : ''}`}
                    onClick={() => setRole('seller')}
                  >
                    <div className={`auth-role-card-icon ${role === 'seller' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'}`}>
                      <Zap className="w-5 h-5" />
                    </div>
                    <div className="auth-role-card-label">Sell Energy</div>
                    <div className="auth-role-card-desc">I produce solar energy and want to sell surplus</div>
                    {role === 'seller' && (
                      <div className="auth-role-check seller">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div className="auth-role-card-glow seller"></div>
                  </button>

                  <button
                    type="button"
                    className={`auth-role-card ${role === 'buyer' ? 'selected buyer' : ''}`}
                    onClick={() => setRole('buyer')}
                  >
                    <div className={`auth-role-card-icon ${role === 'buyer' ? 'bg-sky-100 text-sky-600' : 'bg-gray-100 text-gray-500'}`}>
                      <ShoppingCart className="w-5 h-5" />
                    </div>
                    <div className="auth-role-card-label">Buy Energy</div>
                    <div className="auth-role-card-desc">I want to buy clean energy at better prices</div>
                    {role === 'buyer' && (
                      <div className="auth-role-check buyer">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div className="auth-role-card-glow buyer"></div>
                  </button>
                </div>
              </div>
            )}

            {/* Name (signup only) */}
            {mode === 'signup' && (
              <div className="auth-field anim-field" style={{ animationDelay: '0.12s' }}>
                <label className="auth-label" htmlFor="auth-name">Full Name</label>
                <input
                  id="auth-name"
                  type="text"
                  className="auth-input"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <div className="auth-input-line"></div>
              </div>
            )}

            <div className="auth-field anim-field" style={{ animationDelay: mode === 'signup' ? '0.19s' : '0.05s' }}>
              <label className="auth-label" htmlFor="auth-email">Email Address</label>
              <input
                id="auth-email"
                type="email"
                className="auth-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <div className="auth-input-line"></div>
            </div>

            <div className="auth-field anim-field" style={{ animationDelay: mode === 'signup' ? '0.26s' : '0.12s' }}>
              <label className="auth-label" htmlFor="auth-password">Password</label>
              <div className="auth-input-wrapper">
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="auth-input-line"></div>

              {/* Password strength bar */}
              {password.length > 0 && (
                <div className="auth-strength">
                  <div className="auth-strength-track">
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className="auth-strength-segment"
                        style={{
                          backgroundColor: i <= strength.level ? strength.color : '#e2e8f0',
                          transition: 'background-color 0.3s ease',
                        }}
                      />
                    ))}
                  </div>
                  <span className="auth-strength-label" style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            {error && (
              <div className="auth-error anim-shake">
                <span className="auth-error-icon">!</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`auth-submit ${loading ? 'loading' : ''}`}
            >
              <span className="auth-submit-bg"></span>
              <span className="auth-submit-content">
                {loading ? (
                  <span className="auth-spinner"></span>
                ) : (
                  <>
                    {mode === 'login' ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="w-4 h-4 auth-arrow" />
                  </>
                )}
              </span>
            </button>
          </form>

          <div className="auth-footer anim-field" style={{ animationDelay: '0.35s' }}>
            {mode === 'login' ? (
              <p>Don't have an account? <button className="auth-link" onClick={() => switchMode('signup')}>Sign Up</button></p>
            ) : (
              <p>Already have an account? <button className="auth-link" onClick={() => switchMode('login')}>Log In</button></p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
