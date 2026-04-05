"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = errorMiddleware;
const http_errors_1 = require("../errors/http-errors");
function errorMiddleware(err, req, res, next) {
    if (err instanceof http_errors_1.HttpError) {
        res.status(err.statusCode).json({ error: err.message, code: err.code });
        return;
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
}
//# sourceMappingURL=error.middleware.js.map