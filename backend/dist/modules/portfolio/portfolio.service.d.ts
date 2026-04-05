import type { PortfolioResponse, HistoryResponse } from './portfolio.types';
export declare function getPortfolio(giftId: string, userId: string): Promise<PortfolioResponse>;
export declare function getPriceHistory(giftId: string, period: string): Promise<HistoryResponse>;
//# sourceMappingURL=portfolio.service.d.ts.map