'use client';
import { useState } from 'react';
import { PlayingCard } from './PlayingCard';

export function BiddingModal({ hand = [], onBid, bids = [], myTurn }) {
  const [selected, setSelected] = useState(null);

  if (!myTurn) {
    return (
      <div style={overlay}>
        <div style={panel}>
          <div style={title}>Waiting for bids...</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[0,1,2,3].map(seat => bids[seat] !== null && bids[seat] !== undefined ? (
              <div key={seat} style={bidChip}>
                <span style={{ color: 'var(--muted)', fontSize: 11 }}>Seat {seat}</span>
                <span style={{ color: 'var(--gold)', fontWeight: 700 }}>
                  {bids[seat] === 0 ? 'NIL' : bids[seat]}
                </span>
              </div>
            ) : null)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={overlay}>
      <div style={panel}>
        <div style={title}>Place Your Bid</div>
        <p style={{ color: 'var(--muted)', fontSize: 14, textAlign: 'center', marginBottom: 20 }}>
          How many tricks will you win this round?
        </p>

        {/* Hand preview */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center', marginBottom: 20 }}>
          {hand.map((card, i) => (
            <PlayingCard key={`${card.rank}${card.suit}`} card={card} size="sm" dealDelay={i * 30} />
          ))}
        </div>

        {/* Bid grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 16 }}>
          {Array.from({ length: 14 }, (_, i) => (
            <button key={i} onClick={() => setSelected(i)} style={{
              padding: '10px 4px',
              borderRadius: 8,
              border: `2px solid ${selected === i ? 'var(--gold)' : 'rgba(201,168,76,0.2)'}`,
              background: selected === i ? 'rgba(201,168,76,0.2)' : 'rgba(10,31,14,0.6)',
              color: selected === i ? 'var(--gold-light)' : 'var(--cream)',
              cursor: 'pointer',
              fontFamily: 'Cinzel, serif',
              fontWeight: 700,
              fontSize: 14,
              transition: 'all 0.12s',
            }}>
              {i === 0 ? 'NIL' : i}
            </button>
          ))}
        </div>

        {selected === 0 && (
          <p style={{ color: '#e88', fontSize: 13, textAlign: 'center', marginBottom: 12 }}>
            ⚠ Nil bid: +100 pts if you take 0 tricks, −100 if you take any
          </p>
        )}

        <button
          onClick={() => selected !== null && onBid(selected)}
          disabled={selected === null}
          style={{
            width: '100%', padding: '14px',
            borderRadius: 10, border: 'none',
            background: selected !== null
              ? 'linear-gradient(135deg, var(--gold), #a07830)'
              : 'rgba(255,255,255,0.06)',
            color: selected !== null ? '#0a0d14' : 'var(--muted)',
            cursor: selected !== null ? 'pointer' : 'default',
            fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 16,
            transition: 'all 0.2s',
          }}
        >
          {selected === null ? 'Select a bid' : `Confirm: ${selected === 0 ? 'NIL' : selected} tricks`}
        </button>
      </div>
    </div>
  );
}

const overlay = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.78)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 100, backdropFilter: 'blur(6px)',
};
const panel = {
  background: 'linear-gradient(160deg, #0f2014, #0a1a0e)',
  border: '1px solid rgba(201,168,76,0.35)',
  borderRadius: 20,
  padding: '32px 28px',
  maxWidth: 480, width: '92%',
  boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
};
const title = {
  fontFamily: 'Cinzel, serif', fontWeight: 900,
  fontSize: 22, textAlign: 'center',
  color: 'var(--gold-light)', marginBottom: 6,
};
const bidChip = {
  background: 'rgba(10,31,14,0.8)',
  border: '1px solid rgba(201,168,76,0.2)',
  borderRadius: 8, padding: '6px 12px',
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
};
