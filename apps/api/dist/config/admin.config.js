"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDefaultAdmin = exports.getAdminConfig = exports.ADMIN_CONFIG = void 0;
exports.ADMIN_CONFIG = {
    email: 'admin@gmail.com',
    password: 'admin123',
    name: 'CampusPe Admin',
    role: 'admin',
    permissions: {
        canApproveColleges: true,
        canApproveRecruiters: true,
        canSuspendAccounts: true,
        canViewAllData: true,
        canManageUsers: true,
        canViewAnalytics: true,
        canDeactivateAccounts: true,
        canSendMessages: true,
        canSendBroadcasts: true,
    },
    tokenExpiryHours: 24,
    maxLoginAttempts: 5,
    defaultApprovalStatus: 'pending',
    autoApproval: false,
};
const getAdminConfig = () => {
    return {
        ...exports.ADMIN_CONFIG,
        email: process.env.ADMIN_EMAIL || exports.ADMIN_CONFIG.email,
        password: process.env.ADMIN_PASSWORD || exports.ADMIN_CONFIG.password,
        name: process.env.ADMIN_NAME || exports.ADMIN_CONFIG.name,
    };
};
exports.getAdminConfig = getAdminConfig;
const createDefaultAdmin = () => {
    const config = (0, exports.getAdminConfig)();
    return {
        email: config.email,
        password: config.password,
        name: config.name,
        role: config.role,
        permissions: config.permissions,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
};
exports.createDefaultAdmin = createDefaultAdmin;
