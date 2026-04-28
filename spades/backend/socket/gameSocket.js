/**
 * gameSocket.js
 * All Socket.IO game events live here.
 *
 * Event flow:
 *   join_room → room_joined / player_joined
 *   [auto-fill AI bots when 4 seats ready]
 *   game_start (broadcast)
 *   place_bid → bid_placed (broadcast)
 *   [bidding_complete when all 4 bids in]
 *   play_card → card_played (broadcast)
 *   [trick_complete → round_complete → game_over]
 */

const { v4: uuidv4 } = require('uuid');
const roomStore = require('../utils/roomStore');
const {
  dealHands, cardId, isLegalPlay, trickWinner,
  scoreRound, aiBid, aiSelectCard,
} = require('../utils/spades-engine');
const { Match, MatchPlayer, User } = require('../models');

const WINNING_SCORE = 500;
const BOT_NAMES = ['Watson', 'Ada', 'Turing'];
let botCounter = 0;

// ── Helpers ───────────────────────────────────────────────────────────────────

function safeRoom(room) {
  // Strip hand info — send each player only their own cards
  return {
    roomId: room.roomId,
    betAmount: room.betAmount,
    status: room.status,
    players: room.players,
    bids: room.bids,
    tricks: room.tricks,
    scores: room.scores,
    bags: room.bags,
    roundHistory: room.roundHistory,
    currentTrick: room.currentTrick,
    ledSuit: room.ledSuit,
    spadesBroken: room.spadesBroken,
    currentSeat: room.currentSeat,
    biddingSeat: room.biddingSeat,
  };
}

function broadcastRoom(io, room) {
  const base = safeRoom(room);
  // Send each human player their own hand
  for (const player of room.players) {
    if (!player.isAI && player.socketId) {
      io.to(player.socketId).emit('room_state', {
        ...base,
        myHand: room.hands[player.seat],
        mySeat: player.seat,
      });
    }
  }
}

function fillWithBots(room) {
  while (room.players.length < 4) {
    const seat = room.players.length;
    room.players.push({
      seat,
      userId: null,
      username: BOT_NAMES[botCounter++ % BOT_NAMES.length],
      socketId: null,
      isAI: true,
      connected: true,
    });
  }
}

function initRound(room) {
  const hands = dealHands();
  room.hands = hands;
  room.bids = [null, null, null, null];
  room.tricks = [0, 0, 0, 0];
  room.currentTrick = [];
  room.ledSuit = null;
  room.spadesBroken = false;
  room.currentSeat = 0;
  room.biddingSeat = 0;
  room.status = 'bidding';
}

// ── AI bidding / playing ───────────────────────────────────────────────────────

function processAIBids(io, room) {
  while (
    room.biddingSeat < 4 &&
    room.players[room.biddingSeat]?.isAI
  ) {
    const seat = room.biddingSeat;
    const bid = aiBid(room.hands[seat]);
    room.bids[seat] = bid;
    io.to(room.roomId).emit('bid_placed', { seat, bid });
    room.biddingSeat++;
  }

  if (room.biddingSeat >= 4) {
    room.status = 'playing';
    room.currentSeat = 0;
    broadcastRoom(io, room);
    io.to(room.roomId).emit('bidding_complete', { bids: room.bids });
    scheduleAIPlay(io, room);
  }
  roomStore.set(room.roomId, room);
}

function scheduleAIPlay(io, room) {
  if (room.status !== 'playing') return;
  const player = room.players[room.currentSeat];
  if (!player?.isAI) return;

  setTimeout(() => {
    const r = roomStore.get(room.roomId);
    if (!r || r.status !== 'playing') return;
    if (!r.players[r.currentSeat]?.isAI) return;

    const seat = r.currentSeat;
    const hand = r.hands[seat];
    if (!hand?.length) return;

    const card = aiSelectCard(hand, r.currentTrick, r.ledSuit, r.spadesBroken);
    handleCardPlay(io, r, seat, card);
  }, 800);
}

// ── Core play-card logic ───────────────────────────────────────────────────────

