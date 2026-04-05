"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStatusHandler = getStatusHandler;
exports.createSubscriptionHandler = createSubscriptionHandler;
exports.cancelSubscriptionHandler = cancelSubscriptionHandler;
const subscriptions_service_1 = require("./subscriptions.service");
async function getStatusHandler(req, res, next) {
    try {
        const result = await (0, subscriptions_service_1.getSubscriptionStatus)(req.user.id);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
}
async function createSubscriptionHandler(req, res, next) {
    try {
        const result = await (0, subscriptions_service_1.createSubscription)(req.user.id, req.body);
        res.status(201).json(result);
    }
    catch (err) {
        next(err);
    }
}
async function cancelSubscriptionHandler(req, res, next) {
    try {
        const result = await (0, subscriptions_service_1.cancelSubscription)(req.user.id);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=subscriptions.controller.js.map