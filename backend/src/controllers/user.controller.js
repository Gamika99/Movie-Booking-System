const userService = require('../services/user.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

class UserController {
    getAllUsers = asyncHandler(async(req, res) => {
        const { page = 1, limit = 10, role, isBlocked, isEmailVerified, search } = req.query;

        const users = await userService.getAllUsers({ role, isBlocked, isEmailVerified, search }, { page: parseInt(page), limit: parseInt(limit) });

        res.json(ApiResponse.success(users, 'Users retrieved successfully'));
    });

    getUserById = asyncHandler(async(req, res) => {
        const { id } = req.params;
        const user = await userService.getUserById(id);
        res.json(ApiResponse.success(user, 'User details retrieved'));
    });

    updateUserProfile = asyncHandler(async(req, res) => {
        const { id } = req.params;
        const updateData = req.body;

        // Check authorization - users can only update themselves, admins can update anyone
        if (req.userId !== id && req.userRole !== 'admin' && req.userRole !== 'super-admin') {
            return res.status(403).json(ApiResponse.error('You can only update your own profile'));
        }

        const user = await userService.updateUserProfile(id, updateData);
        res.json(ApiResponse.success(user, 'User profile updated'));
    });

    blockUser = asyncHandler(async(req, res) => {
        const { id } = req.params;
        const user = await userService.blockUser(id, req.userId);
        res.json(ApiResponse.success(user, 'User blocked successfully'));
    });

    unblockUser = asyncHandler(async(req, res) => {
        const { id } = req.params;
        const user = await userService.unblockUser(id, req.userId);
        res.json(ApiResponse.success(user, 'User unblocked successfully'));
    });

    deleteUser = asyncHandler(async(req, res) => {
        const { id } = req.params;
        await userService.deleteUser(id, req.userId);
        res.json(ApiResponse.success(null, 'User deleted successfully'));
    });

    changeUserRole = asyncHandler(async(req, res) => {
        const { id } = req.params;
        const { role } = req.body;
        const user = await userService.changeUserRole(id, role, req.userId);
        res.json(ApiResponse.success(user, 'User role updated'));
    });

    getUserStats = asyncHandler(async(req, res) => {
        const stats = await userService.getUserStats();
        res.json(ApiResponse.success(stats, 'User statistics retrieved'));
    });
}

module.exports = new UserController();