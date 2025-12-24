# MetroClassy Backend API

Complete Express.js + MongoDB backend API for MetroClassy e-commerce platform with comprehensive Admin Panel support.

## Features

### Core Features
- **Product Management** - Full CRUD with variants (size, color, stock)
- **Order Management** - Track orders, update status, shipping tracking
- **Customer Management** - View and manage customer profiles
- **Coupon System** - Create and manage discount coupons
- **Discount Wheel** - Configure discount wheel segments
- **Analytics** - Dashboard statistics and reporting

### Admin Features
- **Admin Authentication** - JWT + Session-based auth with role checks
- **Product Variants** - Size, color, and stock management
- **Image Upload** - Local file storage with validation
- **Category Management** - Hierarchical category system
- **Audit Logging** - Complete action tracking
- **Inventory Alerts** - Low stock notifications
- **Security** - Rate limiting, CSRF protection, password hashing

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/metroclassy
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
FRONTEND_URL=http://localhost:3000,http://localhost:3001
```

## Setup Admin User

```bash
npm run create-admin

# Or with custom credentials:
npm run create-admin admin@example.com securepassword Admin Name
```

## Running

```bash
# Development
npm run dev

# Production
npm start
```

## Admin API Endpoints

All admin endpoints are prefixed with `/api/admin` and require authentication.

### Authentication
- `POST /api/admin/auth/login` - Admin login
- `POST /api/admin/auth/logout` - Admin logout
- `GET /api/admin/auth/me` - Get current admin user

### Products (Admin)
- `GET /api/admin/products` - List products (with filters)
- `GET /api/admin/products/:id` - Get product with variants/images
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product
- `POST /api/admin/products/:id/variants` - Add variant
- `PUT /api/admin/products/variants/:variantId` - Update variant
- `DELETE /api/admin/products/variants/:variantId` - Delete variant
- `POST /api/admin/products/:id/images` - Upload images (multipart/form-data)
- `DELETE /api/admin/products/images/:imageId` - Delete image

### Categories (Admin)
- `GET /api/admin/categories` - List categories
- `GET /api/admin/categories/:id` - Get category
- `POST /api/admin/categories` - Create category
- `PUT /api/admin/categories/:id` - Update category
- `DELETE /api/admin/categories/:id` - Delete category

### Orders (Admin)
- `GET /api/admin/orders` - List orders (with filters)
- `GET /api/admin/orders/:id` - Get order details
- `PUT /api/admin/orders/:id/status` - Update order status
- `PUT /api/admin/orders/:id/payment` - Update payment status

### Metrics (Admin)
- `GET /api/admin/metrics/dashboard` - Dashboard statistics
- `GET /api/admin/metrics/low-stock` - Low stock alerts
- `GET /api/admin/metrics/revenue?period=7d` - Revenue analytics

### Audit Logs (Admin)
- `GET /api/admin/audit-logs` - View audit logs
- `GET /api/admin/audit-logs/resource/:resourceType/:resourceId` - Resource audit history

## Authentication

### Admin Login Request
```json
POST /api/admin/auth/login
{
  "email": "admin@metroclassy.com",
  "password": "password"
}
```

### Response
```json
{
  "message": "Login successful",
  "token": "jwt-token",
  "user": {
    "id": "...",
    "name": "Admin User",
    "email": "admin@metroclassy.com",
    "isAdmin": true
  }
}
```

### Using Authentication
Include token in requests:
```
Authorization: Bearer <token>
```

Or use session cookie (automatically set on login).

## Security Features

1. **Password Hashing** - Bcrypt with salt rounds
2. **JWT Tokens** - 7-day expiration
3. **Session Management** - Database-backed sessions
4. **Rate Limiting** - Prevents brute force attacks
5. **Audit Logging** - All admin actions logged
6. **Role-Based Access** - Admin-only endpoints protected
7. **Input Validation** - All inputs sanitized
8. **File Upload Validation** - Type and size restrictions

## File Uploads

### Image Upload
- **Endpoint**: `POST /api/admin/products/:id/images`
- **Content-Type**: `multipart/form-data`
- **Field Name**: `images` (multiple files supported)
- **Max File Size**: 5MB
- **Allowed Types**: jpeg, jpg, png, webp
- **Storage**: Local filesystem (`/uploads/products/`)

### Accessing Uploaded Files
Files are served at: `http://localhost:5000/uploads/products/{filename}`

## Models

### Product
- Basic product info
- Supports variants (size, color, stock)
- Multiple images
- Category reference

### ProductVariant
- Size, color options
- Individual stock levels
- SKU per variant
- Price overrides

### ProductImage
- Multiple images per product
- Main image flag
- Alt text and ordering

### Category
- Hierarchical categories (parent/child)
- Slug-based URLs
- Active/inactive status

### AuditLog
- Tracks all admin actions
- Includes metadata and IP
- Resource-specific queries

## Rate Limiting

- **Admin Login**: 5 requests per 15 minutes
- **General API**: 100 requests per 15 minutes
- **Sensitive Operations**: 20 requests per hour

## Audit Logging

All admin actions are automatically logged with:
- Admin user ID
- Action type (CREATE, UPDATE, DELETE, etc.)
- Resource type and ID
- Request metadata
- IP address and user agent
- Timestamp

## Error Handling

All errors return consistent JSON format:
```json
{
  "message": "Error description"
}
```

## Notes

- All timestamps managed by Mongoose
- MongoDB indexes for performance
- CORS enabled for frontend origins
- File uploads stored locally (S3 integration ready)
- Audit logs retained for compliance
