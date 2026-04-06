'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

export default function CoursePayCard({
  course,
  initialCouponCode = '',
  couponLockedFromUrl = false,
  onSuccess,
  className = '',
}) {
  const { data: session, update } = useSession();
  const [couponInput, setCouponInput] = useState(
    initialCouponCode ? String(initialCouponCode).toUpperCase() : ''
  );
  const [pricing, setPricing] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const basePrice = Number(course?.price) || 0;

  useEffect(() => {
    if (initialCouponCode) {
      setCouponInput(String(initialCouponCode).toUpperCase());
    }
  }, [initialCouponCode]);

  const applyCoupon = useCallback(
    async (code, opts = {}) => {
      const silent = Boolean(opts.silent);
      const trimmed = String(code || '').trim();
      if (!trimmed) {
        setPricing(null);
        setCouponError('');
        return;
      }
      setCouponError('');
      try {
        const res = await fetch('/api/coupons/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId: course._id, code: trimmed }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          setPricing(null);
          setCouponError(data.message || 'Invalid coupon');
          return;
        }
        setPricing({
          originalPrice: data.originalPrice,
          finalPrice: data.finalPrice,
          discountAmount: data.discountAmount,
          couponId: data.couponId,
          code: data.code,
        });
        if (!silent) toast.success('Coupon applied');
      } catch {
        setPricing(null);
        setCouponError('Could not validate coupon');
      }
    },
    [course._id]
  );

  useEffect(() => {
    if (initialCouponCode && session) {
      applyCoupon(initialCouponCode, { silent: true });
    }
  }, [initialCouponCode, session, applyCoupon]);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePay = async () => {
    if (!session) {
      setError('Please login to purchase');
      return;
    }
    setIsLoading(true);
    setError('');

    let couponForOrder = '';
    if (couponInput.trim()) {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: course._id, code: couponInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.message || 'Invalid coupon');
        toast.error(data.message || 'Invalid coupon');
        setIsLoading(false);
        return;
      }
      couponForOrder = couponInput.trim();
      setPricing({
        originalPrice: data.originalPrice,
        finalPrice: data.finalPrice,
        discountAmount: data.discountAmount,
        couponId: data.couponId,
        code: data.code,
      });
    }

    try {
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error('Failed to load Razorpay');

      const orderResponse = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course._id,
          couponCode: couponForOrder,
        }),
      });
      const orderData = await orderResponse.json();
      if (!orderData.success) {
        throw new Error(orderData.message || 'Failed to create order');
      }

      const options = {
        key: orderData.order.key,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'Digital Career Center',
        description: `Course: ${course.title}`,
        order_id: orderData.order.id,
        handler: async function (response) {
          try {
            const verifyResponse = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                courseId: course._id,
              }),
            });
            const verifyData = await verifyResponse.json();
            if (verifyData.success) {
              if (verifyData.isActive) {
                await update({ isActive: true });
              }
              toast.success('Payment successful!');
              onSuccess?.(verifyData.course);
            } else {
              setError(verifyData.message || 'Verification failed');
              toast.error(verifyData.message || 'Verification failed');
            }
          } catch {
            setError('Payment verification failed');
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: session.user.name || '',
          email: session.user.email || '',
        },
        theme: { color: '#dc2626' },
        modal: {
          ondismiss: () => setIsLoading(false),
        },
      };

      const rz = new window.Razorpay(options);
      rz.open();
    } catch (e) {
      setError(e.message || 'Payment failed');
      toast.error(e.message || 'Payment failed');
    } finally {
      setIsLoading(false);
    }
  };

  const displayOriginal = pricing?.originalPrice ?? basePrice;
  const displayFinal = pricing?.finalPrice ?? basePrice;
  const showDiscount = pricing && pricing.discountAmount > 0;

  return (
    <div className={className}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Coupon code
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={couponInput}
            onChange={(e) => {
              if (couponLockedFromUrl) return;
              setCouponInput(e.target.value.toUpperCase());
              setPricing(null);
              setCouponError('');
            }}
            readOnly={couponLockedFromUrl}
            placeholder="Optional"
            className={`flex-1 px-3 py-2 border border-gray-300 rounded-lg uppercase ${
              couponLockedFromUrl ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
          />
          {!couponLockedFromUrl && (
            <button
              type="button"
              onClick={() => applyCoupon(couponInput)}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium"
            >
              Apply
            </button>
          )}
        </div>
        {couponLockedFromUrl && (
          <p className="text-xs text-gray-500 mt-1">
            Applied from your link — code is locked.
          </p>
        )}
        {couponError && (
          <p className="text-sm text-red-600 mt-1">{couponError}</p>
        )}
      </div>

      <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">List price</span>
          <span className="line-through text-gray-500">
            ₹{Number(displayOriginal).toLocaleString('en-IN')}
          </span>
        </div>
        {showDiscount && (
          <div className="flex justify-between text-sm text-green-700">
            <span>Discount</span>
            <span>− ₹{Number(pricing.discountAmount).toLocaleString('en-IN')}</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
          <span>You pay</span>
          <span className="text-red-600">
            ₹{Number(displayFinal).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handlePay}
        disabled={isLoading}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-lg transition-colors disabled:opacity-50"
      >
        {isLoading ? 'Processing…' : `Pay ₹${Number(displayFinal).toLocaleString('en-IN')}`}
      </button>
      <p className="text-xs text-gray-500 text-center mt-3">
        Secure checkout via Razorpay
      </p>
    </div>
  );
}
