'use client';

export function GameOverModal({ scores, bids, tricks, delta, winTeam, betAmount, isGameOver, onContinue }) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.82)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200, backdropFilter: 'blur(8px)',
    }}>
      <div style={{
        background: 'linear-gradient(160deg, #0f2014, #0a140c)',
        border: '1px solid rgba(201,168,76,0.45)',
        borderRadius: 22,
        padding: '36px 30px',
        maxWidth: 440, width: '92%',
        textAlign: 'center',
        boxShadow: '0 40px 100px rgba(0,0,0,0.8)',
        animation: 'fadeUp 0.3s ease',
      }}>
        <div style={{ fontSize: 44, marginBottom: 8 }}>
          {isGameOver ? '🏆' : '🃏'}
        </div>
        <div style={{
          fontFamily: 'Cinzel, serif',
          fontSize: 24, fontWeight: 900,
          color: 'var(--gold-light)',
          marginBottom: 6,
        }}>
          {isGameOver
            ? `Team ${winTeam === 0 ? 'A' : 'B'} Wins!`
            : 'Round Complete'}
        </div>

        {[0, 1].map(t => (
          <div key={t} style={{
            background: 'rgba(10,31,14,0.6)',
            border: '1px solid rgba(201,168,76,0.15)',
            borderRadius: 12, padding: '14px 16px',
            margin: '10px 0', textAlign: 'left',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--muted)', fontSize: 13, fontFamily: 'Cinzel, serif' }}>
                {t === 0 ? 'Team A' : 'Team B'}
              </span>
              <span style={{ fontFamily: 'Cinzel, serif', fontSize: 20, fontWeight: 900, color: 'var(--cream)' }}>
                {scores?.[t]}
              </span>
            </div>
            <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>
              Bid {bids?.[t]} · Took {tricks?.[t]} ·{' '}
              <span style={{ color: (delta?.[t] ?? 0) >= 0 ? '#6ec97a' : '#e07070', fontWeight: 700 }}>
                {(delta?.[t] ?? 0) >= 0 ? '+' : ''}{delta?.[t] ?? 0} pts
              </span>
            </div>
          </div>
        ))}

        {isGameOver && (
          <div style={{
            background: 'rgba(201,168,76,0.1)',
            border: '1px solid rgba(201,168,76,0.3)',
            borderRadius: 12, padding: '14px',
            margin: '12px 0',
          }}>
            <div style={{ color: 'var(--gold-light)', fontWeight: 700, fontSize: 15 }}>
              💰 Pot: {(betAmount * 4).toFixed(3)} tETH
            </div>
            <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
              Each winner receives +{(betAmount * 2).toFixed(3)} tETH
            </div>
          </div>
        )}

        <button onClick={onContinue} style={{
          marginTop: 8, width: '100%', padding: '14px',
          borderRadius: 12, border: 'none',
          background: 'linear-gradient(135deg, var(--gold), #a07830)',
          color: '#0a0d14',
          fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 16,
          cursor: 'pointer',
        }}>
          {isGameOver ? 'Back to Lobby' : 'Next Round →'}
        </button>
      </div>
    </div>
  );
}
