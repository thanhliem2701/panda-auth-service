import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MessagePattern, EventPattern } from '@nestjs/microservices';

@Controller()
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    //Admin sign in
    @MessagePattern("admin_login")
    async adminSignIn(data: { email: string, pw: string }) {
        return await this.authService.adminSignIn(data.email, data.pw);
    }
    // Verify admin token
    @MessagePattern("verify_admin_token")
    async verifyAdminToken(@Body() data: { token: string }) {
        return await this.authService.verifyAdminToken(data.token);
    }
    //User sign in
    @MessagePattern("user_login")
    async userSignIn(data: { email: string, pw: string }) {
        return await this.authService.userSignIn(data.email, data.pw);
    }
    //Verify token
    @MessagePattern("verify_token")
    async verifyToken(@Body() data: { token: string, secret_code: string }) {
        return await this.authService.verifyToken(data.token, data.secret_code);
    }
    //User refresh token
    @MessagePattern("user_refresh_token")
    async refreshToken(data: { refreshToken: string, secret_code: string }) {
        return await this.authService.refreshToken(data.refreshToken, data.secret_code);
    }
}
