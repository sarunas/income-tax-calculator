// Input parsing types
export interface IssuedShare {
  grantDate: Date;
  vestingDate: Date;
  vestedShares: number;
  stockPrice: number;
  exercisePrice: number;
  grantNumber: string;
  grantType: string;
}

export interface SoldShare {
  orderNumber: string;
  action: 'Sell of Restricted Stock' | 'Sell of Stock' | 'Same Day Sell';
  grantNumber: string;
  grantDate: Date;
  grantType: string;
  orderDate: Date;
  sharesSold: number;
  salePrice: number;
  exercisePrice: number;
  totalFees: number;
}

// Tax calculation types
export interface VestedShareWithTax {
  vesting: IssuedShare;
  exchangeRate: number;
  cost: number;
  incomeAmount: number;
}

export interface VestedShareConsumption {
  vesting: IssuedShare;
  amount: number;
  remainingShares: number;
}

export interface ShareSaleWithTax {
  sale: SoldShare;
  exchangeRate: number;
  amount: number;
  totalFeesInEur: number;
  cost: number;
  gain: number;
  consumedVestings: VestedShareConsumption[];
}

// Shared types
export interface ShareBalance {
  vesting: IssuedShare;
  remainingShares: number;
}

export interface YearlyIncome {
  total: number;
  shares: VestedShareWithTax[];
}

export interface YearlyGain {
  total: number;
  transactions: ShareSaleWithTax[];
}

export interface Report {
  shareBalancesByGrant: Record<string, ShareBalance[]>;
  incomeByYear: Record<number, YearlyIncome>;
  gainByYear: Record<number, YearlyGain>;
}

// Tax instructions types
export interface TaxField {
  name: string;
  value?: number;
  subfields?: {
    name: string;
    value: number;
  }[];
}

export interface YearInstructions {
  heading: string;
  fields: TaxField[];
}

export interface TaxInstructions {
  [year: number]: YearInstructions;
}

// Exchange rate types
export interface ExchangeRates {
  [date: string]: number;
}

export interface ShareProcessingResult {
  issuedShares: IssuedShare[];
  soldShares: SoldShare[];
} 

// Ledger
export type LedgerEventType = 'VEST' | 'SALE';

export interface LedgerEvent {
  type: LedgerEventType;
  date: Date;
  sharesChanged: number;
  remainingAfter: number;
  saleOrderNumber?: string;
}

export interface LedgerEntry {
  vesting: IssuedShare;
  events: LedgerEvent[];
}

export type LedgerByGrant = Record<string, LedgerEntry[]>;