function handleCardPlay(io, room, seat, card) {
  const hand = room.hands[seat];
  const check = isLegalPlay(card, hand, room.currentTrick, room.ledSuit, room.spadesBroken);
  if (!check.legal) {
    const player = room.players[seat];
    if (!player.isAI && player.socketId) {
      io.to(player.socketId).emit('error', { message: check.reason });
    }
    return;
  }

  // Remove card from hand
  room.hands[seat] = hand.filter(c => cardId(c) !== cardId(card));

  // Add to trick
  if (room.currentTrick.length === 0) room.ledSuit = card.suit;
  if (card.suit === '♠') room.spadesBroken = true;
  room.currentTrick.push({ playerSeat: seat, card });

  io.to(room.roomId).emit('card_played', {
    seat,
    card,
    trickSoFar: room.currentTrick,
  });

  if (room.currentTrick.length === 4) {
    // Resolve trick
    const winnerSeat = trickWinner(room.currentTrick, room.ledSuit);
    room.tricks[winnerSeat]++;

    const completedTrick = [...room.currentTrick];
    room.currentTrick = [];
    room.ledSuit = null;
    room.currentSeat = winnerSeat;

    setTimeout(() => {
      io.to(room.roomId).emit('trick_complete', {
        winnerSeat,
        winnerName: room.players[winnerSeat].username,
        completedTrick,
        tricks: room.tricks,
      });

      // Check if round over (hands empty)
      if (room.hands[0].length === 0) {
        finishRound(io, room);
      } else {
        roomStore.set(room.roomId, room);
        broadcastRoom(io, room);
        scheduleAIPlay(io, room);
      }
    }, 900);
  } else {
    room.currentSeat = (seat + 1) % 4;
    roomStore.set(room.roomId, room);
    broadcastRoom(io, room);
    scheduleAIPlay(io, room);
  }
}

// ── Round / game finish ───────────────────────────────────────────────────────

function finishRound(io, room) {
  const { delta, newBags, bagPenalty } = scoreRound(room.bids, room.tricks, room.bags);

  room.scores[0] += delta[0];
  room.scores[1] += delta[1];
  room.bags = newBags;
  room.roundHistory.push({ delta, bids: [...room.bids], tricks: [...room.tricks] });

  io.to(room.roomId).emit('round_complete', {
    delta,
    scores: room.scores,
    bags: room.bags,
    bids: room.bids,
    tricks: room.tricks,
    bagPenalty,
  });

  const gameOver =
    room.scores[0] >= WINNING_SCORE ||
    room.scores[1] >= WINNING_SCORE ||
    room.scores[0] <= -200 ||
    room.scores[1] <= -200;

  if (gameOver) {
    room.status = 'finished';
    const winTeam = room.scores[0] > room.scores[1] ? 0 : 1;
    io.to(room.roomId).emit('game_over', {
      winTeam,
      scores: room.scores,
      betAmount: room.betAmount,
    });
    persistGameResult(room, winTeam);
  } else {
    roomStore.set(room.roomId, room);
    setTimeout(() => {
      const r = roomStore.get(room.roomId);
      if (!r || r.status === 'finished') return;
      initRound(r);
      broadcastRoom(io, r);
      io.to(r.roomId).emit('round_start', { round: r.roundHistory.length + 1 });
      roomStore.set(r.roomId, r);
      processAIBids(io, r);
    }, 3000);
  }
}

