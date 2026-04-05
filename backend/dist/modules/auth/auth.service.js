"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
const prisma_client_1 = require("../../shared/db/prisma.client");
const hash_1 = require("../../shared/utils/hash");
const jwt_1 = require("../../shared/utils/jwt");
const http_errors_1 = require("../../shared/errors/http-errors");
async function register(dto) {
    const existing = await prisma_client_1.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing)
        throw new http_errors_1.BadRequestError('Email already in use');
    const password = await (0, hash_1.hashPassword)(dto.password);
    const user = await prisma_client_1.prisma.user.create({
        data: { email: dto.email, password, name: dto.name },
    });
    const token = (0, jwt_1.signToken)({ id: user.id, email: user.email });
    return { token, user: { id: user.id, email: user.email, name: user.name } };
}
async function login(dto) {
    const user = await prisma_client_1.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user)
        throw new http_errors_1.UnauthorizedError('Invalid credentials');
    const valid = await (0, hash_1.comparePassword)(dto.password, user.password);
    if (!valid)
        throw new http_errors_1.UnauthorizedError('Invalid credentials');
    const token = (0, jwt_1.signToken)({ id: user.id, email: user.email });
    return { token, user: { id: user.id, email: user.email, name: user.name } };
}
//# sourceMappingURL=auth.service.js.map