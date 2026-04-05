"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../shared/middleware/auth.middleware");
const subscriptions_controller_1 = require("./subscriptions.controller");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authMiddleware, subscriptions_controller_1.getStatusHandler);
router.post('/', auth_middleware_1.authMiddleware, subscriptions_controller_1.createSubscriptionHandler);
router.delete('/', auth_middleware_1.authMiddleware, subscriptions_controller_1.cancelSubscriptionHandler);
exports.default = router;
//# sourceMappingURL=subscriptions.routes.js.map