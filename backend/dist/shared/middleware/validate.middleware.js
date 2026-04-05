"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
const http_errors_1 = require("../errors/http-errors");
function validate(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            next(new http_errors_1.BadRequestError(result.error.errors.map(e => e.message).join(', ')));
            return;
        }
        req.body = result.data;
        next();
    };
}
//# sourceMappingURL=validate.middleware.js.map