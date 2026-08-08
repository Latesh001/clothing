const ContactMessage = require('../models/ContactMessage');
const NewsletterSubscriber = require('../models/NewsletterSubscriber');
const { sendEmail } = require('../services/emailService');

const STORE_EMAIL = process.env.CONTACT_EMAIL || process.env.SMTP_USER || 'lateshk169@gmail.com';

exports.submitContact = async (req, res, next) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required.',
      });
    }

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    const saved = await ContactMessage.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || '',
      message: message.trim(),
    });

    const html = `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color:#2A3F4F;">New contact message</h2>
        <p><strong>Name:</strong> ${saved.name}</p>
        <p><strong>Email:</strong> ${saved.email}</p>
        <p><strong>Phone:</strong> ${saved.phone || '—'}</p>
        <p><strong>Message:</strong></p>
        <p style="white-space:pre-line;background:#F5F0E8;padding:16px;">${saved.message}</p>
      </div>
    `;

    await sendEmail({
      to: STORE_EMAIL,
      subject: `Contact form: ${saved.name}`,
      html,
      template: 'contact_form',
      metadata: { contactId: saved._id },
    });

    // Acknowledgement to customer (best-effort)
    sendEmail({
      to: saved.email,
      subject: 'We received your message — Manikanta Khadi & Handlooms',
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <p>Dear ${saved.name},</p>
          <p>Thank you for contacting Manikanta Khadi & Handlooms. We have received your message and will reply soon.</p>
          <p>Regards,<br/><strong>Manikanta Khadi & Handlooms</strong></p>
        </div>
      `,
      template: 'contact_ack',
    }).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Message sent successfully. We will get back to you soon.',
    });
  } catch (error) {
    next(error);
  }
};

exports.subscribeNewsletter = async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.',
      });
    }

    const existing = await NewsletterSubscriber.findOne({ email });
    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        await existing.save();
      }
      return res.json({
        success: true,
        message: 'You are already subscribed. Thank you!',
      });
    }

    await NewsletterSubscriber.create({ email });

    sendEmail({
      to: email,
      subject: 'Welcome to our handloom family',
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color:#2A3F4F;">Thank you for subscribing</h2>
          <p>You will receive soft offers, new weaves, and stories from Manikanta Khadi & Handlooms.</p>
        </div>
      `,
      template: 'newsletter_welcome',
    }).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Subscribed successfully! Welcome to our handloom family.',
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.json({ success: true, message: 'You are already subscribed. Thank you!' });
    }
    next(error);
  }
};
