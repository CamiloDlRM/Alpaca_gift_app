"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const gifts_routes_1 = __importDefault(require("./modules/gifts/gifts.routes"));
const kyc_routes_1 = __importDefault(require("./modules/kyc/kyc.routes"));
const agreements_routes_1 = __importDefault(require("./modules/agreements/agreements.routes"));
const portfolio_routes_1 = __importDefault(require("./modules/portfolio/portfolio.routes"));
const etfs_routes_1 = __importDefault(require("./modules/etfs/etfs.routes"));
const payments_routes_1 = __importDefault(require("./modules/payments/payments.routes"));
const subscriptions_routes_1 = __importDefault(require("./modules/subscriptions/subscriptions.routes"));
const recipient_routes_1 = __importDefault(require("./modules/recipient/recipient.routes"));
const error_middleware_1 = require("./shared/middleware/error.middleware");
// Import modules that register event listeners
require("./modules/alpaca/alpaca.service");
require("./modules/notifications/notifications.service");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
// Stripe webhook needs raw body - must be before express.json()
app.use('/api/payments/webhook', express_1.default.raw({ type: 'application/json' }));
app.use(express_1.default.json({ limit: '10mb' }));
app.get('/health', (_, res) => res.json({ status: 'ok' }));
app.use('/api/auth', auth_routes_1.default);
app.use('/api/gifts', gifts_routes_1.default);
app.use('/api/kyc', kyc_routes_1.default);
app.use('/api/agreements', agreements_routes_1.default);
app.use('/api/portfolio', portfolio_routes_1.default);
app.use('/api/etfs', etfs_routes_1.default);
app.use('/api/payments', payments_routes_1.default);
app.use('/api/subscriptions', subscriptions_routes_1.default);
app.use('/api/recipient', recipient_routes_1.default);
app.use(error_middleware_1.errorMiddleware);
exports.default = app;
//# sourceMappingURL=app.js.map