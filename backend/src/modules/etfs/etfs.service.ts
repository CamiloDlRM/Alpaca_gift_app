import type { ETF } from './etfs.types';

export const ETF_CATALOG: ETF[] = [
  // ---------- Leading Companies ----------
  { symbol: "VOO", name: "Vanguard S&P 500 ETF", category: "Leading Companies", description: "Tracks the S&P 500 index, one of the world's most popular benchmarks" },
  { symbol: "VTI", name: "Vanguard Total Stock Market ETF", category: "Leading Companies", description: "Total US stock market exposure across all capitalizations" },
  { symbol: "SPY", name: "SPDR S&P 500 ETF Trust", category: "Leading Companies", description: "The original S&P 500 ETF, highly liquid and widely traded" },
  { symbol: "IVV", name: "iShares Core S&P 500 ETF", category: "Leading Companies", description: "Low-cost exposure to the S&P 500 index" },
  { symbol: "SPLG", name: "SPDR Portfolio S&P 500 ETF", category: "Leading Companies", description: "Ultra-low cost S&P 500 index fund" },
  { symbol: "SCHX", name: "Schwab U.S. Large-Cap ETF", category: "Leading Companies", description: "Broad large-cap US stock market exposure" },
  { symbol: "VV", name: "Vanguard Large-Cap ETF", category: "Leading Companies", description: "Diversified exposure to large US companies" },
  { symbol: "ITOT", name: "iShares Core S&P Total US Stock Market ETF", category: "Leading Companies", description: "Comprehensive US market coverage" },
  { symbol: "RSP", name: "Invesco S&P 500 Equal Weight ETF", category: "Leading Companies", description: "Equal-weight S&P 500 for diversified exposure" },
  { symbol: "MGC", name: "Vanguard Mega Cap ETF", category: "Leading Companies", description: "Focuses on the largest US mega-cap companies" },
  { symbol: "DGRO", name: "iShares Core Dividend Growth ETF", category: "Leading Companies", description: "Companies with strong dividend growth histories" },
  { symbol: "NOBL", name: "ProShares S&P 500 Dividend Aristocrats ETF", category: "Leading Companies", description: "Companies with 25+ years of consecutive dividend growth" },
  { symbol: "VIG", name: "Vanguard Dividend Appreciation ETF", category: "Leading Companies", description: "Companies with consistent dividend increases" },
  { symbol: "SCHD", name: "Schwab U.S. Dividend Equity ETF", category: "Leading Companies", description: "High-quality dividend-paying US stocks" },
  { symbol: "DVY", name: "iShares Select Dividend ETF", category: "Leading Companies", description: "High-dividend-yielding US equities" },
  { symbol: "SDY", name: "SPDR S&P Dividend ETF", category: "Leading Companies", description: "S&P 1500 Dividend Aristocrats with 25+ year dividend growth" },
  { symbol: "SPHD", name: "Invesco S&P 500 High Dividend Low Volatility ETF", category: "Leading Companies", description: "High dividend yield with lower volatility" },
  { symbol: "VYM", name: "Vanguard High Dividend Yield ETF", category: "Leading Companies", description: "High-dividend-yield US stocks" },
  { symbol: "HDV", name: "iShares Core High Dividend ETF", category: "Leading Companies", description: "Financially healthy companies with high dividends" },
  { symbol: "QUAL", name: "iShares MSCI USA Quality Factor ETF", category: "Leading Companies", description: "High-quality US companies with strong fundamentals" },

  // ---------- Innovation & Technology ----------
  { symbol: "QQQ", name: "Invesco QQQ Trust", category: "Innovation & Technology", description: "Tracks the Nasdaq-100 index, home to tech giants" },
  { symbol: "VGT", name: "Vanguard Information Technology ETF", category: "Innovation & Technology", description: "US information technology sector companies" },
  { symbol: "XLK", name: "Technology Select Sector SPDR Fund", category: "Innovation & Technology", description: "S&P 500 technology sector companies" },
  { symbol: "FTEC", name: "Fidelity MSCI Information Technology ETF", category: "Innovation & Technology", description: "Low-cost technology sector exposure" },
  { symbol: "IGV", name: "iShares Expanded Tech-Software Sector ETF", category: "Innovation & Technology", description: "Software and technology services companies" },
  { symbol: "SOXX", name: "iShares Semiconductor ETF", category: "Innovation & Technology", description: "Leading semiconductor manufacturers and designers" },
  { symbol: "SMH", name: "VanEck Semiconductor ETF", category: "Innovation & Technology", description: "Top semiconductor companies globally" },
  { symbol: "ARKK", name: "ARK Innovation ETF", category: "Innovation & Technology", description: "Disruptive innovation across multiple sectors" },
  { symbol: "FDN", name: "First Trust Dow Jones Internet Index Fund", category: "Innovation & Technology", description: "Leading internet companies" },
  { symbol: "IYW", name: "iShares U.S. Technology ETF", category: "Innovation & Technology", description: "Comprehensive US technology sector coverage" },
  { symbol: "WCLD", name: "WisdomTree Cloud Computing Fund", category: "Innovation & Technology", description: "Pure-play cloud computing companies" },
  { symbol: "BOTZ", name: "Global X Robotics & Artificial Intelligence ETF", category: "Innovation & Technology", description: "Robotics, automation and AI companies" },
  { symbol: "AIQ", name: "Global X Artificial Intelligence & Technology ETF", category: "Innovation & Technology", description: "Companies developing AI and big data solutions" },
  { symbol: "HACK", name: "ETFMG Prime Cyber Security ETF", category: "Innovation & Technology", description: "Cybersecurity companies protecting digital infrastructure" },
  { symbol: "CIBR", name: "First Trust NASDAQ Cybersecurity ETF", category: "Innovation & Technology", description: "Nasdaq-listed cybersecurity companies" },
  { symbol: "PNQI", name: "Invesco NASDAQ Internet ETF", category: "Innovation & Technology", description: "Internet companies listed on Nasdaq" },
  { symbol: "CLOU", name: "Global X Cloud Computing ETF", category: "Innovation & Technology", description: "Companies positioned to benefit from cloud shift" },
  { symbol: "ROBO", name: "ROBO Global Robotics and Automation ETF", category: "Innovation & Technology", description: "Companies at the forefront of robotics and automation" },
  { symbol: "QTEC", name: "First Trust NASDAQ-100 Tech Sector Index Fund", category: "Innovation & Technology", description: "Technology companies in the Nasdaq-100" },
  { symbol: "SKYY", name: "First Trust Cloud Computing ETF", category: "Innovation & Technology", description: "Infrastructure, platform and SaaS cloud companies" },

  // ---------- Emerging Growth ----------
  { symbol: "IWM", name: "iShares Russell 2000 ETF", category: "Emerging Growth", description: "Small-cap US stocks tracking the Russell 2000" },
  { symbol: "VB", name: "Vanguard Small-Cap ETF", category: "Emerging Growth", description: "Diversified small-cap US stock market" },
  { symbol: "IJR", name: "iShares Core S&P Small-Cap ETF", category: "Emerging Growth", description: "Low-cost S&P 600 small-cap index fund" },
  { symbol: "SCHA", name: "Schwab U.S. Small-Cap ETF", category: "Emerging Growth", description: "Broad small-cap US stock market" },
  { symbol: "VIOO", name: "Vanguard S&P Small-Cap 600 ETF", category: "Emerging Growth", description: "S&P 600 small-cap companies" },
  { symbol: "IWC", name: "iShares Micro-Cap ETF", category: "Emerging Growth", description: "Micro-cap US stocks for higher growth potential" },
  { symbol: "AVUV", name: "Avantis U.S. Small Cap Value ETF", category: "Emerging Growth", description: "Small-cap value stocks with quality screens" },
  { symbol: "VBR", name: "Vanguard Small-Cap Value ETF", category: "Emerging Growth", description: "Small-cap value-oriented US stocks" },
  { symbol: "IJS", name: "iShares S&P Small-Cap 600 Value ETF", category: "Emerging Growth", description: "Value-oriented small-cap companies" },
  { symbol: "IJT", name: "iShares S&P Small-Cap 600 Growth ETF", category: "Emerging Growth", description: "Growth-oriented small-cap companies" },
  { symbol: "CALF", name: "Pacer US Small Cap Cash Cows 100 ETF", category: "Emerging Growth", description: "Small-cap companies with high free cash flow yields" },
  { symbol: "SLYV", name: "SPDR S&P 600 Small Cap Value ETF", category: "Emerging Growth", description: "Small-cap value stocks from the S&P 600" },
  { symbol: "SLY", name: "SPDR S&P 600 Small Cap ETF", category: "Emerging Growth", description: "S&P 600 small-cap index fund" },
  { symbol: "VBK", name: "Vanguard Small-Cap Growth ETF", category: "Emerging Growth", description: "Growth-oriented small-cap US stocks" },
  { symbol: "IWO", name: "iShares Russell 2000 Growth ETF", category: "Emerging Growth", description: "Growth companies within the Russell 2000" },
  { symbol: "IWN", name: "iShares Russell 2000 Value ETF", category: "Emerging Growth", description: "Value companies within the Russell 2000" },
  { symbol: "DFAS", name: "Dimensional U.S. Small Cap ETF", category: "Emerging Growth", description: "Factor-based small-cap US equity" },
  { symbol: "FNDA", name: "Schwab Fundamental U.S. Small Company ETF", category: "Emerging Growth", description: "Fundamentally weighted small-cap US stocks" },
  { symbol: "RWJ", name: "Invesco S&P SmallCap 600 Revenue ETF", category: "Emerging Growth", description: "Small-cap companies weighted by revenue" },
  { symbol: "OUSM", name: "O'Shares U.S. Small & Mid Cap Quality Dividend ETF", category: "Emerging Growth", description: "Quality small and mid-cap dividend payers" },

  // ---------- Stability & Income ----------
  { symbol: "AGG", name: "iShares Core U.S. Aggregate Bond ETF", category: "Stability & Income", description: "Broad investment-grade US bond market" },
  { symbol: "BND", name: "Vanguard Total Bond Market ETF", category: "Stability & Income", description: "Investment-grade US bonds across all maturities" },
  { symbol: "SCHZ", name: "Schwab U.S. Aggregate Bond ETF", category: "Stability & Income", description: "Low-cost US investment-grade bond market" },
  { symbol: "IUSB", name: "iShares Core Total USD Bond Market ETF", category: "Stability & Income", description: "Comprehensive US bond market exposure" },
  { symbol: "BNDX", name: "Vanguard Total International Bond ETF", category: "Stability & Income", description: "Investment-grade bonds from developed markets" },
  { symbol: "LQD", name: "iShares iBoxx $ Investment Grade Corporate Bond ETF", category: "Stability & Income", description: "Investment-grade US corporate bonds" },
  { symbol: "MUB", name: "iShares National Muni Bond ETF", category: "Stability & Income", description: "Investment-grade US municipal bonds, tax-exempt" },
  { symbol: "HYG", name: "iShares iBoxx $ High Yield Corporate Bond ETF", category: "Stability & Income", description: "High-yield US corporate bonds" },
  { symbol: "JNK", name: "SPDR Bloomberg High Yield Bond ETF", category: "Stability & Income", description: "Below investment-grade corporate bonds" },
  { symbol: "TLT", name: "iShares 20+ Year Treasury Bond ETF", category: "Stability & Income", description: "Long-duration US Treasury bonds" },
  { symbol: "SHY", name: "iShares 1-3 Year Treasury Bond ETF", category: "Stability & Income", description: "Short-term US Treasury bonds" },
  { symbol: "IEF", name: "iShares 7-10 Year Treasury Bond ETF", category: "Stability & Income", description: "Intermediate-term US Treasury bonds" },
  { symbol: "VCSH", name: "Vanguard Short-Term Corporate Bond ETF", category: "Stability & Income", description: "Short-term investment-grade corporate bonds" },
  { symbol: "VCIT", name: "Vanguard Intermediate-Term Corporate Bond ETF", category: "Stability & Income", description: "Intermediate-term corporate bonds" },
  { symbol: "VGLT", name: "Vanguard Long-Term Treasury ETF", category: "Stability & Income", description: "Long-term US Treasury bonds" },
  { symbol: "EMB", name: "iShares J.P. Morgan USD Emerging Markets Bond ETF", category: "Stability & Income", description: "Emerging market sovereign bonds in USD" },
  { symbol: "BSV", name: "Vanguard Short-Term Bond ETF", category: "Stability & Income", description: "Short-term investment-grade bonds" },
  { symbol: "FLOT", name: "iShares Floating Rate Bond ETF", category: "Stability & Income", description: "Floating-rate investment-grade bonds" },
  { symbol: "GOVT", name: "iShares U.S. Treasury Bond ETF", category: "Stability & Income", description: "US Treasury bonds across all maturities" },
  { symbol: "TIPS", name: "iShares TIPS Bond ETF", category: "Stability & Income", description: "Inflation-protected US Treasury securities" },

  // ---------- Worldwide Growth ----------
  { symbol: "VEA", name: "Vanguard FTSE Developed Markets ETF", category: "Worldwide Growth", description: "Stocks from developed markets outside the US" },
  { symbol: "VWO", name: "Vanguard FTSE Emerging Markets ETF", category: "Worldwide Growth", description: "Stocks from emerging market economies" },
  { symbol: "EFA", name: "iShares MSCI EAFE ETF", category: "Worldwide Growth", description: "Large and mid-cap stocks in developed markets" },
  { symbol: "IEFA", name: "iShares Core MSCI EAFE ETF", category: "Worldwide Growth", description: "Low-cost developed international markets" },
  { symbol: "VXUS", name: "Vanguard Total International Stock ETF", category: "Worldwide Growth", description: "All international stocks, developed and emerging" },
  { symbol: "EEM", name: "iShares MSCI Emerging Markets ETF", category: "Worldwide Growth", description: "Large and mid-cap emerging market stocks" },
  { symbol: "SCHF", name: "Schwab International Equity ETF", category: "Worldwide Growth", description: "Developed international markets ex-US" },
  { symbol: "VT", name: "Vanguard Total World Stock ETF", category: "Worldwide Growth", description: "Every investable stock market worldwide" },
  { symbol: "ACWI", name: "iShares MSCI ACWI ETF", category: "Worldwide Growth", description: "All Country World Index, global equity exposure" },
  { symbol: "IEMG", name: "iShares Core MSCI Emerging Markets ETF", category: "Worldwide Growth", description: "Broad emerging market equity exposure" },
  { symbol: "DGS", name: "WisdomTree Emerging Markets SmallCap Dividend ETF", category: "Worldwide Growth", description: "Small-cap emerging market dividend payers" },
  { symbol: "VSS", name: "Vanguard FTSE All-World ex-US Small-Cap ETF", category: "Worldwide Growth", description: "Small-cap stocks from international markets" },
  { symbol: "SCZ", name: "iShares MSCI EAFE Small-Cap ETF", category: "Worldwide Growth", description: "Small-cap stocks from developed markets" },
  { symbol: "FNDF", name: "Schwab Fundamental International Large Company ETF", category: "Worldwide Growth", description: "Fundamentally weighted international large-caps" },
  { symbol: "AVDE", name: "Avantis International Equity ETF", category: "Worldwide Growth", description: "International developed market equities" },
  { symbol: "IXUS", name: "iShares Core MSCI Total International Stock ETF", category: "Worldwide Growth", description: "Total international stock market" },
  { symbol: "EWJ", name: "iShares MSCI Japan ETF", category: "Worldwide Growth", description: "Japanese equity market exposure" },
  { symbol: "FEZ", name: "SPDR EURO STOXX 50 ETF", category: "Worldwide Growth", description: "50 largest blue-chip companies in the Eurozone" },
  { symbol: "VGK", name: "Vanguard FTSE Europe ETF", category: "Worldwide Growth", description: "Pan-European stock market exposure" },
  { symbol: "EWZ", name: "iShares MSCI Brazil ETF", category: "Worldwide Growth", description: "Brazilian equity market exposure" },
];

