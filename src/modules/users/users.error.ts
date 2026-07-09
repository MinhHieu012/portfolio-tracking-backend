export const UserError = {
  EMAIL_ALREADY_EXISTS: {
    code: 'USER_EMAIL_ALREADY_EXISTS',
    message: 'Email already registered',
  },
  USER_NOT_FOUND: {
    code: 'USER_NOT_FOUND',
    message: 'User not found',
  },
} as const;
