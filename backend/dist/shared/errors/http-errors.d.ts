export declare class HttpError extends Error {
    statusCode: number;
    code: string;
    constructor(statusCode: number, message: string, code: string);
}
export declare class NotFoundError extends HttpError {
    constructor(message?: string);
}
export declare class UnauthorizedError extends HttpError {
    constructor(message?: string);
}
export declare class ForbiddenError extends HttpError {
    constructor(message?: string);
}
export declare class BadRequestError extends HttpError {
    constructor(message?: string);
}
export declare class ConflictError extends HttpError {
    constructor(message?: string);
}
//# sourceMappingURL=http-errors.d.ts.map