// Seeded mock price changes (percent)
const mockChanges: Record<string, number> = {
  // Large Cap
  VOO: 1.23, VTI: 0.87, SPY: 1.18, IVV: 1.21, SPLG: 1.19, SCHX: 0.94, VV: 0.91,
  ITOT: 0.85, RSP: 0.62, MGC: 1.05, DGRO: 0.54, NOBL: 0.33, VIG: 0.48, SCHD: 0.41,
  DVY: 0.29, SDY: 0.27, SPHD: 0.18, VYM: 0.36, HDV: 0.31, QUAL: 0.97,
  // Technology
  QQQ: 2.14, VGT: 1.95, XLK: 2.02, FTEC: 1.88, IGV: 2.31, SOXX: 3.12, SMH: 3.04,
  ARKK: 3.87, FDN: 2.25, IYW: 1.91, WCLD: 2.67, BOTZ: 2.43, AIQ: 2.58, HACK: 1.74,
  CIBR: 1.69, PNQI: 2.11, CLOU: 2.49, ROBO: 2.21, QTEC: 1.97, SKYY: 2.33,
  // Small Cap
  IWM: -0.43, VB: -0.21, IJR: -0.18, SCHA: -0.27, VIOO: -0.19, IWC: -0.55,
  AVUV: 0.12, VBR: -0.09, IJS: -0.14, IJT: 0.07, CALF: 0.22, SLYV: -0.11,
  SLY: -0.16, VBK: 0.31, IWO: 0.18, IWN: -0.33, DFAS: -0.08, FNDA: -0.12,
  RWJ: 0.04, OUSM: 0.15,
  // Bonds
  AGG: 0.12, BND: 0.08, SCHZ: 0.09, IUSB: 0.11, BNDX: 0.06, LQD: 0.14, MUB: 0.05,
  HYG: 0.21, JNK: 0.19, TLT: -0.42, SHY: 0.03, IEF: -0.11, VCSH: 0.07, VCIT: 0.04,
  VGLT: -0.38, EMB: 0.27, BSV: 0.05, FLOT: 0.02, GOVT: -0.07, TIPS: 0.09,
  // International
  VEA: 0.67, VWO: -0.31, EFA: 0.58, IEFA: 0.61, VXUS: 0.44, EEM: -0.28, SCHF: 0.55,
  VT: 0.72, ACWI: 0.69, IEMG: -0.24, DGS: -0.19, VSS: 0.33, SCZ: 0.41, FNDF: 0.48,
  AVDE: 0.52, IXUS: 0.46, EWJ: 0.88, FEZ: 0.74, VGK: 0.63, EWZ: -1.12,
};

