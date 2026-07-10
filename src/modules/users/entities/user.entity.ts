import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@ObjectType()
@Entity('users')
export class User {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ unique: true })
  email: string;

  // passwordHash is intentionally NOT exposed to GraphQL
  @Column()
  passwordHash: string;

  @Column({ type: 'varchar', nullable: true })
  resetPasswordOtp?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  resetPasswordOtpExpires?: Date | null;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
