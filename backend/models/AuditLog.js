import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    adminUser: {
      type: mongoose.Schema.Types.ObjectId,
      required: false, // Not required for failed login attempts
      ref: 'User',
    },
    adminName: {
      type: String,
      required: false, // Store name at time of action for historical accuracy
    },
    adminEmail: {
      type: String,
      required: false, // Store email at time of action
    },
    actionType: {
      type: String,
      required: true,
      enum: [
        'CREATE',
        'UPDATE',
        'DELETE',
        'LOGIN',
        'LOGIN_FAILED',
        'LOGOUT',
        'VIEW',
        'UPLOAD',
        'STATUS_CHANGE',
      ],
    },
    resourceType: {
      type: String,
      required: true,
      enum: [
        'PRODUCT',
        'ORDER',
        'USER',
        'CATEGORY',
        'COUPON',
        'VARIANT',
        'IMAGE',
      ],
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
auditLogSchema.index({ adminUser: 1, createdAt: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });
auditLogSchema.index({ actionType: 1, createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;

