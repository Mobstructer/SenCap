// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title SpadesEscrow
 * @notice Holds Sepolia test-ETH for a 4-player Spades game.
 *
 * Flow:
 *   1. Backend calls createGame(roomId, [addr0,addr1,addr2,addr3], betAmount)
 *   2. Each player calls deposit{value: betAmount}(roomId) from MetaMask
 *   3. Once all 4 have deposited → state becomes Funded, game begins
 *   4. Game ends → backend calls payoutWinners(roomId, winnerTeam)
 *      ETH is pushed directly to the two winning wallets immediately.
 *      No claim step required — money lands in their MetaMask automatically.
 *   5. If the room is abandoned for 48 hours, depositors can call refund()
 */
contract SpadesEscrow {

    address public immutable owner;

    enum GameState { Open, Funded, Finished, Refunded }

    struct Game {
        address[4] players;       // MetaMask wallet addresses, one per seat
        uint256    betAmount;     // wei per player
        uint8      deposited;     // count of confirmed deposits so far
        GameState  state;
        uint256    createdAt;
        bool[4]    hasDeposited;  // which seats have paid in
    }

    mapping(bytes32 => Game) private games;

    // ── Events ────────────────────────────────────────────────────────────────
    event GameCreated    (bytes32 indexed roomId, uint256 betAmount);
    event PlayerDeposited(bytes32 indexed roomId, address player, uint8 seat);
    event GameFunded     (bytes32 indexed roomId);
    event WinnersPaid    (bytes32 indexed roomId, address winner0, address winner1, uint256 amountEach);
    event PlayerRefunded (bytes32 indexed roomId, address player, uint256 amount);

    // ── Errors ────────────────────────────────────────────────────────────────
    error OnlyOwner();
    error GameNotFound();
    error GameNotOpen();
    error GameNotFunded();
    error AlreadyFinished();
    error NotAPlayer();
    error AlreadyDeposited();
    error WrongAmount();
    error TooEarlyForRefund();
    error PayoutFailed(address to);
    error InvalidTeam();

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    modifier exists(bytes32 roomId) {
        if (games[roomId].createdAt == 0) revert GameNotFound();
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 1 — Backend registers the room before any deposits
    // ─────────────────────────────────────────────────────────────────────────
    function createGame(
        bytes32    roomId,
        address[4] calldata players,
        uint256    betAmount
    ) external onlyOwner {
        require(games[roomId].createdAt == 0, "Game already exists");
        require(betAmount > 0,               "Bet must be > 0");

        games[roomId] = Game({
            players:      players,
            betAmount:    betAmount,
            deposited:    0,
            state:        GameState.Open,
            createdAt:    block.timestamp,
            hasDeposited: [false, false, false, false]
        });

        emit GameCreated(roomId, betAmount);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 2 — Player sends exactly betAmount ETH from their MetaMask wallet
    // ─────────────────────────────────────────────────────────────────────────
    function deposit(bytes32 roomId) external payable exists(roomId) {
        Game storage g = games[roomId];

        if (g.state != GameState.Open) revert GameNotOpen();
        if (msg.value != g.betAmount)  revert WrongAmount();

        uint8 seat = _seatOf(g, msg.sender);
        if (seat == 4)            revert NotAPlayer();
        if (g.hasDeposited[seat]) revert AlreadyDeposited();

        g.hasDeposited[seat] = true;
        g.deposited++;

        emit PlayerDeposited(roomId, msg.sender, seat);

        if (g.deposited == 4) {
            g.state = GameState.Funded;
            emit GameFunded(roomId);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 3 — Backend declares winner and pushes ETH straight to their wallets
    //
    //   Team 0 = seats 0 (South) & 2 (North)
    //   Team 1 = seats 1 (West)  & 3 (East)
    //
    //   Each winner receives:  (betAmount × 4) ÷ 2  =  betAmount × 2
    //   i.e. they get their own stake back plus the losers' stakes split evenly.
    // ─────────────────────────────────────────────────────────────────────────
    function payoutWinners(bytes32 roomId, uint8 winnerTeam)
        external
        onlyOwner
        exists(roomId)
    {
        Game storage g = games[roomId];

        if (g.state != GameState.Funded) revert GameNotFunded();
        if (winnerTeam > 1)              revert InvalidTeam();

        g.state = GameState.Finished;

        // Winning seats: team 0 → seats 0,2   team 1 → seats 1,3
        address w0 = winnerTeam == 0 ? g.players[0] : g.players[1];
        address w1 = winnerTeam == 0 ? g.players[2] : g.players[3];

        uint256 amountEach = (g.betAmount * 4) / 2; // = betAmount * 2

        _send(w0, amountEach);
        _send(w1, amountEach);

        emit WinnersPaid(roomId, w0, w1, amountEach);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SAFETY — Refund any deposit after 48-hour abandonment window
    // ─────────────────────────────────────────────────────────────────────────
    function refund(bytes32 roomId) external exists(roomId) {
        Game storage g = games[roomId];

        if (g.state == GameState.Finished || g.state == GameState.Refunded)
            revert AlreadyFinished();
        if (block.timestamp < g.createdAt + 48 hours)
            revert TooEarlyForRefund();

        uint8 seat = _seatOf(g, msg.sender);
        if (seat == 4)             revert NotAPlayer();
        if (!g.hasDeposited[seat]) revert NotAPlayer();

        g.hasDeposited[seat] = false;
        g.deposited--;
        g.state = GameState.Refunded;

        _send(msg.sender, g.betAmount);
        emit PlayerRefunded(roomId, msg.sender, g.betAmount);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // View
    // ─────────────────────────────────────────────────────────────────────────
    function getGame(bytes32 roomId) external view returns (
        address[4] memory players,
        uint256           betAmount,
        uint8             deposited,
        GameState         state,
        bool[4]   memory  hasDeposited
    ) {
        Game storage g = games[roomId];
        return (g.players, g.betAmount, g.deposited, g.state, g.hasDeposited);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Internal
    // ─────────────────────────────────────────────────────────────────────────
    function _seatOf(Game storage g, address player) internal view returns (uint8) {
        for (uint8 i = 0; i < 4; i++) {
            if (g.players[i] == player) return i;
        }
        return 4;
    }

    function _send(address to, uint256 amount) internal {
        (bool ok, ) = payable(to).call{value: amount}("");
        if (!ok) revert PayoutFailed(to);
    }

    receive() external payable {}
}
