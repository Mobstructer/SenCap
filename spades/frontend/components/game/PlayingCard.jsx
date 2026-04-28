'use client';

const SUIT_COLORS = {
  '♠': 'var(--card-black)',
  '♣': 'var(--card-black)',
  '♥': 'var(--card-red)',
  '♦': 'var(--card-red)',
};

export function PlayingCard({
  card,
  faceDown = false,
  selected = false,
  disabled = false,
  dimmed = false,
  onClick,
  size = 'md',
  dealDelay = 0,
}) {
  const sizes = {
    sm: { width: 42, height: 60, rankSize: 10, suitSize: 16 },
    md: { width: 62, height: 88, rankSize: 13, suitSize: 22 },
    lg: { width: 76, height: 108, rankSize: 15, suitSize: 26 },
  };
  const s = sizes[size] || sizes.md;
  const color = faceDown ? 'transparent' : SUIT_COLORS[card?.suit];
  const isClickable = !disabled && !faceDown && onClick;

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      className={dealDelay > 0 ? 'animate-deal' : ''}
      style={{
        width: s.width,
        height: s.height,
        borderRadius: 8,
        flexShrink: 0,
        cursor: isClickable ? 'pointer' : 'default',
        userSelect: 'none',
        position: 'relative',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        transform: selected ? 'translateY(-14px)' : 'translateY(0)',
        animationDelay: `${dealDelay}ms`,

        // Card face
        background: faceDown
          ? 'linear-gradient(135deg, #1a3a5c 0%, #0d1f35 50%, #1a3a5c 100%)'
          : 'var(--card-bg)',

        border: selected
          ? '2px solid var(--gold)'
          : faceDown
          ? '1px solid rgba(255,255,255,0.08)'
          : '1px solid rgba(0,0,0,0.12)',

        boxShadow: selected
          ? '0 0 0 2px var(--gold), 0 10px 24px rgba(201,168,76,0.35)'
          : '0 4px 12px rgba(0,0,0,0.45)',

        opacity: dimmed ? 0.45 : 1,
        filter: dimmed ? 'grayscale(30%)' : 'none',
      }}
    >
      {faceDown ? (
        // Card back pattern
        <div style={{
          position: 'absolute', inset: 4,
          border: '1px solid rgba(201,168,76,0.3)',
          borderRadius: 4,
          backgroundImage: 'repeating-linear-gradient(45deg, rgba(201,168,76,0.1) 0px, rgba(201,168,76,0.1) 2px, transparent 2px, transparent 8px)',
        }} />
      ) : (
        <>
          {/* Top-left rank + suit */}
          <div style={{
            position: 'absolute', top: 4, left: 5,
            color, lineHeight: 1, fontFamily: 'Cinzel, serif',
          }}>
            <div style={{ fontSize: s.rankSize, fontWeight: 700 }}>{card.rank}</div>
            <div style={{ fontSize: s.rankSize - 1 }}>{card.suit}</div>
          </div>
          {/* Center suit */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color, fontSize: s.suitSize,
          }}>
            {card.suit}
          </div>
          {/* Bottom-right (rotated) */}
          <div style={{
            position: 'absolute', bottom: 4, right: 5,
            color, lineHeight: 1, fontFamily: 'Cinzel, serif',
            transform: 'rotate(180deg)',
          }}>
            <div style={{ fontSize: s.rankSize, fontWeight: 700 }}>{card.rank}</div>
            <div style={{ fontSize: s.rankSize - 1 }}>{card.suit}</div>
          </div>
        </>
      )}
    </div>
  );
}
