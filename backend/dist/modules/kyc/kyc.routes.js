"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const validate_middleware_1 = require("../../shared/middleware/validate.middleware");
const kyc_controller_1 = require("./kyc.controller");
const router = (0, express_1.Router)();
const submitKYCSchema = zod_1.z.object({
    claimToken: zod_1.z.string(),
    fullName: zod_1.z.string().min(1),
    dob: zod_1.z.string(),
    ssn: zod_1.z.string().optional(),
    ssnLast4: zod_1.z.string().length(4),
    address: zod_1.z.string().min(1),
    city: zod_1.z.string().min(1),
    state: zod_1.z.string().min(1),
    zip: zod_1.z.string().min(1),
});
router.post('/submit', (0, validate_middleware_1.validate)(submitKYCSchema), kyc_controller_1.submitKYCHandler);
router.post('/confirm-ssn', kyc_controller_1.confirmSSNHandler);
router.get('/questions/:claimToken', kyc_controller_1.getQuestionsHandler);
router.post('/verify-answers', kyc_controller_1.verifyAnswersHandler);
exports.default = router;
//# sourceMappingURL=kyc.routes.js.map