import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { JwtStrategy } from './jwt.strategy.js';
import { User } from '../user/entities/user.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { BusinessMember } from '../business/entities/business-member.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { PasswordResetToken } from './entities/password-reset-token.entity.js';
import { EventStoreModule } from '../../events/store/event-store.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Business, BusinessMember, Employee, PasswordResetToken]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('app.jwtSecret')!,
        signOptions: { expiresIn: config.get<string>('app.jwtExpiration')! as any },
      }),
    }),
    EventStoreModule,
    NotificationsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {}
