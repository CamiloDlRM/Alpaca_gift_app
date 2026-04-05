"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const validate_middleware_1 = require("../../shared/middleware/validate.middleware");
const auth_controller_1 = require("./auth.controller");
const router = (0, express_1.Router)();
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    name: zod_1.z.string().min(1),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
router.post('/register', (0, validate_middleware_1.validate)(registerSchema), auth_controller_1.registerHandler);
router.post('/login', (0, validate_middleware_1.validate)(loginSchema), auth_controller_1.loginHandler);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map