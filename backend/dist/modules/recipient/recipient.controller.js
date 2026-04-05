"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPortfolioHandler = getPortfolioHandler;
exports.getHistoryHandler = getHistoryHandler;
exports.sellHandler = sellHandler;
const recipient_service_1 = require("./recipient.service");
async function getPortfolioHandler(req, res, next) {
    try {
        const result = await (0, recipient_service_1.getRecipientPortfolio)(req.params.claimToken);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
}
async function getHistoryHandler(req, res, next) {
    try {
        const period = req.query.period || '1M';
        const result = await (0, recipient_service_1.getRecipientHistory)(req.params.claimToken, period);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
}
async function sellHandler(req, res, next) {
    try {
        const dto = req.body;
        const result = await (0, recipient_service_1.sellRecipientInvestment)(req.params.claimToken, dto);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=recipient.controller.js.map