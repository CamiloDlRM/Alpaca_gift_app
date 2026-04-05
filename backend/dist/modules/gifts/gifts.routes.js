"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_middleware_1 = require("../../shared/middleware/auth.middleware");
const validate_middleware_1 = require("../../shared/middleware/validate.middleware");
const gifts_controller_1 = require("./gifts.controller");
const router = (0, express_1.Router)();
const createGiftSchema = zod_1.z.object({
    recipientName: zod_1.z.string().min(1),
    occasion: zod_1.z.string().min(1),
    etfSymbol: zod_1.z.string().min(1),
    amount: zod_1.z.number().positive(),
    note: zod_1.z.string().optional(),
    deliveryDate: zod_1.z.string(),
});
router.post('/', auth_middleware_1.authMiddleware, (0, validate_middleware_1.validate)(createGiftSchema), gifts_controller_1.createGiftHandler);
router.get('/', auth_middleware_1.authMiddleware, gifts_controller_1.listGiftsHandler);
router.get('/claim/:claimToken', gifts_controller_1.getGiftByClaimTokenHandler);
router.patch('/claim/:claimToken/start', gifts_controller_1.startClaimingHandler);
router.get('/:id', auth_middleware_1.authMiddleware, gifts_controller_1.getGiftHandler);
exports.default = router;
//# sourceMappingURL=gifts.routes.js.map