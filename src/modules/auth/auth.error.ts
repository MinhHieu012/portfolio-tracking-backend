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
  OTP_INVALID: {
    code: 'AUTH_OTP_INVALID',
    message: 'Invalid OTP',
  },
  OTP_EXPIRED: {
    code: 'AUTH_OTP_EXPIRED',
    message: 'OTP has expired',
  },
} as const;
