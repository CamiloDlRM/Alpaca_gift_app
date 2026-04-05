"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../shared/middleware/auth.middleware");
const payments_controller_1 = require("./payments.controller");
const router = (0, express_1.Router)();
// Webhook must use raw body - mounted separately in app.ts
router.post('/webhook', payments_controller_1.webhookHandler);
router.post('/create-intent', auth_middleware_1.authMiddleware, payments_controller_1.createPaymentIntentHandler);
exports.default = router;
//# sourceMappingURL=payments.routes.js.map