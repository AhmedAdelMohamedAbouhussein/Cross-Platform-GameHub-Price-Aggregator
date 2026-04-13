import Notification from '../../models/Notification.js';

/**
 * @desc    Get current user's notifications
 * @route   GET /api/notifications
 * @access  Private
 */
export const getUserNotifications = async (req, res, next) => {
    try {
        const notifications = await Notification.find({ recipient: req.session.userId })
            .sort({ createdAt: -1 })
            .limit(50);
        
        const unreadCount = await Notification.countDocuments({ 
            recipient: req.session.userId, 
            isRead: false 
        });

        res.status(200).json({ notifications, unreadCount });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Mark a single notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Private
 */
export const markAsRead = async (req, res, next) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: req.session.userId },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.status(200).json({ message: "Notification marked as read", notification });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Mark all unread notifications as read
 * @route   POST /api/notifications/read-all
 * @access  Private
 */
export const markAllAsRead = async (req, res, next) => {
    try {
        await Notification.updateMany(
            { recipient: req.session.userId, isRead: false },
            { isRead: true }
        );

        res.status(200).json({ message: "All notifications marked as read" });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete a notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
export const deleteNotification = async (req, res, next) => {
    try {
        const notification = await Notification.findOneAndDelete({ 
            _id: req.params.id, 
            recipient: req.session.userId 
        });

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.status(200).json({ message: "Notification deleted" });
    } catch (error) {
        next(error);
    }
};
