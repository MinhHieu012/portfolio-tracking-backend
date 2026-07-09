export const AuthError = {
  INVALID_CREDENTIALS: {
    code: 'AUTH_INVALID_CREDENTIALS',
    message: 'Invalid credentials',
  },
  TOKEN_EXPIRED: {
    code: 'AUTH_TOKEN_EXPIRED',
    message: 'Invalid or expired refresh token',
  },
  TOKEN_NOT_RECOGNIZED: {
    code: 'AUTH_TOKEN_NOT_RECOGNIZED',
    message: 'Refresh token not recognized',
  },
} as const;
