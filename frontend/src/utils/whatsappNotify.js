/**
 * Opens WhatsApp chat to admin with a pre-filled item list.
 * Used when Twilio is not configured so the admin still receives the cart/order details.
 * Customer taps Send once — message goes to 8074181510.
 */
export const openAdminWhatsAppIfNeeded = (payload) => {
  if (!payload?.openAdminWhatsApp || !payload?.adminWhatsAppUrl) return false;
  try {
    const win = window.open(payload.adminWhatsAppUrl, '_blank', 'noopener,noreferrer');
    if (!win) {
      // Popup blocked — navigate top-level as last resort for mobile
      window.location.href = payload.adminWhatsAppUrl;
    }
    return true;
  } catch {
    return false;
  }
};
