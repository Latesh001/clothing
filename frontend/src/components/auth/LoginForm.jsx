import { useState } from 'react';
import { FiMail, FiPhone, FiEye, FiEyeOff, FiExternalLink } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const decodeGoogleCredential = (credential) => {
  try {
    const payload = credential.split('.')[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(normalized));
  } catch {
    return null;
  }
};

const isValidPhone = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15;
};

const LoginForm = ({ onSuccess }) => {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showGoogleSetup, setShowGoogleSetup] = useState(false);
  const [form, setForm] = useState({ email: '', phone: '', password: '' });

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const hasGoogleClient =
    googleClientId &&
    !googleClientId.includes('your_google_client_id') &&
    googleClientId.includes('.apps.googleusercontent.com');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = form.email.trim();
    const phone = form.phone.trim();
    const password = form.password;

    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error('Enter a valid email address');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (phone && !isValidPhone(phone)) {
      toast.error('Enter a valid phone number (8–15 digits), or leave it blank');
      return;
    }

    setLoading(true);
    try {
      await login(
        {
          email,
          password,
          ...(phone ? { phone } : {}),
        },
        'credentials'
      );
      onSuccess?.();
    } catch {
      /* handled in context */
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (response) => {
    setLoading(true);
    try {
      const profile = decodeGoogleCredential(response.credential);
      if (!profile?.email) {
        toast.error('Could not read Google account details');
        return;
      }
      await login(
        {
          googleId: profile.sub,
          email: profile.email,
          name: profile.name || profile.email.split('@')[0],
          avatar: profile.picture || '',
        },
        'google'
      );
      onSuccess?.();
    } catch {
      /* handled in context */
    } finally {
      setLoading(false);
    }
  };

  if (showGoogleSetup) {
    return (
      <div className="space-y-4 text-sm text-[#3D3832]">
        <h3 className="font-[family-name:var(--font-display)] text-xl text-[#1A1714]">
          Enable Google Login
        </h3>
        <p className="text-[#6E655C]">
          Google account selection needs a free Client ID from Google Cloud (one-time setup).
        </p>
        <ol className="list-decimal pl-5 space-y-2 leading-relaxed">
          <li>
            Open{' '}
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noreferrer"
              className="text-[#2A3F4F] font-semibold underline inline-flex items-center gap-1"
            >
              Google Cloud Credentials <FiExternalLink size={12} />
            </a>
          </li>
          <li>Create Credentials → OAuth client ID → Web application</li>
          <li>
            Add origin:
            <code className="block mt-1 bg-[#F3EFE6] px-2 py-1 rounded text-xs">http://localhost:5173</code>
          </li>
          <li>
            Set in <code className="bg-[#F3EFE6] px-1 rounded">frontend/.env</code>:
            <code className="block mt-1 bg-[#F3EFE6] px-2 py-1 rounded text-xs break-all">
              VITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
            </code>
          </li>
          <li>
            Restart frontend with <code>npm run dev</code>
          </li>
        </ol>
        <button type="button" onClick={() => setShowGoogleSetup(false)} className="btn-outline-dark w-full !py-2.5">
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#6E655C] mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6E655C]" />
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F3EFE6] text-[#1A1714] outline-none focus:ring-2 focus:ring-[#2A3F4F]/25"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#6E655C] mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              required
              minLength={6}
              autoComplete="current-password"
              className="w-full pl-4 pr-12 py-3 rounded-2xl bg-[#F3EFE6] text-[#1A1714] outline-none focus:ring-2 focus:ring-[#2A3F4F]/25"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E655C]"
              aria-label="Toggle password"
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#6E655C] mb-1.5">
            Phone Number <span className="normal-case font-normal">(optional)</span>
          </label>
          <div className="relative">
            <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6E655C]" />
            <input
              name="phone"
              type="tel"
              inputMode="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="Optional — for new accounts / orders"
              autoComplete="tel"
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F3EFE6] text-[#1A1714] outline-none focus:ring-2 focus:ring-[#2A3F4F]/25"
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full btn-primary-custom py-3 disabled:opacity-50">
          {loading ? 'Please wait...' : 'Login'}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#E8E0D0]" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-[#FFFEF9] px-4 text-sm text-[#6E655C]">or</span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        {hasGoogleClient ? (
          <div className="w-full flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error('Google sign-in failed. Please try again.')}
              useOneTap={false}
              theme="outline"
              size="large"
              text="continue_with"
              shape="pill"
              width="320"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowGoogleSetup(true)}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-full bg-white border border-[#E8E0D0] hover:bg-[#F3EFE6] transition-colors"
          >
            <FcGoogle size={22} />
            <span className="font-semibold text-sm text-[#1A1714]">Continue with Google</span>
          </button>
        )}
        <p className="text-xs text-[#6E655C] text-center">
          Login with email &amp; password. First-time email creates your account automatically — no separate register page.
        </p>
      </div>
    </>
  );
};

export default LoginForm;
