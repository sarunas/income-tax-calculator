import { Report, LedgerByGrant, LedgerEvent } from "./types";

export function buildLedger(report: Report): LedgerByGrant {
  const ledgerByGrant: LedgerByGrant = {};

  // Step 1: Add VEST events
  for (const [grantNumber, balances] of Object.entries(report.shareBalancesByGrant)) {
    for (const balance of balances) {
      const vested = balance.vesting.vestedShares;
      const vestingDate = balance.vesting.vestingDate;

      if (!ledgerByGrant[grantNumber]) {
        ledgerByGrant[grantNumber] = [];
      }

      ledgerByGrant[grantNumber].push({
        type: 'VEST',
        date: vestingDate,
        sharesChanged: vested,
        remainingAfter: 0 // placeholder
      });
    }
  }

  // Step 2: Add SALE events from consumedVestings
  for (const yearly of Object.values(report.gainByYear)) {
    for (const tx of yearly.transactions) {
      const { sale, consumedVestings } = tx;

      const grantNumber = sale.grantNumber;

      if (!ledgerByGrant[grantNumber]) {
        ledgerByGrant[grantNumber] = [];
      }

      // Create sale event with information about the sale
      const saleEvent: LedgerEvent = {
        type: 'SALE',
        date: sale.orderDate,
        sharesChanged: -sale.sharesSold,  // Shares sold
        remainingAfter: 0, // placeholder, will compute later
        saleOrderNumber: sale.orderNumber,
        consumedVestings,
      };

      ledgerByGrant[grantNumber].push(saleEvent);
    }
  }

  // Step 3: Sort and compute running totals
  for (const events of Object.values(ledgerByGrant)) {
    // Sort by date, then VEST before SALE on same day
    events.sort((a, b) => {
      const dateDiff = a.date.getTime() - b.date.getTime();
      if (dateDiff !== 0) return dateDiff;
      if (a.type === 'VEST' && b.type === 'SALE') return -1;
      if (a.type === 'SALE' && b.type === 'VEST') return 1;
      return 0;
    });

    let running = 0;
    for (const e of events) {
      running += e.sharesChanged;
      e.remainingAfter = running;
    }
  }

  return ledgerByGrant;
}
