import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuid } from 'uuid';
import { prisma } from '../lib/prisma';
import { config } from '../config';
import { storeOAuthCode, consumeOAuthCode } from '../lib/redis';

const SALT_ROUNDS = 10;

function generateEmailForwardAddress(handle: string): string {
  const short = uuid().split('-')[0];
  return `${handle}.${short}@stub.app`;
}

function generateTokens(userId: string): { accessToken: string; refreshToken: string } {
  const accessToken = jwt.sign({ sub: userId }, config.jwtSecret, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ sub: userId, type: 'refresh' }, config.jwtRefreshSecret, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

export async function register(data: {
  email: string;
  handle: string;
  displayName: string;
  password: string;
}) {
  const existingEmail = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingEmail) {
    throw new AuthError('Email already registered', 409, 'EMAIL_EXISTS');
  }

  const existingHandle = await prisma.user.findUnique({ where: { handle: data.handle } });
  if (existingHandle) {
    throw new AuthError('Handle already taken', 409, 'HANDLE_EXISTS');
  }

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  const emailForwardAddress = generateEmailForwardAddress(data.handle);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      handle: data.handle,
      displayName: data.displayName,
      passwordHash,
      emailForwardAddress,
    },
  });

  const tokens = generateTokens(user.id);
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: tokens.refreshToken },
  });

  return { user: { id: user.id, email: user.email, handle: user.handle, displayName: user.displayName }, ...tokens };
}

export async function login(data: { email: string; password: string }) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user || !user.passwordHash) {
    throw new AuthError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const valid = await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) {
    throw new AuthError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const tokens = generateTokens(user.id);
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: tokens.refreshToken },
  });

  return { user: { id: user.id, email: user.email, handle: user.handle, displayName: user.displayName }, ...tokens };
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AuthError('User not found', 404, 'USER_NOT_FOUND');
  return { id: user.id, email: user.email, handle: user.handle, displayName: user.displayName };
}

export async function refreshAccessToken(token: string) {
  try {
    const payload = jwt.verify(token, config.jwtRefreshSecret) as { sub: string; type: string };
    if (payload.type !== 'refresh') throw new Error('Invalid token type');

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.refreshToken !== token) {
      throw new AuthError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }

    const tokens = generateTokens(user.id);
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    return tokens;
  } catch {
    throw new AuthError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
  }
}

// Issues a short-lived single-use code for the OAuth redirect, so tokens never
// appear in the callback URL. The client exchanges it via exchangeOAuthCode.
export async function createOAuthCode(userId: string): Promise<string> {
  const code = crypto.randomBytes(32).toString('hex');
  await storeOAuthCode(code, userId);
  return code;
}

export async function exchangeOAuthCode(code: string) {
  const userId = await consumeOAuthCode(code);
  if (!userId) throw new AuthError('Invalid or expired code', 400, 'INVALID_CODE');

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AuthError('User not found', 404, 'USER_NOT_FOUND');

  const tokens = generateTokens(user.id);
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: tokens.refreshToken },
  });

  return { user: { id: user.id, email: user.email, handle: user.handle, displayName: user.displayName }, ...tokens };
}

export async function logout(userId: string) {
  await prisma.user.update({ where: { id: userId }, data: { refreshToken: null } });
}

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string,
  ) {
    super(message);
  }
}
