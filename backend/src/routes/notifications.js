import express from 'express';
import { 
    getUserNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
} from '../controllers/notifications/notificationController.js';
import requireAuth from '../middleware/requireAuth.js';

const router = express.Router();

// All notification routes require authentication
router.use(requireAuth);

router.get('/', getUserNotifications);
router.patch('/:id/read', markAsRead);
router.post('/read-all', markAllAsRead);
router.delete('/:id', deleteNotification);

export default router;
