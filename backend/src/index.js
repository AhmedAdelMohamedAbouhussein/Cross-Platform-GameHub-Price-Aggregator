import mongoose from 'mongoose';
import config from './config/env.js';
import app from './app.js';
import { startWishlistCron, startPurgeCron, startAdminReportCron } from './utils/crons.js';

import userModel from './models/User.js'
import OtpSchema from './models/Otp.js';
import ResetPasswordSchema from './models/PasswordResetToken.js'

const PORT = config.port;
const MONGO_URL = config.mongoUri;
const APP_BACKEND_URL = config.appUrl;

const NODE_ENV = config.nodeEnv;

mongoose.connect(MONGO_URL)
    .then(async () => {
        console.log('Connected to MongoDB');

        if (NODE_ENV !== 'production') {
            mongoose.set('autoIndex', true);
            await userModel.init();
            await OtpSchema.init();
            await ResetPasswordSchema.init();
        }
        else {
            mongoose.set('autoIndex', false);
        }

        app.listen(PORT, "0.0.0.0", () => {
            console.log(` Server is running on ${APP_BACKEND_URL}`);
            startWishlistCron();
            startPurgeCron();
            startAdminReportCron();
        });
    })
    .catch((error) => {
        console.error(' MongoDB connection error:', error);
        process.exit(1);
    });