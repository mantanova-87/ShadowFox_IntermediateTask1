const dotenv = require('dotenv');
const Joi = require('joi');

// Load environment variables from .env
dotenv.config();

// Define Joi schema for validating environment variables
const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().port().default(3000),
  MONGO_URI: Joi.string().required().description('MongoDB connection string'),
  JWT_SECRET: Joi.string().required().min(16).description('JWT signing secret'),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  BCRYPT_ROUNDS: Joi.number().integer().min(4).max(31).default(12),
  SMTP_HOST: Joi.string().allow(''),
  SMTP_PORT: Joi.number().integer().allow(null, ''),
  SMTP_USER: Joi.string().allow(''),
  SMTP_PASS: Joi.string().allow(''),
  SMTP_FROM: Joi.string().default('"E-Bazar" <noreply@e-bazar.com>'),
  ADMIN_PATH: Joi.string().pattern(/^\/[a-zA-Z0-9\-_]+$/).required().description('Unlisted admin URL path'),
  CLOUDINARY_URL: Joi.string().allow(''),
  AI_API_KEY: Joi.string().allow(''),
  VISION_API_KEY: Joi.string().allow(''),
}).unknown().required();

// Validate process.env
const { value: envVars, error } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error in environment variables: ${error.message}`);
}

module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  mongoUri: envVars.MONGO_URI,
  jwtSecret: envVars.JWT_SECRET,
  jwtExpiresIn: envVars.JWT_EXPIRES_IN,
  bcryptRounds: envVars.BCRYPT_ROUNDS,
  smtp: {
    host: envVars.SMTP_HOST,
    port: envVars.SMTP_PORT,
    user: envVars.SMTP_USER,
    pass: envVars.SMTP_PASS,
    from: envVars.SMTP_FROM,
  },
  adminPath: envVars.ADMIN_PATH,
  cloudinaryUrl: envVars.CLOUDINARY_URL,
  aiApiKey: envVars.AI_API_KEY,
  visionApiKey: envVars.VISION_API_KEY,
};
