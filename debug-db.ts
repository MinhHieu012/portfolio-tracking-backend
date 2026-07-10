import { DataSource } from 'typeorm';
import { User } from './src/modules/users/entities/user.entity';
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
  const users = await ds.getRepository(User).find();
  console.log('Users:');
  for (const u of users) {
    console.log(`Email: ${u.email}, OTP: ${u.resetPasswordOtp}, Expires: ${u.resetPasswordOtpExpires}`);
  }
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
