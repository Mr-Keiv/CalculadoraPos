export interface ExchangeRate {
  id: string;
  code: string;
  name: string;
  rate: number;
  previousRate: number;
  change: number;
  changePercent: number;
  source?: string;
  timestamp: Date;
}

export interface ExchangeRateContextType {
  rates: ExchangeRate[];
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  convertCurrency: (amount: number, fromCurrency: string, toCurrency: string) => number;
  refreshRates: () => Promise<void>;
}