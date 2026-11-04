import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { authRepository } from "./auth.repository";
import type { LoginInput } from "./auth.validation";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export const authService = {
  async login(input: LoginInput) {
    const email = input.email.toLowerCase();

    const user = await authRepository.findByEmail(email);

    if (!user) {
      throw new AuthError("Invalid email or password", 401);
    }

    if (user.status !== "ACTIVE") {
      throw new AuthError("Your account is inactive", 403);
    }

    const passwordMatches = await bcrypt.compare(
      input.password,
      user.passwordHash
    );

    if (!passwordMatches) {
      throw new AuthError("Invalid email or password", 401);
    }

    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    const { passwordHash: _passwordHash, ...safeUser } = user;

    return {
      user: safeUser,
      accessToken,
      tokenType: "Bearer",
      expiresIn: 86400,
    };
  },

  async getCurrentUser(userId: string) {
    const user = await authRepository.findById(userId);

    if (!user || user.status !== "ACTIVE") {
      throw new AuthError("User not found or inactive", 401);
    }

    return user;
  },
};