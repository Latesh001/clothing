import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import LoginForm from '../components/auth/LoginForm';
import { IMAGES } from '../utils/images';

const Login = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated || user) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <>
      <Helmet>
        <title>Login | Manikanta Khadi & Handlooms</title>
      </Helmet>

      <div className="min-h-[calc(100vh-110px)] grid lg:grid-cols-2">
        <div className="relative hidden lg:block overflow-hidden">
          <img
            src={IMAGES.hero}
            alt="Handwoven sarees"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0E2A38]/75 via-[#1F5570]/55 to-[#C26A3D]/45" />
          <div className="relative z-10 h-full flex flex-col justify-end p-12 text-white">
            <p className="text-[#E8D9B8] tracking-[0.25em] uppercase text-xs font-semibold mb-3">
              Manikanta Khadi & Handlooms
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-4xl xl:text-5xl text-white mb-3 leading-tight">
              Welcome back to natural weaves
            </h1>
            <p className="text-white/85 max-w-md">
              Sign in with any phone number, email, and password — or continue with Google.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center px-4 py-12 sm:px-8 bg-[#F3EFE6]">
          <div className="w-full max-w-md bg-[#FFFEF9] rounded-3xl shadow-lg p-6 sm:p-8">
            <div className="text-center mb-8">
              <Link to="/" className="inline-block mb-4">
                <span className="font-[family-name:var(--font-display)] text-2xl text-[#1A1714]">Manikanta</span>
                <span className="block text-[0.65rem] uppercase tracking-[0.22em] text-[#6E655C] font-semibold">
                  Khadi & Handlooms
                </span>
              </Link>
              <h2 className="font-[family-name:var(--font-display)] text-3xl text-[#1A1714]">Login</h2>
              <p className="text-sm text-[#6E655C] mt-2">
                Enter any phone number, your email, and password
              </p>
            </div>

            <LoginForm onSuccess={() => navigate('/')} />

            <p className="text-center text-sm text-[#6E655C] mt-8">
              <Link to="/" className="text-[#1F5570] font-semibold hover:underline">
                ← Back to Home
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
