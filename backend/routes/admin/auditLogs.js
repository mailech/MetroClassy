import express from 'express';
import AuditLog from '../../models/AuditLog.js';
import { adminAuth } from '../../middleware/auth.js';

const router = express.Router();

router.use(adminAuth);

// Get audit logs
router.get('/', async (req, res) => {
  try {
    console.log('AuditLogs API Request Received:', req.query);
    const {
      adminUser,
      actionType,
      resourceType,
      resourceId,
      page = 1,
      limit = 50,
      startDate,
      endDate,
    } = req.query;

    const query = {};

    if (adminUser) query.adminUser = adminUser;
    if (actionType) query.actionType = actionType;
    if (resourceType) query.resourceType = resourceType;
    if (resourceId) query.resourceId = resourceId;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(); // Use lean for better performance

    // ALWAYS use stored adminName/adminEmail for historical accuracy
    // Never populate from user document as user.name may change over time
    const logsWithStoredNames = logs.map(log => ({
      ...log,
      adminUser: {
        _id: log.adminUser || null,
        name: log.adminName || 'Unknown', // Always use stored name at time of action
        email: log.adminEmail || 'Unknown', // Always use stored email at time of action
      }
    }));

    const total = await AuditLog.countDocuments(query);
    console.log(`Found ${logs.length} logs (Total: ${total})`);

    res.json({
      logs: logsWithStoredNames,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get audit log for specific resource
router.get('/resource/:resourceType/:resourceId', async (req, res) => {
  try {
    const { resourceType, resourceId } = req.params;

    const logs = await AuditLog.find({
      resourceType: resourceType.toUpperCase(),
      resourceId,
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // ALWAYS use stored adminName/adminEmail for historical accuracy
    const logsWithStoredNames = logs.map(log => ({
      ...log,
      adminUser: {
        _id: log.adminUser || null,
        name: log.adminName || 'Unknown', // Always use stored name at time of action
        email: log.adminEmail || 'Unknown', // Always use stored email at time of action
      }
    }));

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

