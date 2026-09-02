'use client';

import { useState, useRef } from 'react';
import { UTR_REGEX, PHONE_REGEX, EMAIL_REGEX } from '@/lib/constants';
import type { RegistrationFormData } from '@/lib/types';
import { Upload, User, Mail, Phone, Hash, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface RegistrationFormProps {
  onSubmit: (data: RegistrationFormData) => Promise<void>;
  isSubmitting: boolean;
}

export default function RegistrationForm({ onSubmit, isSubmitting }: RegistrationFormProps) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    utr_number: '',
  });
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name.trim() || formData.full_name.trim().length < 2) {
      newErrors.full_name = 'Please enter your full name';
    }

    if (!EMAIL_REGEX.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!PHONE_REGEX.test(formData.phone)) {
      newErrors.phone = 'Enter a valid 10-digit Indian mobile number';
    }

    if (!UTR_REGEX.test(formData.utr_number)) {
      newErrors.utr_number = 'UTR must be exactly 12 digits (numeric)';
    }

    if (!screenshot) {
      newErrors.screenshot = 'Please upload your payment screenshot';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !screenshot) return;

    await onSubmit({
      ...formData,
      full_name: formData.full_name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      utr_number: formData.utr_number.trim(),
      screenshot,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, screenshot: 'Screenshot file must be under 5MB' }));
        return;
      }
      setScreenshot(file);
      setErrors((prev) => {
        const next = { ...prev };
        delete next.screenshot;
        return next;
      });
      const reader = new FileReader();
      reader.onload = () => setScreenshotPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const inputClasses = (field: string) =>
    `w-full bg-stone-50/60 border ${
      errors[field]
        ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-200'
        : 'border-stone-300 focus:border-[#15803D] focus:bg-white'
    } rounded-2xl px-4 py-3 pl-11 text-stone-900 placeholder-stone-400 text-sm outline-none transition-all focus:ring-3 focus:ring-emerald-500/15 font-medium`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md mx-auto">
      <div className="mb-2">
        <h3 className="text-lg font-extrabold text-stone-900">Enter Your Details</h3>
        <p className="text-xs text-stone-500">
          We&apos;ll issue your digital ticket and WhatsApp pass with these details.
        </p>
      </div>

      {/* Full Name */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5 ml-1">
          Full Name
        </label>
        <div className="relative">
          <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="e.g. Rahul Sharma"
            value={formData.full_name}
            onChange={(e) => setFormData((prev) => ({ ...prev, full_name: e.target.value }))}
            className={inputClasses('full_name')}
            disabled={isSubmitting}
          />
        </div>
        {errors.full_name && <ErrorText text={errors.full_name} />}
      </div>

      {/* Email */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5 ml-1">
          Email Address
        </label>
        <div className="relative">
          <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="email"
            placeholder="rahul@example.com"
            value={formData.email}
            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
            className={inputClasses('email')}
            disabled={isSubmitting}
          />
        </div>
        {errors.email && <ErrorText text={errors.email} />}
      </div>

      {/* WhatsApp Phone */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5 ml-1">
          WhatsApp Number
        </label>
        <div className="relative">
          <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="tel"
            placeholder="10-digit mobile number"
            value={formData.phone}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 10);
              setFormData((prev) => ({ ...prev, phone: val }));
            }}
            className={inputClasses('phone')}
            disabled={isSubmitting}
            maxLength={10}
          />
        </div>
        {errors.phone && <ErrorText text={errors.phone} />}
      </div>

      {/* UTR Number */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5 ml-1">
          12-Digit UPI Ref / UTR Number
        </label>
        <div className="relative">
          <Hash size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="e.g. 423456789012"
            value={formData.utr_number}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 12);
              setFormData((prev) => ({ ...prev, utr_number: val }));
            }}
            className={inputClasses('utr_number')}
            disabled={isSubmitting}
            maxLength={12}
          />
        </div>
        <p className="text-[11px] text-stone-500 mt-1 ml-1 font-medium">
          Found in your UPI app &gt; Transaction History &gt; UPI Ref / UTR No.
        </p>
        {errors.utr_number && <ErrorText text={errors.utr_number} />}
      </div>

      {/* Screenshot upload */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5 ml-1">
          Payment Screenshot <span className="text-rose-500">*</span>
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
          disabled={isSubmitting}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
            screenshotPreview
              ? 'border-emerald-500/60 bg-emerald-50/50'
              : errors.screenshot
              ? 'border-rose-400 bg-rose-50/40 ring-1 ring-rose-200'
              : 'border-stone-300 bg-stone-50/50 hover:bg-stone-100/60 hover:border-stone-400'
          }`}
          disabled={isSubmitting}
        >
          {screenshotPreview ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 truncate">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span className="truncate">{screenshot?.name || 'Screenshot Attached'}</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 underline shrink-0 ml-2">
                Change
              </span>
            </div>
          ) : (
            <>
              <Upload size={16} className={errors.screenshot ? 'text-rose-400' : 'text-stone-400'} />
              <span className={`text-xs font-medium ${errors.screenshot ? 'text-rose-600 font-semibold' : 'text-stone-600'}`}>
                Upload payment screenshot
              </span>
            </>
          )}
        </button>
        {errors.screenshot && <ErrorText text={errors.screenshot} />}
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 rounded-2xl bg-[#15803D] hover:bg-[#166534] text-white font-bold text-sm tracking-wide shadow-md shadow-emerald-700/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Verifying &amp; Generating Pass...</span>
            </>
          ) : (
            <span>Confirm &amp; Download Ticket</span>
          )}
        </button>
      </div>
    </form>
  );
}

function ErrorText({ text }: { text: string }) {
  return (
    <p className="flex items-center gap-1 text-xs font-semibold text-rose-600 mt-1.5 ml-1">
      <AlertCircle size={13} />
      {text}
    </p>
  );
}
