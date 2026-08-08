# API Documentation

Base URL: `http://localhost:5000/api`

All protected routes require `Authorization: Bearer <token>` header.

---

## Authentication

### Register
```
POST /auth/register
Body: { name, email, phone?, password }
```

### Login
```
POST /auth/login
Body: { email, password }
```

### Send OTP
```
POST /auth/send-otp
Body: { email?, phone?, type: "login"|"email"|"mobile" }
```

### Verify OTP
```
POST /auth/verify-otp
Body: { email?, phone?, otp }
```

### Google Login
```
POST /auth/google
Body: { googleId, email, name, avatar? }
```

### Get Profile
```
GET /auth/profile
Auth: Required
```

### Update Profile
```
PUT /auth/profile
Auth: Required
Body: { name?, email?, phone?, avatar?, preferences? }
```

### Address Management
```
POST   /auth/addresses          - Add address
PUT    /auth/addresses/:id      - Update address
DELETE /auth/addresses/:id      - Delete address
```

---

## Products

### List Products
```
GET /products
Query: page, limit, category, subcategory, minPrice, maxPrice, sort, fabric, color, material, search, featured, trending, bestSeller, newArrival
Sort options: newest, oldest, price-low, price-high, popularity, discount, rating
```

### Get Product by Slug
```
GET /products/:slug
```

### Search Products
```
GET /products/search?q=khadi&limit=10
```

### Home Page Data
```
GET /products/home
Returns: featured, trending, bestSellers, newArrivals, categories
```

### Categories
```
GET /categories
Returns: categories, subcategories
```

---

## Cart

```
GET    /cart                     - Get cart
POST   /cart                     - Add item { productId, quantity, size?, color? }
PUT    /cart/:itemId             - Update quantity { quantity }
DELETE /cart/:itemId             - Remove item
POST   /cart/:itemId/save-later  - Save for later
POST   /cart/apply-coupon        - Apply coupon { code }
DELETE /cart                     - Clear cart
```

---

## Wishlist

```
GET    /wishlist                 - Get wishlist
POST   /wishlist                 - Add { productId }
POST   /wishlist/toggle          - Toggle { productId }
DELETE /wishlist/:productId      - Remove
```

---

## Orders

```
POST /orders                     - Create order { shippingAddress, paymentMethod, notes? }
POST /orders/confirm-upi         - Confirm UPI QR payment { orderId, upiTransactionId }
GET  /orders/:id/upi-qr          - Get / refresh dynamic UPI QR for unpaid order
PUT  /admin/orders/:id/verify-upi - Admin verify UPI payment { upiTransactionId, notes }
GET  /orders                     - List user orders
GET  /orders/:id                 - Get order details
GET  /orders/track/:orderNumber  - Track order (public)
PUT  /orders/:id/cancel          - Cancel order { reason? }
```

---

## Reviews

```
POST /reviews                    - Create review { productId, rating, title?, comment, orderId? }
GET  /reviews/:productId         - Get product reviews
```

---

## Notifications

```
GET /notifications               - Get user notifications
PUT /notifications/:id/read      - Mark as read
```

---

## Admin APIs

All require admin JWT token.

### Admin Login
```
POST /admin/login
Body: { email, password }
```

### Dashboard
```
GET /admin/dashboard
Returns: totalProducts, totalOrders, totalCustomers, todayOrders, totalRevenue, revenueChart, lowStockProducts, latestOrders, recentCustomers, topProducts, mostViewed
```

### Analytics
```
GET /admin/analytics?period=30
```

### Product Management
```
GET    /admin/products           - List all products
POST   /admin/products           - Create (multipart: images[], videos[])
PUT    /admin/products/:id       - Update
DELETE /admin/products/:id       - Delete
PATCH  /admin/products/:id/status - Toggle status { status }
POST   /admin/categories         - Create category
POST   /admin/subcategories      - Create subcategory
```

### Order Management
```
GET /admin/orders                - List all orders
PUT /admin/orders/:id/status     - Update status { status, message?, location? }
```

---

## Response Format

```json
{
  "success": true,
  "message": "Optional message",
  "data": {}
}
```

Error:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [{ "field": "email", "message": "Invalid email" }]
}
```
