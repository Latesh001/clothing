# Manikanta Khadi & Handlooms - E-Commerce Platform

A production-ready, enterprise-level e-commerce website for premium handwoven khadi sarees, dupattas, dress materials, and blouses.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, React Router, PWA (installable app) |
| Backend | Node.js, Express.js (MVC Architecture) |
| Database | MongoDB with Mongoose ODM |
| Auth | JWT, Email OTP, Mobile OTP, Google OAuth |
| Payments | Dynamic UPI QR + Cash on Delivery |
| Storage | Cloudinary |
| Email | Nodemailer |
| WhatsApp | Twilio Business API |

## Project Structure

```
manikanta-khadi/
├── backend/
│   ├── src/
│   │   ├── config/          # Database, Cloudinary config
│   │   ├── controllers/     # Route controllers (MVC)
│   │   ├── middleware/      # Auth, validation, upload, error handling
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # API route definitions
│   │   └── services/        # Email, WhatsApp, UPI QR, Cloudinary
│   ├── scripts/             # Database seeding
│   └── server.js            # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # React Context (Auth)
│   │   ├── pages/           # Route pages
│   │   ├── services/        # API client (Axios)
│   │   └── utils/           # Helpers
│   └── index.html
└── docs/                    # Documentation
```

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 6+
- npm or yarn

### 1. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
npm install
npm run seed    # Seed categories, admin, sample products
npm run dev     # Starts on http://localhost:5000
```

### 2. Frontend Setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev     # Starts on http://localhost:5173
```

### 3. Default Admin Credentials

```
Email: latesh169@gmail.com
Password: Latesh@8074
```

Admin Panel: http://localhost:5173/admin/login

## Features

### Customer Features
- Premium responsive UI with handloom-themed design
- **Installable app (PWA)** via direct link `/app` — no App Store / Play Store; same features as the website
- Product browsing with advanced filters
- Live search with instant suggestions
- Cart, Wishlist, Compare
- Multi-step checkout with dynamic UPI QR & COD
- Order tracking
- Email OTP & Mobile OTP login
- WhatsApp cart notifications
- Dark/Light mode
- Customer reviews & ratings

### Admin Features
- Dashboard with analytics
- Product CRUD with image uploads
- Order management & status updates
- Inventory & low stock alerts
- Revenue charts
- Customer management

## API Documentation

See [docs/API.md](docs/API.md)

## Database Schema

See [docs/DATABASE.md](docs/DATABASE.md)

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## Security

- Password hashing (bcrypt)
- JWT authentication (Bearer tokens)
- Rate limiting
- Input validation (express-validator)
- MongoDB injection protection
- XSS request sanitization
- Helmet security headers
- Role-based access control

## License

Proprietary - Manikanta Khadi & Handlooms
