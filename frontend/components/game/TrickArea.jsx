'use client';
import { PlayingCard } from './PlayingCard';

const SEAT_POSITIONS = {
  0: { bottom: 0,   left: '50%', transform: 'translateX(-50%)' }, // South (you)
  1: { left: 0,     top: '50%',  transform: 'translateY(-50%)' }, // West
  2: { top: 0,      left: '50%', transform: 'translateX(-50%)' }, // North (partner)
  3: { right: 0,    top: '50%',  transform: 'translateY(-50%)' }, // East
};

export function TrickArea({ trick = [], lastTrick = null, lastWinner = null, players = [] }) {
  const display = trick.length > 0 ? trick : lastTrick;

  return (
    <div style={{
      position: 'relative',
      width: 240,
      height: 180,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {/* Trick cleared label */}
      {lastTrick && trick.length === 0 && lastWinner !== null && (
        <div style={{
          position: 'absolute',
          zIndex: 10,
          background: 'rgba(10,31,14,0.92)',
          border: '1px solid var(--gold)',
          borderRadius: 20,
          padding: '4px 14px',
          fontSize: 12,
          color: 'var(--gold)',
          fontFamily: 'Cinzel, serif',
          whiteSpace: 'nowrap',
        }}>
          {players[lastWinner]?.username || `Player ${lastWinner}`} won
        </div>
      )}

      {(display || []).map(({ playerSeat, card }) => (
        <div key={playerSeat} style={{
          position: 'absolute',
          ...SEAT_POSITIONS[playerSeat],
        }}>
          <PlayingCard card={card} size="sm" />
        </div>
      ))}

      {/* Center dot */}
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        background: 'rgba(201,168,76,0.2)',
        border: '1px solid rgba(201,168,76,0.3)',
      }} />
    </div>
  );
}
