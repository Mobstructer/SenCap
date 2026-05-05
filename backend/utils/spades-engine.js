/**
 * spades-engine.js
 * Pure game logic for Spades — no DB, no sockets.
 * All functions are deterministic and side-effect free.
 */

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const RANK_VAL = Object.fromEntries(RANKS.map((r, i) => [r, i]));

// ── Deck ──────────────────────────────────────────────────────────────────────

function buildDeck() {
  const deck = [];
  for (const suit of SUITS) for (const rank of RANKS) deck.push({ suit, rank });
  return deck;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function dealHands() {
  const deck = shuffle(buildDeck());
  const hands = [[], [], [], []];
  deck.forEach((card, i) => hands[i % 4].push(card));
  hands.forEach(hand => hand.sort((a, b) =>
    a.suit.localeCompare(b.suit) || RANK_VAL[b.rank] - RANK_VAL[a.rank]
  ));
  return hands;
}

// ── Card helpers ──────────────────────────────────────────────────────────────

const cardId = (c) => `${c.rank}${c.suit}`;
const isSpade = (c) => c.suit === '♠';
const cardValue = (c) => RANK_VAL[c.rank];

function beatsCard(challenger, champion, ledSuit) {
  if (isSpade(challenger) && !isSpade(champion)) return true;
  if (!isSpade(challenger) && isSpade(champion)) return false;
  if (challenger.suit === champion.suit) return cardValue(challenger) > cardValue(champion);
  return false;
}

function trickWinner(trick, ledSuit) {
  let bestIdx = 0;
  for (let i = 1; i < trick.length; i++) {
    if (beatsCard(trick[i].card, trick[bestIdx].card, ledSuit)) bestIdx = i;
  }
  return trick[bestIdx].playerSeat;
}

// ── Validation ────────────────────────────────────────────────────────────────

function isLegalPlay(card, hand, trick, ledSuit, spadesBroken) {
  // Leading a trick
  if (trick.length === 0) {
    if (isSpade(card) && !spadesBroken) {
      const hasNonSpade = hand.some(c => !isSpade(c));
      if (hasNonSpade) return { legal: false, reason: 'Spades not broken yet' };
    }
    return { legal: true };
  }
  // Following
  const hasSuit = hand.some(c => c.suit === ledSuit);
  if (hasSuit && card.suit !== ledSuit) {
    return { legal: false, reason: `Must follow suit: ${ledSuit}` };
  }
  return { legal: true };
}

// ── Scoring ───────────────────────────────────────────────────────────────────

/**
 * Calculate round scores for both teams.
 * Returns { delta: [teamA, teamB], newBags: [teamA, teamB], bagPenalty: [bool, bool] }
 */
function scoreRound(bids, tricksWon, bagTotals) {
  const delta = [0, 0];
  const newBags = [...bagTotals];
  const bagPenalty = [false, false];

  for (let team = 0; team < 2; team++) {
    const seats = team === 0 ? [0, 2] : [1, 3];

    // Nil scoring (before team bid math)
    for (const seat of seats) {
      if (bids[seat] === 0) {
        delta[team] += tricksWon[seat] === 0 ? 100 : -100;
      }
    }

    // Team bid (excluding nil bidders)
    const teamBid = seats.reduce((s, seat) => s + (bids[seat] > 0 ? bids[seat] : 0), 0);
    const teamTricks = seats.reduce((s, seat) => s + (bids[seat] > 0 ? tricksWon[seat] : 0), 0);

    if (teamBid > 0) {
      if (teamTricks >= teamBid) {
        delta[team] += teamBid * 10;
        const bags = teamTricks - teamBid;
        newBags[team] += bags;
        delta[team] += bags; // overtrick bonus
        if (newBags[team] >= 10) {
          delta[team] -= 100;
          newBags[team] -= 10;
          bagPenalty[team] = true;
        }
      } else {
        delta[team] -= teamBid * 10;
      }
    }
  }

  return { delta, newBags, bagPenalty };
}

// ── AI ────────────────────────────────────────────────────────────────────────

function aiBid(hand) {
  let bid = 0;
  for (const c of hand) {
    if (isSpade(c)) {
      if (cardValue(c) >= RANK_VAL['Q']) bid += 1;
      else if (cardValue(c) >= RANK_VAL['9']) bid += 0.5;
    } else {
      if (cardValue(c) === RANK_VAL['A']) bid += 1;
      else if (cardValue(c) === RANK_VAL['K']) bid += 0.5;
    }
  }
  return Math.max(1, Math.round(bid));
}

function aiSelectCard(hand, trick, ledSuit, spadesBroken) {
  // Build legal plays
  let legal;
  if (trick.length === 0) {
    if (!spadesBroken && hand.some(c => !isSpade(c))) {
      legal = hand.filter(c => !isSpade(c));
    } else {
      legal = [...hand];
    }
  } else {
    const hasSuit = hand.some(c => c.suit === ledSuit);
    legal = hasSuit ? hand.filter(c => c.suit === ledSuit) : [...hand];
  }

  if (!legal.length) return hand[0];

  // Find current winning card in trick
  if (trick.length > 0) {
    const currentBest = trick.reduce(
      (best, t) => beatsCard(t.card, best, ledSuit) ? t.card : best,
      trick[0].card
    );
    const winning = legal.filter(c => beatsCard(c, currentBest, ledSuit));
    if (winning.length) {
      // Play cheapest winner
      return winning.sort((a, b) => cardValue(a) - cardValue(b))[0];
    }
  }

  // Dump lowest non-spade, else lowest spade
  const nonSpade = legal.filter(c => !isSpade(c));
  if (nonSpade.length) return nonSpade.sort((a, b) => cardValue(a) - cardValue(b))[0];
  return legal.sort((a, b) => cardValue(a) - cardValue(b))[0];
}

module.exports = {
  buildDeck, shuffle, dealHands,
  cardId, isSpade, cardValue,
  beatsCard, trickWinner,
  isLegalPlay, scoreRound,
  aiBid, aiSelectCard,
  SUITS, RANKS, RANK_VAL,
};
