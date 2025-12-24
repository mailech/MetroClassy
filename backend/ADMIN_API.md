# MetroClassy Admin API Documentation

Complete API documentation for the Admin Panel backend.

## Authentication

All admin endpoints (except `/api/admin/auth/login`) require authentication via:
- **JWT Token** in `Authorization: Bearer <token>` header, OR
- **Session Cookie** (set automatically on login)

---

## Endpoints Overview

### 🔐 Authentication (`/api/admin/auth`)
- `POST /login` - Admin login
- `POST /logout` - Admin logout  
- `GET /me` - Get current admin user

### 📦 Products (`/api/admin/products`)
- `GET /` - List all products
- `GET /:id` - Get product with variants/images
- `POST /` - Create product
- `PUT /:id` - Update product
- `DELETE /:id` - Delete product
- `POST /:id/variants` - Add variant
- `PUT /variants/:variantId` - Update variant
- `DELETE /variants/:variantId` - Delete variant
- `POST /:id/images` - Upload images
- `DELETE /images/:imageId` - Delete image

### 📁 Categories (`/api/admin/categories`)
- `GET /` - List categories
- `GET /:id` - Get category
- `POST /` - Create category
- `PUT /:id` - Update category
- `DELETE /:id` - Delete category

### 📋 Orders (`/api/admin/orders`)
- `GET /` - List orders
- `GET /:id` - Get order details
- `PUT /:id/status` - Update order status
- `PUT /:id/payment` - Update payment status

### 📊 Metrics (`/api/admin/metrics`)
- `GET /dashboard` - Dashboard statistics
- `GET /low-stock` - Low stock alerts
- `GET /revenue?period=7d` - Revenue analytics

### 📝 Audit Logs (`/api/admin/audit-logs`)
- `GET /` - View audit logs
- `GET /resource/:type/:id` - Resource audit history

---

## Detailed Endpoints

### POST /api/admin/auth/login

**Request:**
```json
{
  "email": "admin@metroclassy.com",
  "password": "password"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Admin User",
    "email": "admin@metroclassy.com",
    "isAdmin": true
  }
}
```

**Rate Limit:** 5 attempts per 15 minutes

---

### GET /api/admin/products

**Query Parameters:**
- `search` - Search in name/description/SKU
- `category` - Filter by category
- `isActive` - Filter by active status (true/false)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `sortBy` - Sort field (default: createdAt)
- `sortOrder` - Sort direction (asc/desc, default: desc)

**Response:**
```json
{
  "products": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

---

### POST /api/admin/products

**Request:**
```json
{
  "name": "Product Name",
  "price": 99.99,
  "description": "Product description",
  "category": "electronics",
  "countInStock": 50,
  "brand": "Brand Name",
  "gender": "unisex",
  "sku": "PROD-001",
  "discountPrice": 79.99,
  "isActive": true
}
```

**Response:** Created product object

---

### POST /api/admin/products/:id/variants

**Request:**
```json
{
  "size": "M",
  "color": "Blue",
  "stock": 25,
  "sku": "PROD-001-M-BLUE",
  "price": 99.99,
  "imageUrl": "https://example.com/image.jpg",
  "isActive": true
}
```

---

### POST /api/admin/products/:id/images

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `images` - File(s) to upload (max 10 files)
- `altText` - Optional alt text

**Response:**
```json
{
  "images": [
    {
      "_id": "...",
      "product": "...",
      "url": "/uploads/products/product-1234567890.jpg",
      "isMain": true,
      "altText": "Product Name",
      "order": 0
    }
  ]
}
```

---

### PUT /api/admin/orders/:id/status

**Request:**
```json
{
  "status": "shipped",
  "trackingNumber": "TRACK123456"
}
```

**Status Values:** `pending`, `processing`, `shipped`, `delivered`, `cancelled`

---

### GET /api/admin/metrics/dashboard

**Response:**
```json
{
  "overview": {
    "totalProducts": 150,
    "activeProducts": 140,
    "totalOrders": 500,
    "totalUsers": 200,
    "totalRevenue": 50000,
    "pendingOrders": 10,
    "lowStockProducts": 5
  },
  "recentOrders": [...],
  "topProducts": [...]
}
```

---

### GET /api/admin/metrics/low-stock

**Query Parameters:**
- `threshold` - Stock threshold (default: 10)

**Response:**
```json
{
  "products": [
    {
      "_id": "...",
      "name": "Product Name",
      "sku": "PROD-001",
      "countInStock": 5,
      "price": 99.99,
      "category": "electronics"
    }
  ],
  "variants": [...]
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "message": "Error description"
}
```

**Status Codes:**
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (admin access required)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

---

## Security Notes

1. **Passwords** - Always hashed with bcrypt
2. **Tokens** - JWT with 7-day expiration
3. **Sessions** - Stored in database, automatically expired
4. **Rate Limiting** - Applied to sensitive endpoints
5. **Audit Logging** - All actions are logged
6. **File Uploads** - Validated for type and size
7. **CORS** - Configured for frontend origins only

---

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create admin user:**
   ```bash
   npm run create-admin
   ```

3. **Start server:**
   ```bash
   npm run dev
   ```

4. **Login:**
   ```bash
   POST /api/admin/auth/login
   ```

5. **Use token in subsequent requests:**
   ```
   Authorization: Bearer <token>
   ```

---

## File Upload Notes

- Files stored in `/backend/uploads/products/`
- Accessible at `http://localhost:5000/uploads/products/{filename}`
- Max file size: 5MB
- Allowed types: jpeg, jpg, png, webp
- For production, consider S3/Cloud storage

---

## Audit Logging

All admin actions are automatically logged with:
- Timestamp
- Admin user
- Action type
- Resource type and ID
- Request metadata
- IP address

Query audit logs:
```
GET /api/admin/audit-logs?adminUser=<userId>&actionType=DELETE
```

