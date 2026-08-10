export interface Balance { member_id: string; name: string; display_name?: string; balance: number; }
export interface Settlement { from: string; fromName: string; to: string; toName: string; amount: number; }
export function calculateSettlements(balances: Balance[]): Settlement[] {
  const data = balances.map(b => ({
    ...b,
    balance: Number(b.balance)
  }));

  const debtors = data
    .filter(b => b.balance < 0)
    .sort((a, b) => a.balance - b.balance);

  const creditors = data
    .filter(b => b.balance > 0)
    .sort((a, b) => b.balance - a.balance);

  const settlements: Settlement[] = [];

  let d = 0;
  let c = 0;

  while (d < debtors.length && c < creditors.length) {
    const debtor = debtors[d];
    const creditor = creditors[c];

    const amount = Math.min(
      Math.abs(debtor.balance),
      creditor.balance
    );

    if (amount > 0.005) {
      settlements.push({
        from: debtor.member_id,
        fromName: debtor.display_name || debtor.name,
        to: creditor.member_id,
        toName: creditor.display_name || creditor.name,
        amount: Number(amount.toFixed(2))
      });
    }

    debtor.balance += amount;
    creditor.balance -= amount;

    if (Math.abs(debtor.balance) < 0.005) {
      d++;
    }

    if (creditor.balance < 0.005) {
      c++;
    }
  }

  return settlements;
}