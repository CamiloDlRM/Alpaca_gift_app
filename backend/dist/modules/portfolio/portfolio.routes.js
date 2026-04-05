"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../shared/middleware/auth.middleware");
const portfolio_controller_1 = require("./portfolio.controller");
const router = (0, express_1.Router)();
router.get('/:giftId', auth_middleware_1.authMiddleware, portfolio_controller_1.getPortfolioHandler);
router.get('/:giftId/history', auth_middleware_1.authMiddleware, portfolio_controller_1.getPriceHistoryHandler);
exports.default = router;
//# sourceMappingURL=portfolio.routes.js.map