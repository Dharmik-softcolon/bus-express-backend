import dotenvFlow from 'dotenv-flow';

dotenvFlow.config();

export default {
  common: {
    PORT: process.env.PORT as string,
    NODE_ENV: process.env.NODE_ENV as string,
  },

  email: {
    FROM_EMAIL: process.env.FROM_EMAIL as string,
    FROM_NAME: process.env.FROM_NAME as string,
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY as string,
    HOST: process.env.EMAIL_HOST as string,
    PORT: process.env.EMAIL_PORT as string,
    USER: process.env.EMAIL_USER as string,
    PASS: process.env.EMAIL_PASS as string,
  },

  jwt: {
    SECRET_KEY: process.env.JWT_SECRET as string,
    EXPIRY: process.env.JWT_EXPIRE as string,
    REFRESH_SECRET: process.env.JWT_REFRESH_SECRET as string,
    REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE as string,
  },

  mongodb: {
    URL: process.env.MONGODB_URI as string,
  },

  otp: {
    EXPIRE_MINUTES: process.env.OTP_EXPIRE_MINUTES as string,
    LENGTH: process.env.OTP_LENGTH as string,
  },

  passwordReset: {
    EXPIRE_MINUTES: process.env.PASSWORD_RESET_EXPIRE_MINUTES as string,
  },

  app: {
    CLIENT_URL: process.env.CLIENT_URL as string,
    BASE_URL: process.env.BASE_URL as string,
    FRONTEND_URL: process.env.FRONTEND_URL as string,
  },

  google: {
    CLIENT_ID: process.env.GOOGLE_CLIENT_ID as string,
    CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET as string,
    CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL as string,
  },

  rateLimit: {
    WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS as string,
    MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS as string,
  },

  stripe: {
    SECRET_KEY: process.env.STRIPE_SECRET_KEY as string,
    PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY as string,
    WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET as string,
    CURRENCY: process.env.STRIPE_CURRENCY as string || 'usd',
  },

  fileUpload: {
    MAX_SIZE: process.env.MAX_FILE_SIZE as string,
    UPLOAD_PATH: process.env.UPLOAD_PATH as string,
    ALLOWED_TYPES: process.env.ALLOWED_FILE_TYPES as string,
  },

  cors: {
    ORIGIN: process.env.CORS_ORIGIN as string,
  },
};

