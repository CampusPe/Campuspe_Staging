"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../middleware/auth"));
const Connection_1 = __importDefault(require("../models/Connection"));
const User_1 = require("../models/User");
const Recruiter_1 = require("../models/Recruiter");
const Student_1 = require("../models/Student");
const College_1 = require("../models/College");
const router = express_1.default.Router();
router.post('/request', auth_1.default, async (req, res) => {
    try {
        const { targetId, targetType, message } = req.body;
        const userId = req.user._id;
        console.log('Connection request:', { userId, targetId, targetType, message });
        if (userId.toString() === targetId.toString()) {
            return res.status(400).json({ message: 'Cannot send connection request to yourself' });
        }
        let currentUserModelId = null;
        try {
            const userRole = req.user.role;
            if (userRole === 'recruiter') {
                const recruiterModel = await Recruiter_1.Recruiter.findOne({ userId: userId });
                currentUserModelId = recruiterModel?._id;
            }
            else if (userRole === 'college') {
                const collegeModel = await College_1.College.findOne({ userId: userId });
                currentUserModelId = collegeModel?._id;
            }
            else if (userRole === 'student') {
                const studentModel = await Student_1.Student.findOne({ userId: userId });
                currentUserModelId = studentModel?._id;
            }
            if (currentUserModelId && currentUserModelId.toString() === targetId.toString()) {
                return res.status(400).json({ message: 'Cannot send connection request to yourself' });
            }
        }
        catch (error) {
            console.warn('Error checking self-connection prevention:', error);
        }
        const searchIds = [userId];
        if (currentUserModelId) {
            searchIds.push(currentUserModelId);
        }
        const targetIds = [targetId];
        try {
            const targetUser = await User_1.User.findById(targetId);
            if (targetUser) {
                if (targetUser.role === 'recruiter') {
                    const recruiterModel = await Recruiter_1.Recruiter.findOne({ userId: targetId });
                    if (recruiterModel)
                        targetIds.push(recruiterModel._id);
                }
                else if (targetUser.role === 'college') {
                    const collegeModel = await College_1.College.findOne({ userId: targetId });
                    if (collegeModel)
                        targetIds.push(collegeModel._id);
                }
                else if (targetUser.role === 'student') {
                    const studentModel = await Student_1.Student.findOne({ userId: targetId });
                    if (studentModel)
                        targetIds.push(studentModel._id);
                }
            }
            else {
                const recruiterModel = await Recruiter_1.Recruiter.findById(targetId);
                if (recruiterModel) {
                    targetIds.push(recruiterModel.userId);
                }
                else {
                    const collegeModel = await College_1.College.findById(targetId);
                    if (collegeModel) {
                        targetIds.push(collegeModel.userId);
                    }
                    else {
                        const studentModel = await Student_1.Student.findById(targetId);
                        if (studentModel) {
                            targetIds.push(studentModel.userId);
                        }
                    }
                }
            }
        }
        catch (error) {
            console.warn('Error checking target ID type:', error);
        }
        const existingConnection = await Connection_1.default.findOne({
            $or: [
                { requester: { $in: searchIds }, target: { $in: targetIds } },
                { requester: { $in: targetIds }, target: { $in: searchIds } }
            ]
        });
        if (existingConnection) {
            return res.status(400).json({
                message: 'Connection already exists or is pending',
                status: existingConnection.status,
                connectionId: existingConnection._id
            });
        }
        const connection = new Connection_1.default({
            requester: userId,
            target: targetId,
            targetType,
            message,
            status: 'pending'
        });
        console.log('Creating connection with data:', connection.toObject());
        await connection.save();
        res.status(201).json({
            message: 'Connection request sent successfully',
            connection
        });
    }
    catch (error) {
        console.error('Error creating connection request:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
router.get('/', auth_1.default, async (req, res) => {
    try {
        const userId = req.user._id;
        const userRole = req.user.role;
        console.log('Fetching connections for user:', userId, 'role:', userRole);
        let modelId = null;
        try {
            if (userRole === 'recruiter') {
                const recruiterModel = await Recruiter_1.Recruiter.findOne({ userId: userId });
                modelId = recruiterModel?._id;
            }
            else if (userRole === 'college') {
                const collegeModel = await College_1.College.findOne({ userId: userId });
                modelId = collegeModel?._id;
            }
            else if (userRole === 'student') {
                const studentModel = await Student_1.Student.findOne({ userId: userId });
                modelId = studentModel?._id;
            }
        }
        catch (error) {
            console.warn('Error finding model ID:', error);
        }
        const searchIds = [userId];
        if (modelId) {
            searchIds.push(modelId);
            console.log('Also searching for model ID:', modelId);
        }
        const connections = await Connection_1.default.find({
            $or: [
                { requester: { $in: searchIds } },
                { target: { $in: searchIds } }
            ]
        })
            .sort({ createdAt: -1 });
        console.log(`Found ${connections.length} connections`);
        const transformedConnections = await Promise.all(connections.map(async (conn) => {
            const getProfileData = async (id) => {
                let profile = { firstName: 'Unknown', lastName: '', designation: '' };
                let companyInfo = null;
                let userInfo = { email: 'Unknown', role: 'unknown' };
                try {
                    const user = await User_1.User.findById(id);
                    if (user) {
                        userInfo = { email: user.email, role: user.role };
                        if (user.role === 'recruiter') {
                            const recruiterData = await Recruiter_1.Recruiter.findOne({ userId: id });
                            if (recruiterData?.recruiterProfile) {
                                profile = {
                                    firstName: recruiterData.recruiterProfile.firstName || 'Unknown',
                                    lastName: recruiterData.recruiterProfile.lastName || '',
                                    designation: recruiterData.recruiterProfile.designation || ''
                                };
                                companyInfo = recruiterData.companyInfo;
                            }
                        }
                        else if (user.role === 'student') {
                            const studentData = await Student_1.Student.findOne({ userId: id });
                            if (studentData) {
                                profile = {
                                    firstName: studentData.firstName || 'Unknown',
                                    lastName: studentData.lastName || '',
                                    designation: 'Student'
                                };
                            }
                        }
                        else if (user.role === 'college') {
                            const collegeData = await College_1.College.findOne({ userId: id });
                            if (collegeData) {
                                profile = {
                                    firstName: collegeData.name || 'Unknown',
                                    lastName: '',
                                    designation: 'College'
                                };
                            }
                        }
                    }
                    else {
                        const recruiterModel = await Recruiter_1.Recruiter.findById(id);
                        if (recruiterModel) {
                            const user = await User_1.User.findById(recruiterModel.userId);
                            userInfo = { email: user?.email || 'Unknown', role: 'recruiter' };
                            if (recruiterModel.recruiterProfile) {
                                profile = {
                                    firstName: recruiterModel.recruiterProfile.firstName || 'Unknown',
                                    lastName: recruiterModel.recruiterProfile.lastName || '',
                                    designation: recruiterModel.recruiterProfile.designation || ''
                                };
                                companyInfo = recruiterModel.companyInfo;
                            }
                            return { profile, companyInfo, userInfo, actualUserId: recruiterModel.userId };
                        }
                        const collegeModel = await College_1.College.findById(id);
                        if (collegeModel) {
                            const user = await User_1.User.findById(collegeModel.userId);
                            userInfo = { email: user?.email || 'Unknown', role: 'college' };
                            profile = {
                                firstName: collegeModel.name || 'Unknown',
                                lastName: '',
                                designation: 'College'
                            };
                            return { profile, companyInfo, userInfo, actualUserId: collegeModel.userId };
                        }
                        const studentModel = await Student_1.Student.findById(id);
                        if (studentModel) {
                            const user = await User_1.User.findById(studentModel.userId);
                            userInfo = { email: user?.email || 'Unknown', role: 'student' };
                            profile = {
                                firstName: studentModel.firstName || 'Unknown',
                                lastName: studentModel.lastName || '',
                                designation: 'Student'
                            };
                            return { profile, companyInfo, userInfo, actualUserId: studentModel.userId };
                        }
                    }
                }
                catch (error) {
                    console.error(`Error fetching profile for ID ${id}:`, error);
                }
                return { profile, companyInfo, userInfo, actualUserId: id };
            };
            let actualCurrentUserId = userId;
            let actualRequesterUserId = null;
            let actualTargetUserId = null;
            try {
                const requesterUser = await User_1.User.findById(conn.requester);
                if (requesterUser) {
                    actualRequesterUserId = conn.requester;
                }
                else {
                    const recruiterModel = await Recruiter_1.Recruiter.findById(conn.requester);
                    const collegeModel = await College_1.College.findById(conn.requester);
                    const studentModel = await Student_1.Student.findById(conn.requester);
                    actualRequesterUserId = recruiterModel?.userId || collegeModel?.userId || studentModel?.userId;
                }
                const targetUser = await User_1.User.findById(conn.target);
                if (targetUser) {
                    actualTargetUserId = conn.target;
                }
                else {
                    const recruiterModel = await Recruiter_1.Recruiter.findById(conn.target);
                    const collegeModel = await College_1.College.findById(conn.target);
                    const studentModel = await Student_1.Student.findById(conn.target);
                    actualTargetUserId = recruiterModel?.userId || collegeModel?.userId || studentModel?.userId;
                }
            }
            catch (error) {
                console.error('Error resolving user IDs:', error);
            }
            const isRequester = actualCurrentUserId.toString() === actualRequesterUserId?.toString();
            console.log('isRequester calculation:', {
                currentUserId: actualCurrentUserId,
                requesterUserId: actualRequesterUserId,
                targetUserId: actualTargetUserId,
                isRequester: isRequester
            });
            const requesterData = await getProfileData(conn.requester);
            const targetData = await getProfileData(conn.target);
            return {
                _id: conn._id,
                requester: {
                    _id: conn.requester,
                    name: `${requesterData.profile.firstName} ${requesterData.profile.lastName}`.trim(),
                    email: requesterData.userInfo.email,
                    userType: requesterData.userInfo.role,
                    profile: requesterData.profile,
                    companyInfo: requesterData.companyInfo
                },
                target: {
                    _id: conn.target,
                    name: `${targetData.profile.firstName} ${targetData.profile.lastName}`.trim(),
                    email: targetData.userInfo.email,
                    userType: targetData.userInfo.role,
                    profile: targetData.profile,
                    companyInfo: targetData.companyInfo
                },
                status: conn.status,
                message: conn.message,
                createdAt: conn.createdAt,
                acceptedAt: conn.acceptedAt,
                isRequester: isRequester
            };
        }));
        res.json(transformedConnections);
    }
    catch (error) {
        console.error('Error fetching connections:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
router.post('/:connectionId/accept', auth_1.default, async (req, res) => {
    try {
        const { connectionId } = req.params;
        const userId = req.user._id;
        const userRole = req.user.role;
        console.log('Accept connection request:', { connectionId, userId, userRole });
        const connection = await Connection_1.default.findById(connectionId);
        if (!connection) {
            return res.status(404).json({ message: 'Connection not found' });
        }
        console.log('Connection found:', {
            target: connection.target,
            requester: connection.requester,
            status: connection.status
        });
        let modelId = null;
        try {
            if (userRole === 'recruiter') {
                const recruiterModel = await Recruiter_1.Recruiter.findOne({ userId: userId });
                modelId = recruiterModel?._id;
            }
            else if (userRole === 'college') {
                const collegeModel = await College_1.College.findOne({ userId: userId });
                modelId = collegeModel?._id;
            }
            else if (userRole === 'student') {
                const studentModel = await Student_1.Student.findOne({ userId: userId });
                modelId = studentModel?._id;
            }
        }
        catch (error) {
            console.warn('Error finding model ID for authorization:', error);
        }
        const targetIds = [userId];
        if (modelId) {
            targetIds.push(modelId);
        }
        const isAuthorized = targetIds.some(id => connection.target.toString() === id.toString());
        if (!isAuthorized) {
            console.log('Authorization failed:', {
                targetIds,
                connectionTarget: connection.target.toString()
            });
            return res.status(403).json({ message: 'Unauthorized - you can only accept connections sent to you' });
        }
        connection.status = 'accepted';
        connection.acceptedAt = new Date();
        await connection.save();
        console.log('Connection accepted successfully');
        res.json({ message: 'Connection accepted', connection });
    }
    catch (error) {
        console.error('Error accepting connection:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
router.post('/:connectionId/decline', auth_1.default, async (req, res) => {
    try {
        const { connectionId } = req.params;
        const userId = req.user._id;
        const userRole = req.user.role;
        console.log('Decline connection request:', { connectionId, userId, userRole });
        const connection = await Connection_1.default.findById(connectionId);
        if (!connection) {
            return res.status(404).json({ message: 'Connection not found' });
        }
        console.log('Connection found:', {
            target: connection.target,
            requester: connection.requester,
            status: connection.status
        });
        let modelId = null;
        try {
            if (userRole === 'recruiter') {
                const recruiterModel = await Recruiter_1.Recruiter.findOne({ userId: userId });
                modelId = recruiterModel?._id;
            }
            else if (userRole === 'college') {
                const collegeModel = await College_1.College.findOne({ userId: userId });
                modelId = collegeModel?._id;
            }
            else if (userRole === 'student') {
                const studentModel = await Student_1.Student.findOne({ userId: userId });
                modelId = studentModel?._id;
            }
        }
        catch (error) {
            console.warn('Error finding model ID for authorization:', error);
        }
        const targetIds = [userId];
        if (modelId) {
            targetIds.push(modelId);
        }
        const isAuthorized = targetIds.some(id => connection.target.toString() === id.toString());
        if (!isAuthorized) {
            console.log('Authorization failed:', {
                targetIds,
                connectionTarget: connection.target.toString()
            });
            return res.status(403).json({ message: 'Unauthorized - you can only decline connections sent to you' });
        }
        connection.status = 'declined';
        await connection.save();
        console.log('Connection declined successfully');
        res.json({ message: 'Connection declined', connection });
    }
    catch (error) {
        console.error('Error declining connection:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
router.delete('/:id', auth_1.default, async (req, res) => {
    try {
        const connectionId = req.params.id;
        const userId = req.user._id;
        console.log('Attempting to withdraw connection:', { connectionId, userId });
        const connection = await Connection_1.default.findById(connectionId);
        if (!connection) {
            return res.status(404).json({ message: 'Connection not found' });
        }
        console.log('Found connection:', {
            requester: connection.requester,
            target: connection.target,
            status: connection.status
        });
        if (connection.requester.toString() !== userId.toString()) {
            console.log('Authorization failed - user is not the requester:', {
                requesterIdString: connection.requester.toString(),
                userIdString: userId.toString()
            });
            return res.status(403).json({ message: 'Unauthorized - you can only withdraw connection requests that you sent' });
        }
        if (connection.status !== 'pending') {
            return res.status(400).json({ message: 'Can only withdraw pending connection requests' });
        }
        await Connection_1.default.findByIdAndDelete(connectionId);
        console.log('Connection withdrawn successfully');
        res.json({ message: 'Connection request withdrawn successfully' });
    }
    catch (error) {
        console.error('Error withdrawing connection:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.default = router;
