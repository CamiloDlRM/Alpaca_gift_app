"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConflictError = exports.BadRequestError = exports.ForbiddenError = exports.UnauthorizedError = exports.NotFoundError = exports.HttpError = void 0;
class HttpError extends Error {
    constructor(statusCode, message, code) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.name = 'HttpError';
    }
}
exports.HttpError = HttpError;
class NotFoundError extends HttpError {
    constructor(message = 'Not found') {
        super(404, message, 'NOT_FOUND');
    }
}
exports.NotFoundError = NotFoundError;
class UnauthorizedError extends HttpError {
    constructor(message = 'Unauthorized') {
        super(401, message, 'UNAUTHORIZED');
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends HttpError {
    constructor(message = 'Forbidden') {
        super(403, message, 'FORBIDDEN');
    }
}
exports.ForbiddenError = ForbiddenError;
class BadRequestError extends HttpError {
    constructor(message = 'Bad request') {
        super(400, message, 'BAD_REQUEST');
    }
}
exports.BadRequestError = BadRequestError;
class ConflictError extends HttpError {
    constructor(message = 'Conflict') {
        super(409, message, 'CONFLICT');
    }
}
exports.ConflictError = ConflictError;
//# sourceMappingURL=http-errors.js.map