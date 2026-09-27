/**
 * LoginPage.jsx — User ID verification + registration modal
 */
import { useState } from 'react';
import { getUser, createUser } from '../api.js';

export default function LoginPage({ onLogin }) {
  const [userId,       setUserId]       = useState('');
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');

  // Registration modal state
  const [showModal,    setShowModal]    = useState(false);
  const [regName,      setRegName]      = useState('');
  const [regLoading,   setRegLoading]   = useState(false);
  const [regError,     setRegError]     = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    const uid = parseInt(userId, 10);
    if (!uid || uid < 1) { setError('Please enter a valid numeric User ID.'); return; }
    setError('');
    setLoading(true);
    try {
      const { data } = await getUser(uid);
      onLogin(data);
    } catch (err) {
      if (err.response?.status === 404) {
        setShowModal(true);
      } else {
        setError(err.response?.data?.detail || 'Unable to reach server. Is the backend running?');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regName.trim()) { setRegError('Name cannot be empty.'); return; }
    setRegError('');
    setRegLoading(true);
    try {
      const { data } = await createUser(regName.trim());
      onLogin(data);
    } catch (err) {
      setRegError(err.response?.data?.detail || 'Registration failed. Try again.');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Ambient orbs */}
      <div className="orb orb-1" aria-hidden="true" />
      <div className="orb orb-2" aria-hidden="true" />
      <div className="orb orb-3" aria-hidden="true" />

      <main className="login-center">
        {/* Logo / brand */}
        <div className="brand" aria-label="PaperTrade logo">
          <div className="brand-icon">📈</div>
          <h1 className="brand-name">PaperTrade</h1>
          <p className="brand-tagline">Real-Time Crypto Paper Trading</p>
        </div>

        {/* Login card */}
        <div className="glass login-card">
          <h2 className="login-title">Welcome back</h2>
          <p className="login-sub">Enter your User ID to access your portfolio</p>

          <form onSubmit={handleLogin} id="login-form" noValidate>
            <div className="form-group mt-4">
              <label htmlFor="user-id-input" className="label">User ID</label>
              <input
                id="user-id-input"
                type="number"
                className="input input-mono"
                placeholder="e.g. 1001"
                value={userId}
                onChange={(e) => { setUserId(e.target.value); setError(''); }}
                min="1"
                autoFocus
                autoComplete="off"
              />
            </div>

            {error && (
              <p className="form-error mt-2" role="alert">{error}</p>
            )}

            <button
              id="login-submit-btn"
              type="submit"
              className="btn btn-primary btn-lg mt-4"
              style={{ width: '100%' }}
              disabled={loading || !userId}
            >
              {loading ? <><span className="spinner" /> Checking…</> : 'Access Dashboard →'}
            </button>
          </form>

          <div className="divider" />
          <p className="text-secondary" style={{ fontSize: 13, textAlign: 'center' }}>
            Don&rsquo;t have an account?{' '}
            <button
              id="open-register-btn"
              className="link-btn"
              onClick={() => setShowModal(true)}
              type="button"
            >
              Create one free
            </button>
          </p>
        </div>

        {/* Features row */}
        <div className="features-row">
          {[
            { icon: '⚡', label: 'Live Prices', desc: 'Binance real-time feeds' },
            { icon: '🔒', label: 'Safe Trading', desc: 'Paper money, zero risk'  },
            { icon: '📊', label: 'Analytics',   desc: 'Track profitable trades'  },
          ].map((f) => (
            <div key={f.label} className="feature-chip">
              <span className="feature-icon">{f.icon}</span>
              <div>
                <div className="feature-label">{f.label}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Registration Modal */}
      {showModal && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="modal-box">
            <h2 id="modal-title" style={{ fontSize: 22, marginBottom: 6 }}>Create Account</h2>
            <p className="text-secondary" style={{ fontSize: 14 }}>
              User ID not found. Enter your name to register a new account with{' '}
              <strong className="text-green">$10,000</strong> paper balance.
            </p>

            <form onSubmit={handleRegister} id="register-form" noValidate>
              <div className="form-group mt-4">
                <label htmlFor="reg-name-input" className="label">Your Name</label>
                <input
                  id="reg-name-input"
                  type="text"
                  className="input"
                  placeholder="e.g. Jane Smith"
                  value={regName}
                  onChange={(e) => { setRegName(e.target.value); setRegError(''); }}
                  autoFocus
                  autoComplete="off"
                />
              </div>

              {regError && (
                <p className="form-error mt-2" role="alert">{regError}</p>
              )}

              <div className="flex gap-3 mt-4">
                <button
                  id="register-cancel-btn"
                  type="button"
                  className="btn btn-ghost"
                  style={{ flex: 1 }}
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  id="register-submit-btn"
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 2 }}
                  disabled={regLoading || !regName.trim()}
                >
                  {regLoading ? <><span className="spinner" /> Creating…</> : 'Create & Enter →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          padding: 24px;
        }
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          opacity: 0.18;
        }
        .orb-1 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, #3b82f6, transparent);
          top: -100px; left: -100px;
        }
        .orb-2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, #22c55e, transparent);
          bottom: -80px; right: -80px;
        }
        .orb-3 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, #8b5cf6, transparent);
          top: 50%; left: 60%;
          transform: translate(-50%, -50%);
        }
        .login-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 32px;
          width: 100%;
          max-width: 460px;
          position: relative;
          z-index: 2;
        }
        .brand { text-align: center; }
        .brand-icon {
          font-size: 52px;
          display: block;
          margin-bottom: 8px;
          filter: drop-shadow(0 0 20px rgba(59,130,246,0.6));
        }
        .brand-name {
          font-size: 36px;
          font-weight: 900;
          background: linear-gradient(135deg, #60a5fa, #34d399);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.5px;
        }
        .brand-tagline {
          font-size: 14px;
          color: var(--text-muted);
          margin-top: 4px;
        }
        .login-card {
          width: 100%;
          padding: 36px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05);
        }
        .login-title  { font-size: 22px; margin-bottom: 4px; }
        .login-sub    { font-size: 13px; color: var(--text-secondary); }
        .form-group   { display: flex; flex-direction: column; }
        .form-error   { font-size: 13px; color: var(--red); }
        .link-btn {
          background: none; border: none; cursor: pointer;
          color: var(--accent); font-weight: 600; font-size: inherit;
          padding: 0; text-decoration: underline; text-underline-offset: 2px;
        }
        .link-btn:hover { color: #60a5fa; }
        .features-row {
          display: flex;
          gap: 12px;
          width: 100%;
          flex-wrap: wrap;
          justify-content: center;
        }
        .feature-chip {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 18px;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          flex: 1;
          min-width: 130px;
          transition: background 0.2s;
        }
        .feature-chip:hover { background: rgba(255,255,255,0.07); }
        .feature-icon { font-size: 20px; }
        .feature-label { font-size: 13px; font-weight: 600; }
        .feature-desc  { font-size: 11px; color: var(--text-muted); }
      `}</style>
    </div>
  );
}
