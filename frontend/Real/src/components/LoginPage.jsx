/**
 * LoginPage.jsx — Authentication & User Registration flow
 */
import { useState } from 'react';
import { getUser, createUser } from '../api.js';

export default function LoginPage({ onLogin }) {
  const [userId, setUserId] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState('ENTER_ID'); // 'ENTER_ID' | 'ENTER_NAME'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    const uid = parseInt(userId, 10);
    if (!uid || uid < 1) {
      setError('Please enter a valid numeric User ID.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { data } = await getUser(uid);
      onLogin(data);
    } catch (err) {
      if (err.response?.status === 404) {
        setMode('ENTER_NAME');
        setError('');
      } else {
        setError(err.response?.data?.detail || 'Unable to reach server. Is the backend running?');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please enter your name.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { data } = await createUser(trimmedName);
      onLogin(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      <main className="login-center">

        {/* Card */}
        <div className="glass login-card">
          {mode === 'ENTER_ID' ? (
            <>
              <h2 className="login-title">Sign In</h2>
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
                  {loading ? <><span className="spinner" /> Verifying…</> : 'Submit'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="login-title">ID Not Found</h2>
              <p className="login-sub">
                User ID <strong style={{ color: 'var(--accent)' }}>#{userId}</strong> was not found in records. Enter your name to generate your account with <strong style={{ color: 'var(--green)' }}>$10,000</strong> starting balance.
              </p>

              <form onSubmit={handleRegister} id="register-form" noValidate>
                <div className="form-group mt-4">
                  <label htmlFor="user-name-input" className="label">Your Name</label>
                  <input
                    id="user-name-input"
                    type="text"
                    className="input"
                    placeholder="e.g. Alex Morgan"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setError(''); }}
                    autoFocus
                    autoComplete="off"
                  />
                </div>

                {error && (
                  <p className="form-error mt-2" role="alert">{error}</p>
                )}

                <button
                  id="register-submit-btn"
                  type="submit"
                  className="btn btn-primary btn-lg mt-4"
                  style={{ width: '100%' }}
                  disabled={loading || !name.trim()}
                >
                  {loading ? <><span className="spinner" /> Creating Account…</> : 'Create Account & Enter →'}
                </button>

                <button
                  type="button"
                  className="link-btn mt-3"
                  style={{ display: 'block', margin: '16px auto 0' }}
                  onClick={() => { setMode('ENTER_ID'); setError(''); }}
                >
                  ← Try another User ID
                </button>
              </form>
            </>
          )}
        </div>
      </main>

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
          filter: blur(90px);
          pointer-events: none;
          opacity: 0.22;
        }
        .login-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 32px;
          width: 100%;
          max-width: 440px;
          position: relative;
          z-index: 2;
        }
        .login-card {
          width: 100%;
          padding: 36px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          box-shadow: 0 25px 70px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06);
        }
        .login-title  { font-size: 22px; margin-bottom: 4px; color: var(--text-primary); }
        .login-sub    { font-size: 13px; color: var(--text-secondary); line-height: 1.5; }
        .form-group   { display: flex; flex-direction: column; }
        .form-error   { font-size: 13px; color: var(--red); }
        .link-btn {
          background: none; border: none; cursor: pointer;
          color: var(--text-secondary); font-weight: 500; font-size: 13px;
          padding: 0; text-decoration: underline; text-underline-offset: 3px;
          transition: color 0.2s;
        }
        .link-btn:hover { color: var(--accent); }
      `}</style>
    </div>
  );
}
