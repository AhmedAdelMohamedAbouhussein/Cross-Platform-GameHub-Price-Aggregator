import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    sender: {
        type: String, // PublicID of the sender
        required: true
    },
    type: {
        type: String,
        enum: ['friend_request', 'deal_alert', 'system', 'token_expired'],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    link: {
        type: String,
        default: '/'
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: { expires: '30d' } // Automatic deletion after 30 days
    }
}, {
    timestamps: false // We use our own createdAt with TTL
});

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
