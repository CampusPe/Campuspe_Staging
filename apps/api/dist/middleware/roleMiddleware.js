"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tpoOrAdmin = exports.recruiterOrAdmin = exports.adminOnly = exports.studentOnly = exports.tpoOnly = exports.recruiterOnly = exports.roleMiddleware = void 0;
const entityAccess_1 = require("./entityAccess");
const roleMiddleware = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }
            const userRole = req.user.role;
            if (!allowedRoles.includes(userRole)) {
                return res.status(403).json({
                    success: false,
                    message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
                });
            }
            if (userRole === 'recruiter' && allowedRoles.includes('recruiter')) {
                return (0, entityAccess_1.checkRecruiterAccess)(req, res, next);
            }
            if ((userRole === 'college' || userRole === 'tpo' || userRole === 'college_admin') &&
                (allowedRoles.includes('college') || allowedRoles.includes('tpo') || allowedRoles.includes('college_admin'))) {
                return (0, entityAccess_1.checkCollegeAccess)(req, res, next);
            }
            if (userRole === 'admin' && allowedRoles.includes('admin')) {
                return next();
            }
            if (userRole === 'student' && allowedRoles.includes('student')) {
                return next();
            }
            next();
        }
        catch (error) {
            console.error('Role middleware error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error in role authorization'
            });
        }
    };
};
exports.roleMiddleware = roleMiddleware;
exports.recruiterOnly = (0, exports.roleMiddleware)(['recruiter']);
exports.tpoOnly = (0, exports.roleMiddleware)(['tpo', 'college_admin', 'college']);
exports.studentOnly = (0, exports.roleMiddleware)(['student']);
exports.adminOnly = (0, exports.roleMiddleware)(['admin']);
exports.recruiterOrAdmin = (0, exports.roleMiddleware)(['recruiter', 'admin']);
exports.tpoOrAdmin = (0, exports.roleMiddleware)(['tpo', 'college_admin', 'college', 'admin']);
