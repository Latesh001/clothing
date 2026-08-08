# Database Schema

MongoDB database: `manikanta_khadi`

---

## Collections

### users
| Field | Type | Description |
|-------|------|-------------|
| name | String | Required |
| email | String | Unique, sparse |
| phone | String | Unique, sparse |
| password | String | Hashed, select: false |
| googleId | String | Google OAuth ID |
| avatar | String | Profile image URL |
| role | String | customer, admin |
| isVerified | Boolean | OTP verified |
| isActive | Boolean | Account status |
| addresses | Array | Embedded address documents |
| referralCode | String | Unique referral code |
| referredBy | ObjectId | Ref: users |
| searchHistory | Array | { query, searchedAt } |
| recentlyViewed | Array | Ref: products |
| preferences | Object | { language, theme, notifications } |
| otp | Object | { code, expiresAt, type } |
| lastLogin | Date | |

**Indexes:** email, phone, referralCode, text search

---

### admins
| Field | Type | Description |
|-------|------|-------------|
| name | String | Required |
| email | String | Unique, required |
| password | String | Hashed |
| role | String | superadmin, admin, manager |
| permissions | Array | products, orders, customers, analytics, coupons, settings |
| isActive | Boolean | |
| lastLogin | Date | |

---

### categories
| Field | Type | Description |
|-------|------|-------------|
| name | String | Unique |
| slug | String | Unique, URL-friendly |
| description | String | |
| image | String | |
| isActive | Boolean | |
| sortOrder | Number | |
| seoTitle, seoDescription, seoKeywords | | SEO fields |

---

### subcategories
| Field | Type | Description |
|-------|------|-------------|
| name | String | |
| slug | String | |
| category | ObjectId | Ref: categories |
| isActive | Boolean | |

**Index:** { category, slug } unique

---

### products
| Field | Type | Description |
|-------|------|-------------|
| name | String | Required |
| slug | String | Unique |
| description | String | Required |
| category | ObjectId | Ref: categories |
| subcategory | ObjectId | Ref: subcategories |
| images | Array | { url, publicId, alt } |
| videos | Array | { url, publicId, thumbnail } |
| fabric, material | String | |
| borderType, palluType | String | |
| sizes | Array | String |
| colors | Array | { name, hex, images } |
| stock | Number | Required |
| mrp | Number | Required |
| discount | Number | 0-100 |
| offerPrice | Number | Auto-calculated |
| sku | String | Unique |
| tags | Array | String |
| weight | Number | grams |
| shippingCharges | Number | |
| status | String | active, inactive, hidden, out_of_stock |
| isFeatured, isNewArrival, isBestSeller, isTrending | Boolean | |
| specifications | Array | { label, value } |
| averageRating | Number | 0-5 |
| totalReviews | Number | |
| viewCount, soldCount | Number | |

**Indexes:** text(name, description, tags), category+status, offerPrice, featured flags

---

### carts
| Field | Type | Description |
|-------|------|-------------|
| user | ObjectId | Ref: users, unique |
| items | Array | { product, quantity, size, color, price } |
| savedForLater | Array | Same as items |
| coupon | ObjectId | Ref: coupons |
| couponDiscount | Number | |

---

### wishlists
| Field | Type | Description |
|-------|------|-------------|
| user | ObjectId | Ref: users, unique |
| products | Array | Ref: products |

---

### orders
| Field | Type | Description |
|-------|------|-------------|
| orderNumber | String | Unique (MKH...) |
| user | ObjectId | Ref: users |
| items | Array | Embedded order items |
| shippingAddress | Object | Full address |
| paymentMethod | String | upi_qr, cod |
| paymentStatus | String | pending, awaiting_verification, paid, failed, refunded |
| paymentId, upiTransactionId, upiTransactionHash | String | Unique UTR + SHA-256 hash |
| paymentSecurity | Object | paymentToken, utrAttempts, IP, lockout, verifiedBy |
| upiQrPayload | Object | Dynamic QR data (upiId, qrImage, expiresAt, paymentToken) |
| subtotal, shippingCharges, discount, totalAmount | Number | shippingCharges always 0 |
| status | String | pending → delivered |
| tracking | Array | { status, message, location, timestamp } |
| estimatedDelivery | String | |
| invoiceUrl | String | |

**Indexes:** user+createdAt, orderNumber, status+createdAt

---

### payments
| Field | Type | Description |
|-------|------|-------------|
| user | ObjectId | Ref: users |
| order | ObjectId | Ref: orders |
| upiTransactionId | String | |
| amount | Number | |
| method | String | upi_qr, cod |
| status | String | created, paid, failed, refunded |

---

### coupons
| Field | Type | Description |
|-------|------|-------------|
| code | String | Unique, uppercase |
| discountType | String | percentage, fixed |
| discountValue | Number | |
| minOrderAmount | Number | |
| maxDiscount | Number | |
| usageLimit, usedCount | Number | |
| perUserLimit | Number | |
| validFrom, validUntil | Date | |
| isActive | Boolean | |
| applicableCategories | Array | Ref: categories |
| isFirstOrderOnly | Boolean | |

---

### reviews
| Field | Type | Description |
|-------|------|-------------|
| product | ObjectId | Ref: products |
| user | ObjectId | Ref: users |
| order | ObjectId | Ref: orders |
| rating | Number | 1-5 |
| title, comment | String | |
| images, video | String/Array | |
| isVerifiedPurchase | Boolean | |
| helpful | Number | |
| isApproved | Boolean | |

**Index:** { product, user } unique

---

### notifications
| Field | Type | Description |
|-------|------|-------------|
| user | ObjectId | Ref: users |
| title, message | String | |
| type | String | order, promotion, system, wishlist, cart |
| link | String | |
| isRead | Boolean | |

---

### emaillogs
| Field | Type | Description |
|-------|------|-------------|
| to, subject, body | String | |
| template | String | welcome, otp, order_confirmation |
| user | ObjectId | |
| status | String | sent, failed, pending |
| error | String | |

---

### whatsappLogs
| Field | Type | Description |
|-------|------|-------------|
| to, message | String | |
| user | ObjectId | |
| type | String | cart_update, order_confirmation, otp, promotional |
| status | String | sent, failed, pending |
| twilioSid | String | |

---

## Entity Relationships

```
Category 1──N Subcategory
Category 1──N Product
Subcategory 1──N Product
User 1──1 Cart
User 1──1 Wishlist
User 1──N Order
User 1──N Review
User 1──N Notification
Order 1──N OrderItem → Product
Order 1──1 Payment
Product 1──N Review
Coupon N──M Category (applicable)
```

## Normalization

- **3NF compliant:** No transitive dependencies
- Product details embedded in order items (denormalized for historical accuracy)
- Addresses embedded in user document (1:few relationship)
- Reviews stored separately with references (avoid unbounded array growth on products)
