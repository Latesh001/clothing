# Deployment Guide

## Architecture

```
     ┌──────────────────┐      ┌──────────────────┐
     │ Frontend (Vite)  │─────▶│ Backend (API)    │
     │ Vercel           │      │ Vercel           │
     └──────────────────┘      └────────┬─────────┘
                                        │
               ┌────────────────────────┼────────────────────────┐
               │                        │                        │
        ┌──────▼──────┐          ┌──────▼──────┐          ┌──────▼──────┐
        │ MongoDB     │          │ Cloudinary  │          │ UPI Dynamic │
        │ Atlas       │          │ (images)    │          │ QR          │
        └─────────────┘          └─────────────┘          └─────────────┘
```

## Live Production

- **Storefront:** https://frontend-woad-nine-60.vercel.app
- **App link (PWA — no App Store / Play Store):** https://frontend-woad-nine-60.vercel.app/app
- **API:** https://manikanta-khadi-api.vercel.app/api
- **Health:** https://manikanta-khadi-api.vercel.app/api/health
- **GitHub:** https://github.com/Latesh001/clothing
- Frontend Vercel root: `frontend` (auto-deploys on `main`)
- Backend Vercel root: `backend` (auto-deploys on `main`)
- Database: MongoDB Atlas cluster `manikanta-khadi`

### Progressive Web App (direct link)

The storefront is also an installable **Progressive Web App**. Share `/app` — customers open the same shop, cart, wishlist, checkout, and order tracking without downloading from stores. The normal website URLs keep working unchanged. PWA install works over **HTTPS** (Vercel production); use Chrome/Edge “Install app” or iOS Safari “Add to Home Screen”.

---

## 1. MongoDB Atlas

1. Create account at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free M0 cluster
3. Create a database user with read/write access
4. Network access: allow `0.0.0.0/0` (or lock to known IPs)
5. Connection string: `mongodb+srv://user:pass@cluster.mongodb.net/manikanta_khadi`

---

## 2. Backend (Vercel)

1. Import the GitHub repo into Vercel
2. **Root Directory:** `backend`
3. Entry: `backend/api/index.js` + `backend/vercel.json`
4. Set environment variables (below)
5. Deploy — every push to `main` redeploys the API

### Backend environment variables

```env
NODE_ENV=production
CLIENT_URL=https://your-frontend.vercel.app
ALLOWED_ORIGINS=https://your-frontend.vercel.app
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<strong-32+-char-secret>
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
EMAIL_FROM=Manikanta Khadi & Handlooms <you@email.com>
CONTACT_EMAIL=you@email.com
UPI_ID=yourshop@upi
UPI_PAYEE_NAME=Manikanta Khadi Handlooms
UPI_QR_EXPIRE_MINUTES=30
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=<strong-password>
```

Optional helper to set Atlas URI on the API project:

```powershell
.\scripts\apply-mongodb-uri.ps1 "mongodb+srv://..."
```

Seed (from a machine with `MONGODB_URI` set):

```bash
cd backend
npm run seed
```

---

## 3. Frontend (Vercel)

1. Import the same GitHub repo into a second Vercel project
2. **Root Directory:** `frontend`
3. Framework: Vite · Build: `npm run build` · Output: `dist`
4. SPA rewrites: `frontend/vercel.json`
5. Env: `VITE_API_URL=https://manikanta-khadi-api.vercel.app/api`
6. Optional: `VITE_GOOGLE_CLIENT_ID=...`

```env
VITE_API_URL=https://manikanta-khadi-api.vercel.app/api
VITE_GOOGLE_CLIENT_ID=...
```

---

## 4. Custom domain

1. Buy a domain (e.g. manikantakhadi.com)
2. Add it in the frontend Vercel project
3. Optionally add `api.yourdomain.com` to the backend Vercel project
4. Update `CLIENT_URL`, `ALLOWED_ORIGINS`, and `VITE_API_URL`

---

## 5. Cloudinary

1. Create account at [cloudinary.com](https://cloudinary.com)
2. Copy Cloud Name, API Key, API Secret into backend env

---

## 6. UPI Dynamic QR

1. Set business `UPI_ID` and `UPI_PAYEE_NAME` in backend env
2. Checkout generates a QR per order; customer submits UTR; admin verifies

---

## 7. Email (Gmail App Password)

1. Enable 2FA on Gmail
2. Create an App Password
3. Set `SMTP_USER` / `SMTP_PASS` (leave empty in local `.env` to skip real SMTP)

---

## 8. Production checklist

- [ ] Strong `JWT_SECRET` and admin password
- [ ] MongoDB Atlas network access configured
- [ ] CORS / `CLIENT_URL` matches the live storefront
- [ ] Real `UPI_ID` set
- [ ] Test login, cart, UPI/COD checkout
- [ ] Test product image upload
- [ ] Submit `sitemap.xml` to Search Console

---

## Support

For deployment help: lateshk169@gmail.com
