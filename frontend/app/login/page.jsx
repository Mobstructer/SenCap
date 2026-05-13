'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { AuthForms } from '../../components/auth/AuthForms';
import GameTable from '../../components/game/GameTable';

export default function LoginPage() {
  const { user, loading, logout } = useAuth();
  const [view, setView] = useState('home');

  if (loading) {
    return (
      <div className="login-loading">
        <div>&spades;</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="login-shell">
        <Link className="login-home-link" href="/">
          &larr; Home
        </Link>
        <div className="login-brand">
          <div className="login-spade">&spades;</div>
          <h1>Crypto Spades</h1>
          <p>Sign in to join the table</p>
        </div>
        <AuthForms />
      </div>
    );
  }

  if (view === 'game') {
    return <GameTable onLeave={() => setView('home')} />;
  }

  return (
    <div className="dashboard-shell">
      <Link className="login-home-link" href="/">
        &larr; Home
      </Link>

      <div className="dashboard-brand">
        <div>&spades;</div>
        <h1>Crypto Spades</h1>
        <p>
          Welcome back, <span>{user.username}</span>
        </p>
      </div>

      <div className="dashboard-stats" aria-label="Player stats">
        {[
          { label: 'Wins', value: user.wins },
          { label: 'Losses', value: user.losses },
          { label: 'ELO', value: user.elo },
        ].map(stat => (
          <div key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </div>

      <div className="dashboard-balance">
        Balance:{' '}
        <span>{Number(user.test_eth_balance || 0).toFixed(3)} tETH</span>
      </div>

      <button className="dashboard-play-button" onClick={() => setView('game')}>
        Play Now <span aria-hidden="true">&rarr;</span>
      </button>

      <button className="dashboard-signout-button" onClick={logout}>
        Sign Out
      </button>
    </div>
  );
}