async function persistGameResult(room, winTeam) {
  try {
    const match = await Match.findOne({ where: { room_id: room.roomId } });
    if (!match) return;

    await match.update({
      status: 'finished',
      winning_team: winTeam,
      team_a_score: room.scores[0],
      team_b_score: room.scores[1],
      rounds_played: room.roundHistory.length,
      finished_at: new Date(),
    });

    const winnerSeats = winTeam === 0 ? [0, 2] : [1, 3];
    const loserSeats = winTeam === 0 ? [1, 3] : [0, 2];
    const payout = parseFloat(room.betAmount) * 2;

    for (const player of room.players) {
      if (player.isAI || !player.userId) continue;
      const isWinner = winnerSeats.includes(player.seat);
      const ethDelta = isWinner ? payout : -parseFloat(room.betAmount);

      await MatchPlayer.update(
        { result: isWinner ? 'win' : 'loss', eth_delta: ethDelta },
        { where: { match_id: match.id, user_id: player.userId } }
      );

      await User.increment(
        {
          wins: isWinner ? 1 : 0,
          losses: isWinner ? 0 : 1,
          total_matches: 1,
          elo: isWinner ? 25 : -20,
          test_eth_balance: ethDelta,
        },
        { where: { id: player.userId } }
      );
    }
  } catch (err) {
    console.error('Failed to persist game result:', err);
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

module.exports = function registerGameSocket(io, socket) {
  // join_room: { betAmount?, roomId? }
  socket.on('join_room', async ({ betAmount = 0.1, roomId: requestedRoom } = {}) => {
    try {
      const user = socket.user;

      // Leave any existing room
      const existing = roomStore.findByUser(user.id);
      if (existing) {
        socket.leave(existing.roomId);
        roomStore.update(existing.roomId, r => {
          r.players = r.players.map(p =>
            p.userId === user.id ? { ...p, connected: false } : p
          );
          return r;
        });
      }

      // Find or create room
      let room = requestedRoom
        ? roomStore.get(requestedRoom)
        : roomStore.findOpen(betAmount);

      if (!room) {
        const newRoomId = uuidv4();
        room = {
          roomId: newRoomId,
          matchId: null,
          betAmount,
          status: 'waiting',
          players: [],
          hands: [[], [], [], []],
          bids: [null, null, null, null],
          tricks: [0, 0, 0, 0],
          scores: [0, 0],
          bags: [0, 0],
          roundHistory: [],
          currentTrick: [],
          ledSuit: null,
          spadesBroken: false,
          currentSeat: 0,
          biddingSeat: 0,
        };
        roomStore.set(newRoomId, room);
      }

      // Assign seat
      const seat = room.players.length;
      room.players.push({
        seat,
        userId: user.id,
        username: user.username,
        socketId: socket.id,
        isAI: false,
        connected: true,
      });

      socket.join(room.roomId);
      socket.roomId = room.roomId;

      socket.emit('room_joined', {
        ...safeRoom(room),
        myHand: [],
        mySeat: seat,
      });

      io.to(room.roomId).emit('player_joined', {
        seat,
        username: user.username,
        playerCount: room.players.filter(p => !p.isAI).length,
      });

      // Deduct bet from balance
      await User.decrement('test_eth_balance', {
        by: betAmount,
        where: { id: user.id },
      });

      // Start if 4 players (or fill with AI)
      if (room.players.length >= 2) { // auto-fill for demo
        if (room.players.length < 4) fillWithBots(room);

        // Persist match
        const match = await Match.create({
          room_id: room.roomId,
          bet_amount: betAmount,
          status: 'bidding',
          started_at: new Date(),
        });
        room.matchId = match.id;

        for (const p of room.players) {
          if (!p.isAI) {
            await MatchPlayer.create({
              match_id: match.id,
              user_id: p.userId,
              seat: p.seat,
              team: p.seat % 2 === 0 ? 0 : 1,
            });
          }
        }

        initRound(room);
        roomStore.set(room.roomId, room);
        broadcastRoom(io, room);
        io.to(room.roomId).emit('game_start', {
          players: room.players.map(p => ({ seat: p.seat, username: p.username, isAI: p.isAI })),
          betAmount: room.betAmount,
        });
        processAIBids(io, room);
      } else {
        roomStore.set(room.roomId, room);
      }
    } catch (err) {
      console.error('join_room error:', err);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // place_bid: { bid: number }
  socket.on('place_bid', ({ bid }) => {
    const room = roomStore.get(socket.roomId);
    if (!room || room.status !== 'bidding') return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player || player.seat !== room.biddingSeat) return;
    if (typeof bid !== 'number' || bid < 0 || bid > 13) return;

    room.bids[player.seat] = bid;
    io.to(room.roomId).emit('bid_placed', { seat: player.seat, bid });
    room.biddingSeat++;
    roomStore.set(room.roomId, room);

    processAIBids(io, room);
  });

  // play_card: { card: { suit, rank } }
  socket.on('play_card', ({ card }) => {
    const room = roomStore.get(socket.roomId);
    if (!room || room.status !== 'playing') return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player || player.seat !== room.currentSeat) return;

    handleCardPlay(io, room, player.seat, card);
  });

  // chat
  socket.on('chat_message', ({ message }) => {
    if (!message || message.length > 200) return;
    const room = roomStore.get(socket.roomId);
    if (!room) return;
    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) return;
    io.to(room.roomId).emit('chat_message', {
      username: player.username,
      message: message.trim(),
      timestamp: Date.now(),
    });
  });

  socket.on('disconnect', () => {
    if (!socket.roomId) return;
    roomStore.update(socket.roomId, r => {
      r.players = r.players.map(p =>
        p.socketId === socket.id ? { ...p, connected: false } : p
      );
      return r;
    });
    io.to(socket.roomId).emit('player_disconnected', { socketId: socket.id });
  });
};
