import { RecipientPortfolioResponse, SellRequestDto, SellResponse } from './recipient.types';
export declare function getRecipientPortfolio(claimToken: string): Promise<RecipientPortfolioResponse>;
export declare function getRecipientHistory(claimToken: string, period: string): Promise<{
    period: string;
    data: import("../alpaca/alpaca.types").ChartDataPoint[];
}>;
export declare function sellRecipientInvestment(claimToken: string, _dto: SellRequestDto): Promise<SellResponse>;
//# sourceMappingURL=recipient.service.d.ts.map