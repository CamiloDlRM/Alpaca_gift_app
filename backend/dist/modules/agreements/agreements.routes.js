"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const validate_middleware_1 = require("../../shared/middleware/validate.middleware");
const agreements_controller_1 = require("./agreements.controller");
const router = (0, express_1.Router)();
const signSchema = zod_1.z.object({
    claimToken: zod_1.z.string(),
    signatureBase64: zod_1.z.string().min(1),
    agreed: zod_1.z.boolean(),
});
router.post('/sign', (0, validate_middleware_1.validate)(signSchema), agreements_controller_1.signAgreementHandler);
exports.default = router;
//# sourceMappingURL=agreements.routes.js.map