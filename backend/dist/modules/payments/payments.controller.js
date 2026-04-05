"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentIntentHandler = createPaymentIntentHandler;
exports.webhookHandler = webhookHandler;
const payments_service_1 = require("./payments.service");
async function createPaymentIntentHandler(req, res, next) {
    try {
        const userId = req.user.id;
        const dto = req.body;
        const result = await (0, payments_service_1.createPaymentIntent)(userId, dto);
        res.status(201).json(result);
    }
    catch (err) {
        next(err);
    }
}
async function webhookHandler(req, res, next) {
    try {
        const signature = req.headers['stripe-signature'];
        await (0, payments_service_1.handleWebhook)(req.body, signature);
        res.json({ received: true });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=payments.controller.js.map