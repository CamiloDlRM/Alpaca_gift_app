import { prisma } from '../../shared/db/prisma.client';
import { hashPassword, comparePassword } from '../../shared/utils/hash';
import { signToken } from '../../shared/utils/jwt';
import { BadRequestError, UnauthorizedError } from '../../shared/errors/http-errors';
import type { RegisterDto, LoginDto, AuthResponse } from './auth.types';

export async function register(dto: RegisterDto): Promise<AuthResponse> {
  const existing = await prisma.user.findUnique({ where: { email: dto.email } });
  if (existing) throw new BadRequestError('Email already in use');

  const password = await hashPassword(dto.password);
  const user = await prisma.user.create({
    data: { email: dto.email, password, name: dto.name },
  });

  const token = signToken({ id: user.id, email: user.email });
  return { token, user: { id: user.id, email: user.email, name: user.name } };
}

export async function login(dto: LoginDto): Promise<AuthResponse> {
  const user = await prisma.user.findUnique({ where: { email: dto.email } });
  if (!user) throw new UnauthorizedError('Invalid credentials');

  const valid = await comparePassword(dto.password, user.password);
  if (!valid) throw new UnauthorizedError('Invalid credentials');

  const token = signToken({ id: user.id, email: user.email });
  return { token, user: { id: user.id, email: user.email, name: user.name } };
}
