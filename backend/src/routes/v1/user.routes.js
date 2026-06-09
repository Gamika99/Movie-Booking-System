const express = require('express');
const router = express.Router();
const userController = require('../../controllers/user.controller');
const { protect } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');

// Protected routes
router.use(protect);

// User self-service routes
router.get('/me', userController.getUserById);
router.put('/me', userController.updateUserProfile);

// Admin only routes
router.use(authorize('admin', 'super-admin'));

router.get('/', userController.getAllUsers);
router.get('/stats', userController.getUserStats);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUserProfile);
router.post('/:id/block', userController.blockUser);
router.post('/:id/unblock', userController.unblockUser);
router.delete('/:id', userController.deleteUser);
router.put('/:id/role', userController.changeUserRole);

module.exports = router;