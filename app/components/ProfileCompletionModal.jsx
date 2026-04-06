'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { INDIAN_STATE_OPTIONS } from '@/lib/indianStateOptions';

const SNOOZE_MS = 3 * 24 * 60 * 60 * 1000;

export function snoozeProfileCompletionPrompt() {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(
    'dcc_profile_snooze_until',
    String(Date.now() + SNOOZE_MS)
  );
}

export default function ProfileCompletionModal({
  open,
  onClose,
  initialMobile = '',
  initialState = '',
}) {
  const [mobile, setMobile] = useState(initialMobile);
  const [state, setState] = useState(initialState);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setMobile(initialMobile || '');
      setState(initialState || '');
    }
  }, [open, initialMobile, initialState]);

  if (!open) return null;

  const handleDismiss = () => {
    snoozeProfileCompletionPrompt();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const m = String(mobile || '').trim();
    const s = String(state || '').trim();
    if (!m || !s) {
      toast.error('Please enter mobile number and state');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: { mobile: m, state: s } }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Could not save');
        return;
      }
      toast.success('Profile updated');
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('dcc_profile_snooze_until');
      }
      onClose();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-completion-title"
      onClick={handleDismiss}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-100">
          <div>
            <h2 id="profile-completion-title" className="text-lg font-bold text-gray-900">
              Complete your profile
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              After payment, add your contact details. You can close this anytime and update later in Profile.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label htmlFor="pcm-mobile" className="block text-sm font-medium text-gray-700 mb-1">
              Mobile number
            </label>
            <input
              id="pcm-mobile"
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="10-digit mobile"
              autoComplete="tel"
            />
          </div>
          <div>
            <label htmlFor="pcm-state" className="block text-sm font-medium text-gray-700 mb-1">
              State / UT
            </label>
            <select
              id="pcm-state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">Select state</option>
              {INDIAN_STATE_OPTIONS.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save & continue'}
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="w-full text-sm text-gray-600 hover:text-gray-900 py-2"
          >
            I&apos;ll finish later
          </button>

          <p className="text-xs text-center text-gray-500">
            Finish anytime from the Profile page in the menu.
          </p>
        </form>
      </div>
    </div>
  );
}
