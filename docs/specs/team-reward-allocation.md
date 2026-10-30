# Team Reward Allocation

For a successful `GROUP + CANDIDATE` Quest, the Quest becomes completed when
the work succeeds. Reward settlement waits for the Team Leader's split.

- The Leader has 24 hours to enter a percentage for every teammate. Percentages
  support two decimal places (0.01%); teammate shares may total at most 100%,
  and the Leader receives the remainder.
- The editor starts with equal shares and offers a one-tap equal split reset.
  It shows the total, each teammate’s available percentage, and the Leader’s
  automatically calculated remainder. Confirmation lists every member’s share
  and exact amount. Money previews use the Server’s largest-remainder satang
  distribution, with ties resolved in roster order.
- The app previews the Leader's remainder and amount, and asks for confirmation
  before submitting the allocation that pays the team.
- If the Leader does not submit before the deadline, the Server allocates the
  pool equally. Integer-satang remainder is distributed deterministically.
- Each member sees their own percentage and amount after settlement. The server
  credits each member directly from Quest Escrow to Earnings Balance.
- The split applies only to successful `GROUP + CANDIDATE` work. Other Quest
  modes and cancellation/failure settlement keep their routed contracts.

The API behavior is owned by the mirrored Quest lifecycle and reward-money
contracts; the Leader and Member Work Hub surfaces are described here.
