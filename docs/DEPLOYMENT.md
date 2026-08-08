# Deployment Guide

## Architecture Overview

```
                    ┌─────────────┐
                    │   Cloudflare │ (CDN + SSL)
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              │                         │
     ┌────────▼────────┐      ┌────────▼────────┐
     │  Frontend (Vite) │      │  Backend (API)  │
     │  Vercel/Netlify  │      │  Railway/Render │
     │  Port: 443       │      │  Port: 5000     │
     └─────────────────┘      └────────┬────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
           ┌────────▼────────┐ ┌──────▼──────┐ ┌────────▼────────┐
           │ MongoDB Atlas    │ │ Cloudinary  │ │ UPI Dynamic QR  │
           └─────────────────┘ └─────────────┘ └─────────────────┘
```

---

## 1. MongoDB Atlas Setup

1. Create account at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free M0 cluster
3. Add database user with read/write permissions
4. Whitelist IP: `0.0.0.0/0` (or specific server IPs)
5. Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/manikanta_khadi`

---

## 2. Backend Deployment (Railway / Render)

### Railway

```bash
# Install Railway CLI
npm install -g @railway/cli
railway login
cd backend
railway init
railway up
```

### Environment Variables (Production)

```env
NODE_ENV=production
PORT=5000
CLIENT_URL=https://yourdomain.com
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<generate-strong-32char-secret>
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
UPI_ID=yourshop@upi
UPI_PAYEE_NAME=Manikanta Khadi Handlooms
UPI_QR_EXPIRE_MINUTES=30
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_FROM=whatsapp:+...
ADMIN_EMAIL=admin@manikantakhadi.com
ADMIN_PASSWORD=<strong-password>
```

### Seed Production Database

```bash
npm run seed
```

---

## 3. Frontend Deployment (Vercel)

```bash
npm install -g vercel
cd frontend
vercel
```

### Environment Variables

```env
VITE_API_URL=https://api.yourdomain.com/api
VITE_GOOGLE_CLIENT_ID=...
```

### Vercel Build Settings
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

---

## 4. Custom Domain Setup

1. Purchase domain (e.g., manikantakhadi.com)
2. Point frontend CNAME to Vercel/Netlify
3. Point API subdomain (api.manikantakhadi.com) to backend server
4. Enable SSL on both (automatic with Vercel/Railway)

---

## 5. Cloudinary Setup

1. Create account at [cloudinary.com](https://cloudinary.com)
2. Get Cloud Name, API Key, API Secret from dashboard
3. Create upload preset for `manikanta-khadi` folder

---

## 6. UPI Dynamic QR Setup

1. Get your business UPI ID from your bank / UPI app (e.g. `shop@oksbi`)
2. Set `UPI_ID` and `UPI_PAYEE_NAME` in backend `.env`
3. Each order generates a unique QR with order amount and note
4. Customers pay via any UPI app and submit the UTR; admin can also verify in Orders

---

## 7. Email Setup (Gmail App Password)

1. Enable 2FA on Gmail account
2. Generate App Password: Google Account → Security → App Passwords
3. Use app password in `SMTP_PASS`

---

## 8. WhatsApp (Twilio)

1. Create Twilio account
2. Enable WhatsApp Sandbox or apply for WhatsApp Business API
3. Configure webhook for message status

---

## 9. Production Checklist

- [ ] Change default admin password
- [ ] Set strong JWT_SECRET (32+ characters)
- [ ] Enable MongoDB Atlas IP whitelist
- [ ] Configure CORS with production frontend URL
- [ ] Set NODE_ENV=production
- [ ] Set real business UPI_ID in backend .env
- [ ] Test UPI QR payment flow end-to-end
- [ ] Configure Google Analytics
- [ ] Submit sitemap to Google Search Console
- [ ] Set up error monitoring (Sentry recommended)
- [ ] Configure automated backups for MongoDB
- [ ] Enable rate limiting (already configured)
- [ ] Test email delivery
- [ ] Test WhatsApp notifications

---

## 10. Docker Deployment (Optional)

```dockerfile
# backend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    env_file: ./backend/.env
    depends_on:
      - mongo
  mongo:
    image: mongo:6
    volumes:
      - mongo_data:/data/db
  frontend:
    build: ./frontend
    ports:
      - "80:80"
volumes:
  mongo_data:
```

```bash
docker-compose up -d
```

---

## 11. Monitoring & Maintenance

- **Uptime:** Use UptimeRobot for API health checks (`/api/health`)
- **Logs:** Railway/Render provide built-in logging
- **Backups:** MongoDB Atlas automated daily backups
- **Updates:** Regular dependency updates with `npm audit`

---

## Support

For deployment assistance: support@manikantakhadi.com
