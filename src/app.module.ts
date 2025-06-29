import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [PrismaModule,ConfigModule.forRoot({isGlobal:true}), AuthModule,
    JwtModule.register({global: true})
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
