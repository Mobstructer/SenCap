import Link from 'next/link';

const gameFlow = [
  {
    step: '1',
    title: 'Login and choose a stake',
    text: 'Players sign in, connect a wallet, then choose a Sepolia ETH table size before joining a room.',
  },
  {
    step: '2',
    title: 'Take a partner seat',
    text: 'Four seats form two teams: South and North against West and East. Open rooms can fill with AI players when needed.',
  },
  {
    step: '3',
    title: 'Bid, play, score',
    text: 'Each round deals 13 cards, collects bids, resolves tricks in real time, then scores team contracts and bags.',
  },
  {
    step: '4',
    title: 'Win the pot',
    text: 'The first team to 500 points, or the team ahead when an opponent drops to -200, wins the table.',
  },
];

const mechanisms = [
  {
    title: 'Bidding',
    text: 'Every player predicts how many tricks they can take. Partner bids combine into a team contract.',
  },
  {
    title: 'Nil bids',
    text: 'A bid of zero is a high-risk play: take no tricks for +100 points, or get caught and lose 100.',
  },
  {
    title: 'Trick taking',
    text: 'Players follow the led suit when possible. The strongest card in the led suit wins unless a spade cuts it.',
  },
  {
    title: 'Spades broken',
    text: 'Spades cannot be led until someone plays a spade off-suit, unless a player only has spades left.',
  },
  {
    title: 'Bags',
    text: 'Overtricks are worth +1 point each, but every 10 accumulated bags trigger a -100 point penalty.',
  },
  {
    title: 'Escrow rails',
    text: 'When configured, the Sepolia escrow contract registers the room, accepts deposits, and pays the winning wallets.',
  },
];

export default function HomePage() {
  return (
    <main className="home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero-copy">
          <p className="home-eyebrow">Crypto Spades - by Malachi Gray</p>
          <h1 id="home-title">Crypto Spades</h1>
          <p className="home-lede">
            A competitive Spades table where classic partner play meets real-time rooms,
            wallet-connected stakes, and smart-contract payout mechanics.
          </p>

          <div className="home-actions">
            <Link className="home-primary-action" href="/login">
              Login to Play <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>

        <div className="spade-logo-wrap" aria-label="Spade playing card logo">
          <div className="spade-card spade-card-back" aria-hidden="true">
            <span>&clubs;</span>
          </div>
          <div className="spade-card spade-card-main">
            <div className="card-corner">
              <strong>A</strong>
              <span>&spades;</span>
            </div>
            <span className="spade-mark" aria-hidden="true">&spades;</span>
            <div className="card-corner card-corner-bottom">
              <strong>A</strong>
              <span>&spades;</span>
            </div>
          </div>
          <div className="logo-chip">Spade Suit</div>
        </div>
      </section>

      <section className="home-band home-band-intro" aria-labelledby="about-title">
        <div className="home-section-heading">
          <p className="home-section-kicker">Game Overview</p>
          <h2 id="about-title">Classic Spades, crypto table pressure.</h2>
        </div>
        <p className="home-section-copy">
          Crypto Spades keeps the familiar four-player structure: two partnerships,
          one shared scoreboard, and 13-card rounds built around bidding accuracy.
          The crypto layer adds table stakes, wallet identity, room records, and a
          payout mechanism for the winning team.
        </p>
      </section>

      <section className="home-band" aria-labelledby="flow-title">
        <div className="home-section-heading">
          <p className="home-section-kicker">How It Works</p>
          <h2 id="flow-title">From login to final trick.</h2>
        </div>
        <div className="flow-grid">
          {gameFlow.map(item => (
            <article className="flow-item" key={item.step}>
              <span>{item.step}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-band" aria-labelledby="mechanisms-title">
        <div className="home-section-heading">
          <p className="home-section-kicker">Mechanisms</p>
          <h2 id="mechanisms-title">The systems behind the table.</h2>
        </div>
        <div className="mechanism-grid">
          {mechanisms.map(item => (
            <article className="mechanism-card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-band payout-band" aria-labelledby="payout-title">
        <div>
          <p className="home-section-kicker">Payout Logic</p>
          <h2 id="payout-title">A four-seat pot, split by the winners.</h2>
          <p>
            Each player stakes the selected bet amount. At game end, the winning
            partnership receives the pot evenly: each winner gets twice the table
            stake, with match stats recorded for wins, losses, and ELO.
          </p>
        </div>
        <div className="payout-meter" aria-label="Four player pot split between two winning seats">
          <div className="pot-row">
            <span>Seat 0</span>
            <span>Seat 1</span>
            <span>Seat 2</span>
            <span>Seat 3</span>
          </div>
          <div className="pot-track">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="winner-row">
            <span>Winner A</span>
            <span>Winner B</span>
          </div>
        </div>
      </section>

      <section className="home-final" aria-label="Login call to action">
        <h2>Ready to take a seat?</h2>
        <Link className="home-primary-action home-primary-action-compact" href="/login">
          Go to Login <span aria-hidden="true">&rarr;</span>
        </Link>
      </section>
    </main>
  );
}
