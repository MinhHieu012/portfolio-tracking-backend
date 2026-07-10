import { DataSource } from 'typeorm';
import { User } from './src/modules/users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
dotenv.config();

const ds = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'portfolio',
  entities: [User],
});

ds.initialize().then(async () => {
  const user = await ds.getRepository(User).findOne({ where: { email: '0967710509hieu@gmail.com' } });
  if (!user) return console.log('User not found');
  
  const expiresAt = new Date(user.resetPasswordOtpExpires as Date);
  const now = new Date();
  console.log(`expiresAt: ${expiresAt.toISOString()}`);
  console.log(`now: ${now.toISOString()}`);
  console.log(`Is expired? ${expiresAt < now}`);
  
  const otpFromLog = '546194'; // Testing against the OTP from the user's terminal
  if (user.resetPasswordOtp) {
    const isOtpValid = await bcrypt.compare(otpFromLog, user.resetPasswordOtp);
    console.log(`Is OTP valid? ${isOtpValid}`);
  }
  
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
