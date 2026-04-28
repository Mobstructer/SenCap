'use client';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

export function AuthForms({ onSuccess }) {
  const [mode, setMode] = useState('login'); // login | register
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form.username, form.email, form.password);
      }
      onSuccess?.();
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(160deg, #0f2014, #0a140c)',
      border: '1px solid rgba(201,168,76,0.3)',
      borderRadius: 20,
      padding: '36px 32px',
      maxWidth: 400, width: '92%',
    }}>
      <div style={{ fontFamily: 'Cinzel, serif', fontSize: 22, fontWeight: 900, color: 'var(--gold-light)', textAlign: 'center', marginBottom: 6 }}>
        {mode === 'login' ? 'Sign In' : 'Create Account'}
      </div>
      <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', marginBottom: 24 }}>
        {mode === 'login' ? 'Welcome back to the table' : 'Join the game'}
      </p>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {mode === 'register' && (
          <Field label="Username" value={form.username} onChange={v => set('username', v)} placeholder="your_handle" />
        )}
        <Field label="Email" type="email" value={form.email} onChange={v => set('email', v)} placeholder="you@example.com" />
        <Field label="Password" type="password" value={form.password} onChange={v => set('password', v)} placeholder="••••••••" />

        {error && (
          <div style={{ color: '#e07070', fontSize: 13, background: 'rgba(224,112,112,0.1)', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(224,112,112,0.2)' }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} style={{
          padding: '13px', borderRadius: 10, border: 'none',
          background: 'linear-gradient(135deg, var(--gold), #a07830)',
          color: '#0a0d14',
          fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 15,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
        }}>
          {loading ? 'Loading...' : mode === 'login' ? 'Enter the Table' : 'Create Account'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: 'var(--muted)' }}>
        {mode === 'login' ? "No account? " : "Already registered? "}
        <button onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); }}
          style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}>
          {mode === 'login' ? 'Register' : 'Sign in'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div>
      <label style={{ display: 'block', color: 'var(--muted)', fontSize: 12, fontFamily: 'Cinzel, serif', letterSpacing: '0.05em', marginBottom: 5 }}>
        {label.toUpperCase()}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required
        style={{
          width: '100%', padding: '10px 12px',
          background: 'rgba(10,31,14,0.6)',
          border: '1px solid rgba(201,168,76,0.2)',
          borderRadius: 8, color: 'var(--cream)',
          fontSize: 14, outline: 'none',
          fontFamily: 'Crimson Pro, serif',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => e.target.style.borderColor = 'rgba(201,168,76,0.6)'}
        onBlur={e => e.target.style.borderColor = 'rgba(201,168,76,0.2)'}
      />
    </div>
  );
}
