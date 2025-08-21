"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPermission = exports.adminMiddleware = void 0;
const Admin_1 = require("../models/Admin");
const admin_config_1 = require("../config/admin.config");
const adminMiddleware = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }
        if (req.user.userId === 'admin') {
            const adminConfig = (0, admin_config_1.getAdminConfig)();
            req.admin = {
                _id: 'admin',
                userId: 'admin',
                email: adminConfig.email,
                name: adminConfig.name,
                role: 'admin',
                permissions: adminConfig.permissions,
                isActive: true
            };
            return next();
        }
        const admin = await Admin_1.Admin.findOne({ userId: req.user._id });
        if (!admin || !admin.isActive) {
            return res.status(403).json({ message: 'Admin account not found or inactive' });
        }
        req.admin = admin;
        next();
    }
    catch (error) {
        console.error('Admin middleware error:', error);
        res.status(500).json({ message: 'Server error in admin middleware' });
    }
};
exports.adminMiddleware = adminMiddleware;
const checkPermission = (permission) => {
    return (req, res, next) => {
        const admin = req.admin;
        if (!admin) {
            return res.status(403).json({ message: 'Admin access required' });
        }
        switch (permission) {
            case 'approve_colleges':
                if (!admin.permissions.canApproveColleges) {
                    return res.status(403).json({ message: 'Permission denied: Cannot approve colleges' });
                }
                break;
            case 'approve_recruiters':
                if (!admin.permissions.canApproveRecruiters) {
                    return res.status(403).json({ message: 'Permission denied: Cannot approve recruiters' });
                }
                break;
            case 'manage_users':
                if (!admin.permissions.canManageUsers) {
                    return res.status(403).json({ message: 'Permission denied: Cannot manage users' });
                }
                break;
            case 'view_analytics':
                if (!admin.permissions.canViewAnalytics) {
                    return res.status(403).json({ message: 'Permission denied: Cannot view analytics' });
                }
                break;
            default:
                return res.status(403).json({ message: 'Invalid permission' });
        }
        next();
    };
};
exports.checkPermission = checkPermission;
