import { Link } from 'react-router-dom';
import { FiDownload, FiX, FiSmartphone } from 'react-icons/fi';
import { usePwaInstall } from '../../hooks/usePwaInstall';

/**
 * Lightweight install chip — only on mobile browsers, not when already installed.
 * Does not change desktop website chrome.
 */
const InstallPrompt = () => {
  const { canInstall, installed, dismissed, isIos, promptInstall, dismiss } = usePwaInstall();

  if (installed || dismissed) return null;
  if (!canInstall && !isIos) return null;

  // Hide on large screens — website experience stays as-is
  const hideOnDesktop = 'md:hidden';

  return (
    <div
      className={`${hideOnDesktop} fixed bottom-[5.5rem] left-4 right-4 z-40 max-w-md mx-auto`}
      role="dialog"
      aria-label="Install Manikanta Khadi app"
    >
      <div className="flex items-start gap-3 rounded-2xl bg-[#123040] text-[#FFFEF9] p-4 shadow-2xl ring-1 ring-[#E8B84A]/40">
        <div className="shrink-0 w-10 h-10 rounded-xl bg-[#E8B84A]/20 flex items-center justify-center text-[#E8B84A]">
          <FiSmartphone size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-snug">Open as an app</p>
          <p className="text-xs text-[#F3EFE6]/90 mt-1 leading-relaxed">
            {isIos && !canInstall
              ? 'Tap Share → Add to Home Screen for the full app experience.'
              : 'Install Manikanta Khadi — same shop, cart & checkout. No App Store needed.'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {canInstall && (
              <button
                type="button"
                onClick={() => promptInstall()}
                className="inline-flex items-center gap-1.5 text-xs font-bold bg-[#E8B84A] text-[#123040] px-3 py-1.5 rounded-full"
              >
                <FiDownload size={14} /> Install
              </button>
            )}
            <Link
              to="/app"
              className="inline-flex items-center text-xs font-semibold text-[#E8B84A] underline-offset-2 hover:underline px-1 py-1.5"
            >
              App link
            </Link>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 p-1 text-[#F3EFE6]/80 hover:text-white"
          aria-label="Dismiss"
        >
          <FiX size={18} />
        </button>
      </div>
    </div>
  );
};

export default InstallPrompt;
