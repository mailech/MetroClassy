import AuditLog from '../models/AuditLog.js';

/**
 * Middleware to log admin actions
 * Usage: auditLog('CREATE', 'PRODUCT') or auditLog('UPDATE', 'ORDER')
 */
// Helper to get real IP address (handles proxies, load balancers)
const getRealIpAddress = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    'Unknown'
  );
};

export const auditLog = (actionType, resourceType) => {
  return async (req, res, next) => {
    // Store original json function
    const originalJson = res.json.bind(res);

    // Override json to log after response
    res.json = function (data) {
      // Log the action asynchronously (don't block response)
      if (req.user && req.user.isAdmin) {
        // Extract resource ID more reliably
        let resourceId = req.params.id || 
                        req.params.productId || 
                        req.params.orderId || 
                        req.params.categoryId ||
                        req.params.variantId ||
                        req.params.imageId ||
                        data?._id || 
                        data?.id ||
                        data?.product?._id ||
                        data?.order?._id;

        // For CREATE actions, extract ID from response
        if (!resourceId && data && typeof data === 'object') {
          resourceId = data._id || data.id;
        }

        // Prepare detailed metadata
        const meta = {
          method: req.method,
          path: req.path,
          originalUrl: req.originalUrl,
          query: Object.keys(req.query).length > 0 ? req.query : undefined,
          responseStatus: res.statusCode,
        };

        // Include request body for CREATE/UPDATE actions (sanitized)
        if (actionType === 'CREATE' || actionType === 'UPDATE') {
          const bodyCopy = { ...req.body };
          // Remove sensitive fields
          if (bodyCopy.password) delete bodyCopy.password;
          if (bodyCopy.token) delete bodyCopy.token;
          meta.requestBody = bodyCopy;
          meta.changes = actionType === 'UPDATE' ? bodyCopy : undefined;
        }

        // Include response data for CREATE actions to show what was created
        if (actionType === 'CREATE' && data) {
          meta.createdResource = {
            id: data._id || data.id,
            name: data.name || data.title || undefined,
          };
        }

        const ipAddress = getRealIpAddress(req);

        AuditLog.create({
          adminUser: req.user._id,
          adminName: req.user.name || 'Unknown', // Store name at time of action
          adminEmail: req.user.email || 'Unknown', // Store email at time of action
          actionType,
          resourceType,
          resourceId: resourceId?.toString(),
          meta,
          ipAddress,
          userAgent: req.get('user-agent') || 'Unknown',
        }).catch((err) => {
          console.error('Failed to create audit log:', err);
        });
      }
      return originalJson(data);
    };

    next();
  };
};

// Helper function to manually log actions with enhanced IP tracking
export const logAdminAction = async (adminUser, actionType, resourceType, resourceId, meta = {}, req = null) => {
  try {
    const ipAddress = req ? getRealIpAddress(req) : (meta.ipAddress || 'Unknown');
    const userAgent = req ? req.get('user-agent') : (meta.userAgent || 'Unknown');

    // For failed login attempts, adminUser might be null - try to find user by email
    let finalAdminUser = adminUser;
    if (!adminUser && actionType === 'LOGIN_FAILED' && meta.email) {
      try {
        const User = (await import('../models/User.js')).default;
        const user = await User.findOne({ email: meta.email });
        if (user) {
          finalAdminUser = user._id;
        }
      } catch (err) {
        // If we can't find user, that's fine - log without user reference
      }
    }

    // Get admin name and email if adminUser is provided
    let adminName = meta.name || null;
    let adminEmail = meta.email || null;
    
    if (finalAdminUser && !adminName) {
      try {
        const User = (await import('../models/User.js')).default;
        const user = await User.findById(finalAdminUser).select('name email');
        if (user) {
          adminName = user.name || null;
          adminEmail = user.email || null;
        }
      } catch (err) {
        // If we can't fetch user, use what we have
      }
    }

    await AuditLog.create({
      adminUser: finalAdminUser || undefined, // Use undefined instead of null for MongoDB
      adminName: adminName || undefined, // Store name at time of action for historical accuracy
      adminEmail: adminEmail || undefined, // Store email at time of action
      actionType,
      resourceType,
      resourceId: resourceId?.toString() || null,
      meta: {
        ...meta,
        ipAddress,
        userAgent,
      },
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
};