const mockPrices: Record<string, number> = {
  // Large Cap
  VOO: 445.23, VTI: 238.45, SPY: 483.12, IVV: 486.34, SPLG: 57.21, SCHX: 56.78,
  VV: 232.45, ITOT: 108.67, RSP: 167.89, MGC: 198.34, DGRO: 58.12, NOBL: 99.45,
  VIG: 178.23, SCHD: 78.56, DVY: 124.67, SDY: 128.34, SPHD: 46.78, VYM: 116.45,
  HDV: 108.23, QUAL: 156.78,
  // Technology
  QQQ: 432.18, VGT: 487.65, XLK: 207.34, FTEC: 152.45, IGV: 89.67, SOXX: 678.45,
  SMH: 234.56, ARKK: 52.34, FDN: 198.67, IYW: 134.23, WCLD: 38.45, BOTZ: 31.78,
  AIQ: 36.45, HACK: 67.89, CIBR: 62.34, PNQI: 198.45, CLOU: 24.67, ROBO: 58.23,
  QTEC: 178.45, SKYY: 98.67,
  // Small Cap
  IWM: 196.32, VB: 224.56, IJR: 112.34, SCHA: 46.78, VIOO: 98.45, IWC: 132.67,
  AVUV: 89.34, VBR: 187.45, IJS: 102.34, IJT: 118.67, CALF: 42.34, SLYV: 78.45,
  SLY: 89.67, VBK: 267.34, IWO: 298.45, IWN: 158.67, DFAS: 28.45, FNDA: 56.78,
  RWJ: 38.45, OUSM: 42.67,
  // Bonds
  AGG: 97.54, BND: 73.21, SCHZ: 48.67, IUSB: 45.34, BNDX: 48.78, LQD: 109.45,
  MUB: 106.78, HYG: 77.34, JNK: 92.45, TLT: 92.67, SHY: 82.34, IEF: 94.56,
  VCSH: 77.89, VCIT: 80.34, VGLT: 56.78, EMB: 89.45, BSV: 76.34, FLOT: 50.67,
  GOVT: 22.45, TIPS: 105.34,
  // International
  VEA: 48.76, VWO: 41.23, EFA: 78.45, IEFA: 72.34, VXUS: 58.67, EEM: 41.78,
  SCHF: 38.45, VT: 108.34, ACWI: 112.67, IEMG: 52.34, DGS: 46.78, VSS: 118.45,
  SCZ: 62.34, FNDF: 32.45, AVDE: 58.67, IXUS: 67.34, EWJ: 68.45, FEZ: 52.34,
  VGK: 67.89, EWZ: 31.45,
};

export function getAllETFs(): ETF[] {
  return ETF_CATALOG.map(etf => ({
    ...etf,
    changePercent: mockChanges[etf.symbol] ?? 0,
    price: mockPrices[etf.symbol] ?? 100,
  }));
}

export function getCategories(): string[] {
  return [...new Set(ETF_CATALOG.map(e => e.category))];
}

export function getETFBySymbol(symbol: string): ETF | undefined {
  const etf = ETF_CATALOG.find(e => e.symbol === symbol.toUpperCase());
  if (!etf) return undefined;
  return {
    ...etf,
    changePercent: mockChanges[etf.symbol] ?? 0,
    price: mockPrices[etf.symbol] ?? 100,
  };
}
