import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { generateToken, generateRefreshToken, verifyToken, TokenPayload } from '../utils/jwt';
import { sendEmail } from '../config/email';
import { ApiError } from '../utils/ApiError';
import { RegisterInput, LoginInput, ChangePasswordInput, ResetPasswordInput } from '../validation/auth.validation';
import { Role } from '@prisma/client';

export class AuthService {
  async register(data: RegisterInput) {
    const { email, password, firstName, lastName, role, companyId, branchId, departmentId, employeeId } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ApiError(409, 'User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: role as Role || 'STAFF',
        companyId: companyId || null,
        branchId: branchId || null,
        departmentId: departmentId || null,
        employeeId: employeeId || null,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        companyId: true,
        branchId: true,
        departmentId: true,
        employeeId: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId || undefined,
      branchId: user.branchId || undefined,
    };

    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token in session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.session.create({
      data: {
        userId: user.id,
        accessToken,
        refreshToken,
        accessTokenExp: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        refreshTokenExp: expiresAt,
        isActive: true,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entity: 'User',
        entityId: user.id,
        changes: { action: 'User registered' },
      },
    });

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async login(data: LoginInput) {
    const { email, password } = data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        company: true,
        branch: true,
        department: true,
        employee: true,
      },
    });

    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    if (!user.isActive) {
      throw new ApiError(403, 'Account is deactivated');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new ApiError(401, 'Invalid email or password');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId || undefined,
      branchId: user.branchId || undefined,
    };

    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.session.create({
      data: {
        userId: user.id,
        accessToken,
        refreshToken,
        accessTokenExp: new Date(Date.now() + 15 * 60 * 1000),
        refreshTokenExp: expiresAt,
        isActive: true,
        ipAddress: undefined,
        userAgent: undefined,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entity: 'User',
        entityId: user.id,
        changes: { action: 'User logged in' },
      },
    });

    // Return user data (excluding password)
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = verifyToken(refreshToken) as TokenPayload;
      if (!decoded || !decoded.userId) {
        throw new ApiError(401, 'Invalid refresh token');
      }

      const session = await prisma.session.findFirst({
        where: {
          refreshToken,
          userId: decoded.userId,
          isActive: true,
          refreshTokenExp: {
            gt: new Date(),
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              companyId: true,
              branchId: true,
              isActive: true,
            },
          },
        },
      });

      if (!session) {
        throw new ApiError(401, 'Invalid or expired refresh token');
      }

      if (!session.user.isActive) {
        throw new ApiError(403, 'User account is deactivated');
      }

      const tokenPayload: TokenPayload = {
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role,
        companyId: session.user.companyId || undefined,
        branchId: session.user.branchId || undefined,
      };

      const newAccessToken = generateToken(tokenPayload);
      const newRefreshToken = generateRefreshToken(tokenPayload);

      await prisma.session.update({
        where: { id: session.id },
        data: { isActive: false },
      });

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await prisma.session.create({
        data: {
          userId: session.user.id,
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          accessTokenExp: new Date(Date.now() + 15 * 60 * 1000),
          refreshTokenExp: expiresAt,
          isActive: true,
        },
      });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(401, 'Invalid refresh token');
    }
  }

  async logout(refreshToken: string | undefined, userId: string) {
    if (refreshToken) {
      await prisma.session.updateMany({
        where: {
          refreshToken,
          userId,
        },
        data: { isActive: false },
      });
    } else {
      await prisma.session.updateMany({
        where: {
          userId,
          isActive: true,
        },
        data: { isActive: false },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'LOGOUT',
        entity: 'User',
        entityId: userId,
        changes: { action: 'User logged out' },
      },
    });
  }

  async changePassword(userId: string, data: ChangePasswordInput) {
    const { currentPassword, newPassword } = data;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new ApiError(401, 'Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    await prisma.session.updateMany({
      where: { userId },
      data: { isActive: false },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        entity: 'User',
        entityId: userId,
        changes: { action: 'Password changed' },
      },
    });
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(resetToken, 10);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.setting.upsert({
      where: { key: `password_reset:${email}` },
      update: {
        value: { token: hashedToken, expires: expiresAt.toISOString() },
      },
      create: {
        key: `password_reset:${email}`,
        value: { token: hashedToken, expires: expiresAt.toISOString() },
        category: 'security',
        description: 'Password reset token',
        isPublic: false,
      },
    });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${email}`;
    await sendEmail({
      to: email,
      subject: 'Password Reset Request',
      html: `
        <h1>Password Reset</h1>
        <p>Hello ${user.firstName},</p>
        <p>You requested to reset your password. Click the link below to reset it:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });
  }

  async resetPassword(data: ResetPasswordInput) {
    const { token, newPassword } = data;

    const settings = await prisma.setting.findMany({
      where: {
        key: {
          startsWith: 'password_reset:',
        },
      },
    });

    let foundSetting = null;
    let email = '';

    for (const setting of settings) {
      const value = setting.value as any;
      if (value && value.token) {
        const isValid = await bcrypt.compare(token, value.token);
        if (isValid) {
          const expires = new Date(value.expires);
          if (expires > new Date()) {
            foundSetting = setting;
            email = setting.key.replace('password_reset:', '');
            break;
          }
        }
      }
    }

    if (!foundSetting || !email) {
      throw new ApiError(400, 'Invalid or expired reset token');
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    await prisma.setting.delete({
      where: { key: foundSetting.key },
    });

    await prisma.session.updateMany({
      where: { userId: user.id },
      data: { isActive: false },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        entity: 'User',
        entityId: user.id,
        changes: { action: 'Password reset' },
      },
    });
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: true,
        branch: true,
        department: true,
        employee: true,
      },
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}