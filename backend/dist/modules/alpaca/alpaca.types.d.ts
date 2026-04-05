export interface KYCData {
    fullName: string;
    dob: string;
    ssnLast4: string;
    address: string;
    city: string;
    state: string;
    zip: string;
}
export interface PortfolioSnapshot {
    accountId: string;
    totalValue: number;
    gainLoss: number;
    gainLossPercent: number;
    shares: number;
    symbol: string;
}
export interface ChartDataPoint {
    date: string;
    value: number;
}
export interface AlpacaService {
    createAccount(kyc: KYCData): Promise<{
        accountId: string;
    }>;
    fundAccount(accountId: string, amount: number): Promise<void>;
    buyETF(accountId: string, symbol: string, amount: number): Promise<{
        orderId: string;
    }>;
    getPortfolio(accountId: string): Promise<PortfolioSnapshot>;
    getPriceHistory(symbol: string, period: string): Promise<ChartDataPoint[]>;
}
//# sourceMappingURL=alpaca.types.d.ts.map