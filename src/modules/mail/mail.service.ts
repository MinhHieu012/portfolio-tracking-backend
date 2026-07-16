import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendPasswordResetOtp(email: string, otp: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Mã xác nhận đặt lại mật khẩu',
        template: './reset-password', // relative path to templates dir
        context: {
          otp,
        },
      });
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}`, error.stack);
      throw error;
    }
  }
}
