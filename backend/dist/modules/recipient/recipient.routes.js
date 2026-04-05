"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const recipient_controller_1 = require("./recipient.controller");
const router = (0, express_1.Router)();
router.get('/portfolio/:claimToken', recipient_controller_1.getPortfolioHandler);
router.get('/portfolio/:claimToken/history', recipient_controller_1.getHistoryHandler);
router.post('/portfolio/:claimToken/sell', recipient_controller_1.sellHandler);
exports.default = router;
//# sourceMappingURL=recipient.routes.js.map