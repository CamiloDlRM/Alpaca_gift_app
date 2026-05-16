import { prisma } from '../../shared/db/prisma.client';
import { hashPassword, comparePassword } from '../../shared/utils/hash';
import { signToken } from '../../shared/utils/jwt';
import { BadRequestError, UnauthorizedError, NotFoundError } from '../../shared/errors/http-errors';
import { sendPasswordCodeEmail } from '../../shared/email/email.service';
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

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
}

export async function isEmailRegistered(email: string): Promise<boolean> {
  if (!email) return false;
  const user = await findUserByEmail(email);
  return Boolean(user);
}

export async function sendPasswordResetCode(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User not found');

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedCode = await hashPassword(code);
  const expiry = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordResetCode: hashedCode, passwordResetExpiry: expiry },
  });

  await sendPasswordCodeEmail({ email: user.email, name: user.name, code });
}

export async function confirmPasswordReset(userId: string, code: string, newPassword: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User not found');
  if (!user.passwordResetCode || !user.passwordResetExpiry) throw new BadRequestError('No reset code found. Please request a new one.');
  if (new Date() > user.passwordResetExpiry) throw new BadRequestError('Code expired. Please request a new one.');

  const valid = await comparePassword(code, user.passwordResetCode);
  if (!valid) throw new BadRequestError('Invalid code.');

  if (newPassword.length < 6) throw new BadRequestError('Password must be at least 6 characters.');

  const hashed = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed, passwordResetCode: null, passwordResetExpiry: null },
  });
}
