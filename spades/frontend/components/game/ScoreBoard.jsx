'use client';

export function ScoreBoard({ scores = [0,0], bags = [0,0], bids = [null,null], tricks = [0,0], roundHistory = [] }) {
  const WINNING = 500;

  return (
    <div style={{
      background: 'rgba(10,20,12,0.92)',
      border: '1px solid rgba(201,168,76,0.2)',
      borderRadius: 14,
      padding: '16px 18px',
      minWidth: 190,
    }}>
      <div style={{ fontFamily: 'Cinzel, serif', color: 'var(--gold)', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
        Score
      </div>

      {[0, 1].map(t => {
        const pct = Math.min(100, Math.max(0, (scores[t] / WINNING) * 100));
        return (
          <div key={t} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <span style={{ color: 'var(--muted)', fontSize: 12 }}>
                {t === 0 ? 'Team A' : 'Team B'}
              </span>
              <span style={{ fontFamily: 'Cinzel, serif', fontSize: 22, fontWeight: 900, color: 'var(--cream)' }}>
                {scores[t]}
              </span>
            </div>
            {/* Progress bar to 500 */}
            <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${pct}%`,
                background: t === 0 ? 'var(--gold)' : '#5c7fe0',
                borderRadius: 2,
                transition: 'width 0.5s ease',
              }} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 5, fontSize: 11, color: 'var(--muted)' }}>
              {bids[t] !== null && <span>bid {bids[t]}</span>}
              {tricks[t] > 0 && <span style={{ color: '#6ec97a' }}>{tricks[t]} taken</span>}
              <span style={{ color: bags[t] >= 7 ? '#e07070' : 'var(--muted)' }}>🎒 {bags[t]}/10</span>
            </div>
          </div>
        );
      })}

      {roundHistory.length > 0 && (
        <div style={{ borderTop: '1px solid rgba(201,168,76,0.1)', paddingTop: 10, marginTop: 6 }}>
          <div style={{ color: 'var(--muted)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
            History
          </div>
          {roundHistory.slice(-5).map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '2px 0', color: 'var(--muted)' }}>
              <span>R{roundHistory.length - roundHistory.slice(-5).length + i + 1}</span>
              <span style={{ color: r.delta[0] >= 0 ? '#6ec97a' : '#e07070' }}>
                {r.delta[0] >= 0 ? '+' : ''}{r.delta[0]}
              </span>
              <span style={{ color: r.delta[1] >= 0 ? '#5c7fe0' : '#e07070' }}>
                {r.delta[1] >= 0 ? '+' : ''}{r.delta[1]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
