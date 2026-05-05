'use client';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { AuthForms } from '../components/auth/AuthForms';
import GameTable from '../components/game/GameTable';

export default function HomePage() {
  const { user, loading, logout } = useAuth();
  const [view, setView] = useState('home'); // home | game | leaderboard

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ fontSize: 48, animation: 'spin 2s linear infinite', color: 'var(--gold)' }}>♠</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 24, padding: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 56 }}>♠</div>
          <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 900, color: 'var(--gold-light)', margin: '8px 0 4px' }}>
            Crypto Spades
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>Sign in to join the table</p>
        </div>
        <AuthForms />
      </div>
    );
  }

  if (view === 'game') {
    return <GameTable onLeave={() => setView('home')} />;
  }

  // Home dashboard
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 52 }}>♠</div>
        <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 'clamp(28px,5vw,48px)', fontWeight: 900, color: 'var(--gold-light)', margin: '8px 0 4px' }}>
          Crypto Spades
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>
          Welcome back, <span style={{ color: 'var(--gold)' }}>{user.username}</span>
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, maxWidth: 360, width: '100%' }}>
        {[
          { label: 'Wins', value: user.wins },
          { label: 'Losses', value: user.losses },
          { label: 'ELO', value: user.elo },
        ].map(s => (
          <div key={s.label} style={{
            background: 'rgba(10,20,12,0.85)', border: '1px solid rgba(201,168,76,0.15)',
            borderRadius: 12, padding: '14px', textAlign: 'center',
          }}>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 22, fontWeight: 900, color: 'var(--cream)' }}>{s.value}</div>
            <div style={{ color: 'var(--muted)', fontSize: 11, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'rgba(10,20,12,0.85)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 12, padding: '12px 20px', fontSize: 13 }}>
        Balance: <span style={{ color: 'var(--gold)', fontWeight: 700, fontFamily: 'Cinzel, serif' }}>
          {Number(user.test_eth_balance || 0).toFixed(3)} tETH
        </span>
      </div>

      <button onClick={() => setView('game')} style={{
        padding: '14px 48px', borderRadius: 14, border: 'none',
        background: 'linear-gradient(135deg, var(--gold), #a07830)',
        color: '#0a0d14', fontFamily: 'Cinzel, serif', fontWeight: 900,
        fontSize: 18, cursor: 'pointer',
        boxShadow: '0 8px 24px rgba(201,168,76,0.3)',
      }}>
        Play Now →
      </button>

      <button onClick={logout} style={{
        background: 'none', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20, padding: '6px 18px',
        color: 'var(--muted)', cursor: 'pointer', fontSize: 13,
      }}>
        Sign Out
      </button>
    </div>
  );
}
