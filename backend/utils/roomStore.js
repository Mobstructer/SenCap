/**
 * roomStore.js
 * In-memory store for active game rooms.
 * In production: replace with Redis for horizontal scaling.
 */

const rooms = new Map();

/**
 * Room shape:
 * {
 *   roomId: string,
 *   matchId: number | null,
 *   betAmount: number,
 *   status: 'waiting' | 'bidding' | 'playing' | 'finished',
 *   players: [
 *     { seat: 0-3, userId, username, socketId, isAI, connected } x4
 *   ],
 *   hands: [[card, ...] x4],          // private per player
 *   bids: [null|number x4],
 *   tricks: [number x4],              // tricks won this round
 *   scores: [number, number],         // team totals
 *   bags: [number, number],
 *   roundHistory: [{ delta, bids, tricks } ...],
 *   currentTrick: [{ playerSeat, card } ...],
 *   ledSuit: string | null,
 *   spadesBroken: boolean,
 *   currentSeat: number,
 *   biddingSeat: number,
 * }
 */

const store = {
  get: (roomId) => rooms.get(roomId) || null,

  set: (roomId, room) => rooms.set(roomId, room),

  delete: (roomId) => rooms.delete(roomId),

  all: () => [...rooms.values()],

  // Find a room the user is currently in
  findByUser: (userId) => {
    for (const room of rooms.values()) {
      if (room.players.some(p => p.userId === userId)) return room;
    }
    return null;
  },

  // Find an open waiting room
  findOpen: (betAmount) => {
    for (const room of rooms.values()) {
      if (
        room.status === 'waiting' &&
        room.betAmount === betAmount &&
        room.players.filter(p => !p.isAI).length < 4
      ) return room;
    }
    return null;
  },

  update: (roomId, updater) => {
    const room = rooms.get(roomId);
    if (!room) return null;
    const updated = updater(room);
    rooms.set(roomId, updated);
    return updated;
  },
};

module.exports = store;
