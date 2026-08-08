import { FiX } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import LoginForm from './LoginForm';

const LoginModal = () => {
  const { showLoginModal, setShowLoginModal } = useAuth();

  if (!showLoginModal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/55" onClick={() => setShowLoginModal(false)} />
      <div className="relative bg-[#FFFEF9] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-[#1F5570] via-[#1F6A7A] to-[#C26A3D] p-6 text-white text-center relative">
          <button
            type="button"
            onClick={() => setShowLoginModal(false)}
            className="absolute top-4 right-4 hover:bg-white/20 p-1.5 rounded-full"
            aria-label="Close"
          >
            <FiX size={20} />
          </button>
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-white">Welcome back</h2>
          <p className="text-[#E8B84A] text-sm mt-1 font-semibold">Manikanta Khadi & Handlooms</p>
        </div>
        <div className="p-6">
          <LoginForm onSuccess={() => setShowLoginModal(false)} />
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
