'use client';
import { useState, useEffect, useCallback } from 'react';
import { useGameSocket } from '../../hooks/useGameSocket';
import { useAuth } from '../../hooks/useAuth';
import { PlayingCard } from '../../components/game/PlayingCard';
import { TrickArea } from '../../components/game/TrickArea';
import { BiddingModal } from '../../components/game/BiddingModal';
import { ScoreBoard } from '../../components/game/ScoreBoard';
import { GameOverModal } from '../../components/game/GameOverModal';
import { GameChat } from '../../components/game/GameChat';
import { WalletButton } from '../../components/wallet/WalletButton';

const SEAT_LABELS = ['You', 'West', 'Partner', 'East'];

export default function GameTable({ onLeave }) {
  const { user, refreshUser } = useAuth();
  const {
    room, myHand, mySeat, gameEvent, chat, connected,
    joinRoom, placeBid, playCard, sendChat,
  } = useGameSocket();

  const [betAmount, setBetAmount] = useState(0.1);
  const [selectedCard, setSelectedCard] = useState(null);
  const [notification, setNotification] = useState(null);
  const [roundEndData, setRoundEndData] = useState(null);
  const [gameOverData, setGameOverData] = useState(null);
  const [lastTrick, setLastTrick] = useState(null);
  const [lastWinner, setLastWinner] = useState(null);
  const [inQueue, setInQueue] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // ── Notification helper ──
  const notify = (msg, duration = 2500) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), duration);
  };

  // ── Handle socket events ──
  useEffect(() => {
    if (!gameEvent) return;
    const { type, data } = gameEvent;

    switch (type) {
      case 'game_start':
        setGameStarted(true);
        setRoundEndData(null);
        setGameOverData(null);
        notify(`Game started! Bet: ${data.betAmount} tETH each`);
        break;

      case 'bid_placed':
        if (data.seat !== mySeat)
          notify(`${room?.players?.[data.seat]?.username} bid ${data.bid === 0 ? 'NIL' : data.bid}`);
        break;

      case 'trick_complete':
        setLastTrick(data.completedTrick);
        setLastWinner(data.winnerSeat);
        notify(`${data.winnerName} wins the trick`);
        setSelectedCard(null);
        break;

      case 'round_complete':
        setRoundEndData(data);
        break;

      case 'game_over':
        setGameOverData(data);
        refreshUser();
        break;

      case 'error':
        notify(`⚠ ${data.message}`);
        break;

      default: break;
    }
  }, [gameEvent]);

  const handleJoin = () => {
    setInQueue(true);
    joinRoom({ betAmount });
  };

  const handleCardClick = useCallback((card) => {
    if (!room || room.status !== 'playing') return;
    if (room.currentSeat !== mySeat) return;
    if (room.currentTrick?.length === 4) return;

    // Validate locally for snappy feedback
    const trick = room.currentTrick || [];
    const ledSuit = room.ledSuit;
    const spadesBroken = room.spadesBroken;

    if (trick.length === 0) {
      if (card.suit === '♠' && !spadesBroken) {
        const hasNonSpade = myHand.some(c => c.suit !== '♠');
        if (hasNonSpade) { notify('Spades not broken yet!'); return; }
      }
    } else {
      const hasSuit = myHand.some(c => c.suit === ledSuit);
      if (hasSuit && card.suit !== ledSuit) {
        notify(`Must follow suit: ${ledSuit}`); return;
      }
    }

    if (selectedCard && selectedCard.rank === card.rank && selectedCard.suit === card.suit) {
      playCard(card);
      setSelectedCard(null);
    } else {
      setSelectedCard(card);
    }
  }, [room, mySeat, myHand, selectedCard, playCard]);

  const isMyBidTurn = room?.status === 'bidding' && room?.biddingSeat === mySeat;

  // ── Lobby ──
  if (!gameStarted && !inQueue) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 28, padding: 32 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 8 }}>♠</div>
          <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 'clamp(32px, 6vw, 58px)', fontWeight: 900, color: 'var(--gold-light)', marginBottom: 8 }}>
            Crypto Spades
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 16, maxWidth: 380, margin: '0 auto' }}>
            4-player real-time Spades. Bet simulated test ETH. First to 500 points wins the pot.
          </p>
        </div>

        <div style={{ background: 'rgba(10,20,12,0.9)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: 16, padding: '22px 28px', maxWidth: 380, width: '100%' }}>
          <div style={{ color: 'var(--muted)', fontSize: 12, fontFamily: 'Cinzel, serif', letterSpacing: '0.08em', marginBottom: 14 }}>GAME SETTINGS</div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ color: 'var(--muted)', fontSize: 12, display: 'block', marginBottom: 6 }}>Bet Amount</label>
            <select value={betAmount} onChange={e => setBetAmount(Number(e.target.value))}
              style={{ width: '100%', padding: '10px 12px', background: 'rgba(10,31,14,0.8)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: 8, color: 'var(--gold-light)', fontSize: 15, fontFamily: 'Cinzel, serif', cursor: 'pointer' }}>
              {[0.01, 0.05, 0.1, 0.25, 0.5, 1.0].map(v => (
                <option key={v} value={v}>{v} tETH per player (pot: {(v * 4).toFixed(2)} tETH)</option>
              ))}
            </select>
          </div>

          <div style={{ background: 'rgba(201,168,76,0.06)', borderRadius: 8, padding: '10px 12px', marginBottom: 18, fontSize: 12, color: 'var(--muted)' }}>
            Your balance: <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{Number(user?.test_eth_balance || 0).toFixed(3)} tETH</span>
          </div>

          <button onClick={handleJoin} style={{
            width: '100%', padding: '14px',
            borderRadius: 12, border: 'none',
            background: 'linear-gradient(135deg, var(--gold), #a07830)',
            color: '#0a0d14', fontFamily: 'Cinzel, serif',
            fontWeight: 900, fontSize: 16, cursor: 'pointer',
          }}>
            Find a Game →
          </button>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <WalletButton />
          <button onClick={onLeave} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '6px 16px', color: 'var(--muted)', cursor: 'pointer', fontSize: 13 }}>
            Leaderboard
          </button>
        </div>
      </div>
    );
  }

  // ── Waiting for players ──
  if (inQueue && !gameStarted) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 20 }}>
        <div style={{ fontSize: 48, animation: 'spin 2s linear infinite' }}>♠</div>
        <div style={{ fontFamily: 'Cinzel, serif', color: 'var(--gold)', fontSize: 20 }}>Finding players…</div>
        <div style={{ color: 'var(--muted)', fontSize: 13 }}>
          {room?.players?.length || 0}/4 seats filled
        </div>
        {(room?.players || []).map(p => (
          <div key={p.seat} style={{ color: 'var(--cream)', fontSize: 13 }}>
            Seat {p.seat}: {p.username} {p.isAI ? '🤖' : '👤'}
          </div>
        ))}
      </div>
    );
  }

  // ── Game table ──
  const teamBids = [
    (room?.bids?.[0] ?? 0) + (room?.bids?.[2] ?? 0),
    (room?.bids?.[1] ?? 0) + (room?.bids?.[3] ?? 0),
  ];
  const teamTricks = [
    (room?.tricks?.[0] ?? 0) + (room?.tricks?.[2] ?? 0),
    (room?.tricks?.[1] ?? 0) + (room?.tricks?.[3] ?? 0),
  ];

  return (
    <div className="felt-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Top bar */}
      <div style={{
        padding: '10px 20px',
        borderBottom: '1px solid rgba(201,168,76,0.12)',
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'rgba(5,10,7,0.9)', backdropFilter: 'blur(8px)',
        flexWrap: 'wrap',
      }}>
        <span style={{ fontFamily: 'Cinzel, serif', color: 'var(--gold)', fontSize: 16, fontWeight: 700 }}>♠ Crypto Spades</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: connected ? '#6ec97a' : '#e07070' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
          {connected ? 'Connected' : 'Reconnecting…'}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ color: 'var(--muted)', fontSize: 12 }}>
            {Number(user?.test_eth_balance || 0).toFixed(3)} tETH
          </span>
          <WalletButton compact />
        </div>
      </div>

      {/* Main table */}
      <div style={{ flex: 1, display: 'flex', gap: 16, padding: '16px', justifyContent: 'center', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Left panel: scoreboard + chat */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }}>
          <ScoreBoard
            scores={room?.scores}
            bags={room?.bags}
            bids={teamBids}
            tricks={teamTricks}
            roundHistory={room?.roundHistory}
          />
          <GameChat messages={chat} onSend={sendChat} username={user?.username} />
        </div>

        {/* Center: game area */}
        <div style={{ flex: 1, maxWidth: 600, minWidth: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>

          {/* North (Partner) */}
          <PlayerSeat
            seat={2} room={room} mySeat={mySeat}
            faceDown cardCount={room?.hands?.[2]?.length ?? 0}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', justifyContent: 'center' }}>
            {/* West */}
            <PlayerSeat seat={1} room={room} mySeat={mySeat} faceDown vertical cardCount={room?.hands?.[1]?.length ?? 0} />

            {/* Center trick */}
            <div style={{
              background: 'rgba(5,20,8,0.5)',
              border: '1px solid rgba(201,168,76,0.1)',
              borderRadius: 16, padding: 20,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
            }}>
              <TrickArea
                trick={room?.currentTrick}
                lastTrick={lastTrick}
                lastWinner={lastWinner}
                players={room?.players}
              />
              {room?.currentSeat === mySeat && room?.status === 'playing' && (
                <div style={{ color: 'var(--gold)', fontSize: 12, fontFamily: 'Cinzel, serif', animation: 'pulse-gold 1.5s infinite' }}>
                  {selectedCard ? 'Click again to play' : 'Your turn'}
                </div>
              )}
              {room?.currentSeat !== mySeat && room?.status === 'playing' && (
                <div style={{ color: 'var(--muted)', fontSize: 12 }}>
                  {room?.players?.[room?.currentSeat]?.username} is thinking…
                </div>
              )}
              {room?.spadesBroken && (
                <div style={{ color: 'rgba(201,168,76,0.5)', fontSize: 11 }}>♠ spades broken</div>
              )}
            </div>

            {/* East */}
            <PlayerSeat seat={3} room={room} mySeat={mySeat} faceDown vertical cardCount={room?.hands?.[3]?.length ?? 0} />
          </div>

          {/* South (You) */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--muted)', fontSize: 11, marginBottom: 8, fontFamily: 'Cinzel, serif' }}>
              {SEAT_LABELS[mySeat ?? 0]} · {room?.bids?.[mySeat] != null ? (room.bids[mySeat] === 0 ? 'NIL bid' : `bid ${room.bids[mySeat]}`) : ''}
              {(room?.tricks?.[mySeat] ?? 0) > 0 ? ` · ${room.tricks[mySeat]} tricks` : ''}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, justifyContent: 'center' }}>
              {myHand.map((card, i) => {
                const isMyturn = room?.currentSeat === mySeat && room?.status === 'playing';
                const trick = room?.currentTrick || [];
                const ledSuit = room?.ledSuit;
                let isPlayable = isMyturn;
                if (isMyturn && trick.length === 0) {
                  if (card.suit === '♠' && !room?.spadesBroken && myHand.some(c => c.suit !== '♠')) isPlayable = false;
                } else if (isMyturn && trick.length > 0) {
                  if (myHand.some(c => c.suit === ledSuit) && card.suit !== ledSuit) isPlayable = false;
                }
                return (
                  <PlayingCard
                    key={`${card.rank}${card.suit}`}
                    card={card}
                    size="md"
                    selected={selectedCard?.rank === card.rank && selectedCard?.suit === card.suit}
                    disabled={!isPlayable}
                    dimmed={isMyturn && !isPlayable}
                    onClick={() => handleCardClick(card)}
                    dealDelay={i * 40}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Right panel: round info */}
        <div style={{
          background: 'rgba(10,20,12,0.85)',
          border: '1px solid rgba(201,168,76,0.15)',
          borderRadius: 12, padding: '14px 16px',
          minWidth: 150, flexShrink: 0,
          fontSize: 12,
        }}>
          <div style={{ fontFamily: 'Cinzel, serif', color: 'var(--gold)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
            Round
          </div>
          {[0, 1].map(t => (
            <div key={t} style={{ marginBottom: 12 }}>
              <div style={{ color: 'var(--muted)' }}>{t === 0 ? 'Team A' : 'Team B'}</div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'baseline', marginTop: 2 }}>
                <span style={{ fontFamily: 'Cinzel, serif', fontSize: 18, fontWeight: 900, color: 'var(--cream)' }}>
                  {teamTricks[t]}
                </span>
                <span style={{ color: 'var(--muted)' }}>/ {teamBids[t]} bid</span>
              </div>
              <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, teamBids[t] > 0 ? (teamTricks[t] / teamBids[t]) * 100 : 0)}%`,
                  background: t === 0 ? 'var(--gold)' : 'var(--blue-team)',
                  transition: 'width 0.4s ease',
                }} />
              </div>
            </div>
          ))}
          <div style={{ borderTop: '1px solid rgba(201,168,76,0.1)', paddingTop: 10, marginTop: 4 }}>
            <div style={{ color: 'var(--muted)' }}>Pot</div>
            <div style={{ color: 'var(--gold)', fontWeight: 700, fontFamily: 'Cinzel, serif' }}>
              {((room?.betAmount ?? 0) * 4).toFixed(2)} tETH
            </div>
          </div>
          <button onClick={() => { setGameStarted(false); setInQueue(false); onLeave?.(); }}
            style={{ marginTop: 12, width: '100%', padding: '6px', borderRadius: 6, border: '1px solid rgba(224,112,112,0.2)', background: 'rgba(224,112,112,0.06)', color: '#e07070', cursor: 'pointer', fontSize: 11 }}>
            Quit
          </button>
        </div>
      </div>

      {/* Notification toast */}
      {notification && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(10,31,14,0.95)', border: '1px solid rgba(201,168,76,0.4)',
          borderRadius: 24, padding: '8px 20px',
          color: 'var(--cream)', fontSize: 13,
          fontFamily: 'Cinzel, serif',
          zIndex: 300,
          animation: 'fadeUp 0.2s ease',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}>
          {notification}
        </div>
      )}

      {/* Bidding overlay */}
      {room?.status === 'bidding' && (
        <BiddingModal
          hand={myHand}
          bids={room.bids}
          myTurn={isMyBidTurn}
          onBid={placeBid}
        />
      )}

      {/* Round end */}
      {roundEndData && !gameOverData && (
        <GameOverModal
          scores={room?.scores}
          bids={teamBids}
          tricks={teamTricks}
          delta={roundEndData.delta}
          betAmount={room?.betAmount}
          isGameOver={false}
          onContinue={() => setRoundEndData(null)}
        />
      )}

      {/* Game over */}
      {gameOverData && (
        <GameOverModal
          scores={gameOverData.scores}
          bids={teamBids}
          tricks={teamTricks}
          delta={roundEndData?.delta}
          winTeam={gameOverData.winTeam}
          betAmount={gameOverData.betAmount}
          isGameOver={true}
          onContinue={() => { setGameStarted(false); setInQueue(false); setGameOverData(null); }}
        />
      )}
    </div>
  );
}

// Small helper: opponent seat display
function PlayerSeat({ seat, room, mySeat, faceDown, vertical, cardCount }) {
  const player = room?.players?.[seat];
  const isActive = room?.currentSeat === seat;
  const name = player?.username || SEAT_LABELS[seat];
  const bid = room?.bids?.[seat];
  const tricks = room?.tricks?.[seat] ?? 0;

  return (
    <div style={{ textAlign: 'center', display: 'flex', flexDirection: vertical ? 'row' : 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ fontSize: 11, color: isActive ? 'var(--gold)' : 'var(--muted)', fontFamily: 'Cinzel, serif', whiteSpace: 'nowrap' }}>
        {name}
        {bid != null && <span style={{ marginLeft: 4 }}>{bid === 0 ? '·NIL' : `·${bid}`}</span>}
        {tricks > 0 && <span style={{ marginLeft: 4, color: '#6ec97a' }}>✓{tricks}</span>}
      </div>
      <div style={{ display: 'flex', flexDirection: vertical ? 'column' : 'row', gap: 3, flexWrap: 'wrap', justifyContent: 'center', maxHeight: vertical ? 120 : 'auto', overflow: 'hidden' }}>
        {Array.from({ length: Math.min(cardCount, vertical ? 5 : 8) }, (_, i) => (
          <PlayingCard key={i} faceDown size="sm" />
        ))}
        {cardCount > (vertical ? 5 : 8) && (
          <div style={{ color: 'var(--muted)', fontSize: 11, alignSelf: 'center' }}>+{cardCount - (vertical ? 5 : 8)}</div>
        )}
      </div>
    </div>
  );
}
