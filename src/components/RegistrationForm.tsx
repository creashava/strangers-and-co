'use client';

import { useState, useRef } from 'react';
import { UTR_REGEX, PHONE_REGEX, EMAIL_REGEX } from '@/lib/constants';
import type { RegistrationFormData } from '@/lib/types';
import {
  analyzeScreenshot,
  validateImageFile,
  type ScreenshotVerificationResult,
} from '@/lib/screenshotVerifier';
import {
  Upload,
  User,
  Mail,
  Phone,
  Hash,
  Loader2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';

interface RegistrationFormProps {
  onSubmit: (data: RegistrationFormData) => Promise<void>;
  isSubmitting: boolean;
  expectedAmount?: number;
}

export default function RegistrationForm({
  onSubmit,
  isSubmitting,
  expectedAmount = 99,
}: RegistrationFormProps) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    utr_number: '',
  });
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isVerifyingScreenshot, setIsVerifyingScreenshot] = useState(false);
  const [verificationResult, setVerificationResult] = useState<ScreenshotVerificationResult | null>(null);
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
    } else if (verificationResult?.status === 'rejected') {
      newErrors.screenshot = verificationResult.message || 'Invalid payment receipt image';
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Fast pre-check
    const preCheck = await validateImageFile(file);
    if (!preCheck.ok) {
      setErrors((prev) => ({ ...prev, screenshot: preCheck.error || 'Invalid image file' }));
      return;
    }

    setScreenshot(file);
    setVerificationResult(null);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.screenshot;
      return next;
    });

    const reader = new FileReader();
    reader.onload = () => setScreenshotPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Run OCR screenshot analysis in background
    setIsVerifyingScreenshot(true);
    try {
      const result = await analyzeScreenshot(file, expectedAmount);
      setVerificationResult(result);

      if (result.status === 'rejected') {
        setErrors((prev) => ({ ...prev, screenshot: result.message }));
      } else {
        // Clear screenshot error
        setErrors((prev) => {
          const next = { ...prev };
          delete next.screenshot;
          return next;
        });

        // Auto-fill UTR if detected from screenshot and field is empty or non-12-digit
        if (result.detectedUtr) {
          setFormData((prev) => ({
            ...prev,
            utr_number: result.detectedUtr || prev.utr_number,
          }));
          setErrors((prev) => {
            const next = { ...prev };
            delete next.utr_number;
            return next;
          });
        }
      }
    } catch {
      // Non-blocking
    } finally {
      setIsVerifyingScreenshot(false);
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
        <div className="flex items-center justify-between mb-1.5 ml-1">
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
            Payment Screenshot <span className="text-rose-500">*</span>
          </label>
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
            Required: ₹{expectedAmount}
          </span>
        </div>
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
          className={`w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
            verificationResult?.status === 'verified'
              ? 'border-emerald-500/80 bg-emerald-50/60'
              : verificationResult?.status === 'rejected' || errors.screenshot
              ? 'border-rose-400 bg-rose-50/40 ring-1 ring-rose-200'
              : screenshotPreview
              ? 'border-stone-400 bg-stone-50'
              : 'border-stone-300 bg-stone-50/50 hover:bg-stone-100/60 hover:border-stone-400'
          }`}
          disabled={isSubmitting}
        >
          {screenshotPreview ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-800 truncate">
                <FileCheck size={16} className="text-emerald-600 shrink-0" />
                <span className="truncate">{screenshot?.name || 'Screenshot Attached'}</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 underline shrink-0 ml-2">
                Replace
              </span>
            </div>
          ) : (
            <>
              <Upload size={16} className={errors.screenshot ? 'text-rose-400' : 'text-stone-400'} />
              <span className={`text-xs font-medium ${errors.screenshot ? 'text-rose-600 font-semibold' : 'text-stone-600'}`}>
                Upload payment screenshot (₹{expectedAmount})
              </span>
            </>
          )}
        </button>

        {/* Real-time OCR Analysis Progress */}
        {isVerifyingScreenshot && (
          <div className="mt-2.5 p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-2 animate-pulse">
            <Loader2 size={14} className="animate-spin text-blue-600 shrink-0" />
            <span>Scanning receipt: checking ₹{expectedAmount} amount &amp; 12-digit UTR...</span>
          </div>
        )}

        {/* Verification Status Feedback */}
        {!isVerifyingScreenshot && verificationResult && (
          <div className="mt-2.5">
            {verificationResult.status === 'verified' && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span>Valid Payment Screenshot Verified</span>
                </div>
                <p className="text-[11px] text-emerald-700 mt-0.5 ml-5">
                  Amount ₹{expectedAmount} confirmed.{' '}
                  {verificationResult.detectedUtr ? (
                    <>
                      UTR <strong className="font-mono font-bold text-emerald-800">{verificationResult.detectedUtr}</strong> detected &amp; auto-filled!
                    </>
                  ) : (
                    'Please ensure your 12-digit UTR is entered above.'
                  )}
                </p>
              </div>
            )}

            {verificationResult.status === 'warning' && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                  <span>Screenshot Uploaded</span>
                </div>
                <p className="text-[11px] text-amber-800 mt-0.5 ml-5">
                  {verificationResult.message}
                </p>
              </div>
            )}

            {verificationResult.status === 'rejected' && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertCircle size={14} className="text-rose-600 shrink-0" />
                  <span>Invalid Screenshot</span>
                </div>
                <p className="text-[11px] text-rose-700 mt-0.5 ml-5">
                  {verificationResult.message}
                </p>
              </div>
            )}
          </div>
        )}

        {errors.screenshot && !verificationResult?.status && <ErrorText text={errors.screenshot} />}
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting || isVerifyingScreenshot || verificationResult?.status === 'rejected'}
          className="w-full py-4 rounded-2xl bg-[#15803D] hover:bg-[#166534] text-white font-bold text-sm tracking-wide shadow-md shadow-emerald-700/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
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
