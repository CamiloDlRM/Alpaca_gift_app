"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jwt_1 = require("../utils/jwt");
const http_errors_1 = require("../errors/http-errors");
function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new http_errors_1.UnauthorizedError('No token provided');
        }
        const token = authHeader.split(' ')[1];
        const payload = (0, jwt_1.verifyToken)(token);
        req.user = { id: payload.id, email: payload.email };
        next();
    }
    catch {
        next(new http_errors_1.UnauthorizedError('Invalid token'));
    }
}
//# sourceMappingURL=auth.middleware.js.map