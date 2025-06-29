import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { messages } from 'src/common/messages';
import * as bcrypts from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConstantCodes } from 'src/common/constants';
import { constants } from 'buffer';

@Injectable()
export class AuthService {
  constructor(
    public Prisma: PrismaService,
    private jwtService: JwtService,
    private readonly configService: ConfigService
  ) { }

  //Admin Sign In
  async adminSignIn(email: string, pw: string) {
    //check null
    if (!email || !pw) return messages.EMAIL_PASSWORD_NULL
    //check email exist
    const admin = await this.Prisma.user_admin.findUnique({ where: { email } });
    if (!admin) return messages.EMAIL_NOT_FOUND;
    //check password match
    const isMatch = await bcrypts.compare(pw, admin.pw);
    if (!isMatch) return messages.PASSWORD_INCORRECT;

    // generate Active token valid for 1 day
    const { token } = await this.adminGenerateToken(
      admin.email,
      admin.first_name ?? 'admin',
      admin.last_name ?? 'Mr'
    )
    //take out password before return to client
    const { pw: _, ...admin_info } = admin;
    return { admin_info, token }
  }

  //generate token expire in 1 day
  async adminGenerateToken(email: string, first_name: string, last_name: string) {
    //Generate Access Token expire in 1 day
    const token = await this.jwtService.signAsync({ data: { email, first_name, last_name } }, {
      algorithm: 'HS256',
      secret: this.configService.get<string>(ConstantCodes.JWT_SECRET_KEY),
      expiresIn: '1d'
    });
    return { token }
  }
  //Verify admin token
  async verifyAdminToken(token: string) {
    try {
      // verify token
      const payload = await this.jwtService.verifyAsync(token, { secret: this.configService.get<string>(ConstantCodes.JWT_SECRET_KEY) });
      // get user admin info
      const admin = await this.Prisma.user_admin.findUnique({ where: { email: payload.data.email } });
      if (!admin) return messages.TOKEN_VERIFICATION_FAILED;
      const { pw: _, ...admin_info } = admin;
      return admin_info;
    }
    catch {
      return messages.TOKEN_VERIFICATION_FAILED;
    }
  }
  //Get user info by email
  async getUserInfo(email: string) {
    return await this.Prisma.users.findUnique({ where: { email } });
  }
  // User sign in 
  async userSignIn(email: string, pw: string) {
    //Check null
    if (!email || !pw) return messages.EMAIL_PASSWORD_NULL
    //check email exist
    const user = await this.getUserInfo(email);
    if (!user) return messages.EMAIL_NOT_FOUND;
    //check password match
    const isMatch = await bcrypts.compare(pw, user.pw);
    if (!isMatch) return messages.PASSWORD_INCORRECT;

    // generate Active token valid for 1 day and refresh token valid for 7 days
    const { token, refresh_token } = await this.generateToken(
      user.email,
      user.first_name ?? 'user',
      user.last_name ?? 'Mr/Mrs'
    )
    //take out password before return to client
    const { pw: _, ...user_info } = user;
    return { user_info, token, refresh_token }
  }
  //Generate Token & refresh token valid in 7 days
  async generateToken(email: string, first_name: string, last_name: string) {
    //Generate Access Token expire in 1 day
    const token = await this.jwtService.signAsync({ data: { email, first_name, last_name } }, {
      algorithm: 'HS256',
      secret: this.configService.get<string>(ConstantCodes.JWT_SECRET_KEY),
      expiresIn: '1d'
    });
    //Generate Refresh Token expire in 1 week
    const refresh_token = await this.jwtService.signAsync({ data: { email, first_name, last_name } }, {
      algorithm: 'HS256',
      secret: this.configService.get<string>(ConstantCodes.JWT_REFRESH_SECRET_KEY),
      expiresIn: '7d'
    });
    return { token, refresh_token }
  }
  //Verify token
  async verifyToken(token: string, secret_code: string) {
    try {
      switch (secret_code) {
        case ConstantCodes.TOKEN_CODE:
          const accessPayload = await this.jwtService.verifyAsync(token, { secret: this.configService.get<string>(ConstantCodes.JWT_SECRET_KEY) });
          // Get user info/sign in again
          const user = await this.getUserInfo(accessPayload.data.email);
          if (!user) {
            return messages.TOKEN_VERIFICATION_FAILED;
          }
          const { pw: _, ...user_info } = user;
          return user_info;
        case ConstantCodes.REFRESH_TOKEN_CODE:
          const refreshPayload = await this.jwtService.verifyAsync(token, { secret: this.configService.get<string>(ConstantCodes.JWT_REFRESH_SECRET_KEY) });
          // Get user info/sign in again
          const user_ref = await this.getUserInfo(refreshPayload.data.email);
          if (!user_ref) {
            return messages.TOKEN_VERIFICATION_FAILED;
          }
          const { pw: _r, ...user_ref_info } = user_ref;
          return user_ref_info;
        default:
          return messages.TOKEN_VERIFICATION_FAILED;
      }
    }
    catch (error) {
      return error.name;
    }
  }
  //Refresh token
  async refreshToken(current_refresh_token: string, secret_code: string) {
    try {
      //check refresh token valid/expired
      const user = await this.verifyToken(current_refresh_token, secret_code);
      // refresh token not valid or expired
      if (!user) {
        return messages.TOKEN_VERIFICATION_FAILED;
      }
      const { pw: _, ...user_info } = user;
      const { token, refresh_token } = await this.generateToken(user.email, user.first_name, user.last_name);
      return { user_info, token, refresh_token };
    }
    catch { return messages.TOKEN_VERIFICATION_FAILED; }

  }
}
