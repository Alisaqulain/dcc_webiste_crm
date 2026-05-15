'use client';
import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { INDIAN_STATE_OPTIONS } from '@/lib/indianStateOptions';
// import Header from '../components/Header';
// import Footer from '../components/Footer';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [refLockedFromUrl, setRefLockedFromUrl] = useState(false);
  const [courses, setCourses] = useState([]);
  const [combos, setCombos] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  /** `course:<id>` or `combo:<id>` */
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', mobile: '', password: '',
    state: '', referralCode: '', purchaseSelection: '', agreeToTerms: false
  });

  const parsePurchaseSelection = (value) => {
    if (!value || typeof value !== 'string') return null;
    const [type, id] = value.split(':');
    if ((type === 'course' || type === 'combo') && id) return { type, id };
    return null;
  };

  const purchaseRedirectPath = (selection) => {
    const parsed = parsePurchaseSelection(selection);
    if (!parsed) return null;
    const q = '?pendingPurchase=1';
    if (parsed.type === 'combo') return `/purchase/combo/${parsed.id}${q}`;
    return `/purchase/${parsed.id}${q}`;
  };

  const hasCatalog = courses.length > 0 || combos.length > 0;

  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode && String(refCode).trim()) {
      const trimmed = String(refCode).trim();
      setFormData(prev => ({ ...prev, referralCode: trimmed.toUpperCase() }));
      setRefLockedFromUrl(true);
      const maxAge = 60 * 60 * 24 * 7;
      document.cookie = `signup_ref=${encodeURIComponent(trimmed)}; path=/; max-age=${maxAge}; SameSite=Lax`;
    } else {
      document.cookie = 'signup_ref=; path=/; max-age=0';
    }
  }, [searchParams]);

  useEffect(() => {
    const code = String(formData.referralCode || '').trim();
    if (!code) return;
    const maxAge = 60 * 60 * 24 * 7;
    document.cookie = `signup_ref=${encodeURIComponent(code)}; path=/; max-age=${maxAge}; SameSite=Lax`;
  }, [formData.referralCode]);

  useEffect(() => {
    const preCourse = searchParams.get('course');
    const preCombo = searchParams.get('combo');
    if (preCombo && String(preCombo).trim()) {
      setFormData((prev) => ({
        ...prev,
        purchaseSelection: `combo:${String(preCombo).trim()}`,
      }));
    } else if (preCourse && String(preCourse).trim()) {
      setFormData((prev) => ({
        ...prev,
        purchaseSelection: `course:${String(preCourse).trim()}`,
      }));
    }
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [courseRes, comboRes] = await Promise.all([
          fetch('/api/courses?published=true&limit=100&sortBy=newest'),
          fetch('/api/combos'),
        ]);
        const courseData = await courseRes.json();
        const comboData = await comboRes.json();
        if (!cancelled) {
          if (courseRes.ok) setCourses(courseData.courses || []);
          if (comboRes.ok) setCombos(comboData.combos || []);
        }
      } catch {
        if (!cancelled) {
          setCourses([]);
          setCombos([]);
        }
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'referralCode' && refLockedFromUrl) {
      return;
    }
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const selection = parsePurchaseSelection(formData.purchaseSelection);
    if (!selection) {
      setError('Select a course or combo to continue. Signup completes after you pay.');
      setIsLoading(false);
      return;
    }

    const payPath = purchaseRedirectPath(formData.purchaseSelection);
    if (!payPath) {
      setError('Invalid selection. Please choose again.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          mobile: formData.mobile,
          password: formData.password,
          state: formData.state,
          referralCode: formData.referralCode,
          courseId: selection.type === 'course' ? selection.id : '',
          comboId: selection.type === 'combo' ? selection.id : '',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Auto login after successful signup
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (result?.ok) {
          router.push(payPath);
        } else {
          router.push('/login?message=Account created successfully. Please login.');
        }
      } else {
        setError(data.message || 'Signup failed');
      }
    } catch (error) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    const payPath = purchaseRedirectPath(formData.purchaseSelection);
    if (!payPath) {
      setError('Select a course or combo first, then continue with Google.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const ref = String(formData.referralCode || '').trim();
      if (ref) {
        document.cookie = `signup_ref=${encodeURIComponent(ref)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      }
      await signIn('google', {
        callbackUrl: payPath,
      });
    } catch (error) {
      setError('Google signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      {/* <Header /> */}
      
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Join{' '}
              <span className="relative">
                DCC
                <div className="absolute bottom-0 left-0 w-full h-1 bg-red-600 rounded-full"></div>
              </span>
            </h1>
            <p className="text-gray-600 text-lg">
              Choose a course or combo bundle and create your account. You&apos;ll complete signup by paying — the platform stays locked until purchase succeeds.
            </p>
          </div>

          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Friend referral codes are set only at signup (use your friend&apos;s signup link with <span className="font-mono">?ref=</span>). Discount coupon codes from purchases are applied at checkout, not here.
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Google Signup Button */}
          <div className="text-center">
            <button
              type="button"
              onClick={handleGoogleSignup}
              disabled={isLoading || catalogLoading || !hasCatalog || !formData.purchaseSelection}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 flex items-center justify-center space-x-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Continue with Google</span>
            </button>
            {(!formData.purchaseSelection && hasCatalog) && (
              <p className="mt-2 text-xs text-amber-800">Select a course or combo below before using Google.</p>
            )}
            <div className="mt-4 text-sm text-gray-600">
              <span className="bg-white px-2">or</span>
            </div>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="bg-gray-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Personal Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    id="mobile"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <select
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATE_OPTIONS.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl border-2 border-red-100">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Choose your course or combo <span className="text-red-600">*</span></h3>
              <p className="text-sm text-gray-600 mb-4">
                Required — after account creation you&apos;ll pay for your selection. Until payment succeeds, dashboard and CRM stay locked.
              </p>
              {catalogLoading ? (
                <p className="text-sm text-gray-500">Loading courses and combos…</p>
              ) : !hasCatalog ? (
                <p className="text-sm text-red-600">No courses or combos are available right now. Please try again later or contact support.</p>
              ) : (
                <div className="space-y-5 max-h-80 overflow-y-auto pr-1">
                  {combos.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Combo bundles</p>
                      <div className="space-y-3">
                        {combos.map((combo) => {
                          const value = `combo:${combo._id}`;
                          const courseCount = combo.courseIds?.length || 0;
                          return (
                            <label
                              key={combo._id}
                              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                                formData.purchaseSelection === value
                                  ? 'border-red-600 bg-red-50'
                                  : 'border-gray-200 bg-white hover:border-gray-300'
                              }`}
                            >
                              <input
                                type="radio"
                                name="purchaseSelection"
                                value={value}
                                checked={formData.purchaseSelection === value}
                                onChange={handleInputChange}
                                className="mt-1 h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"
                              />
                              <span className="flex-1 min-w-0">
                                <span className="block font-medium text-gray-900">
                                  {combo.title}
                                  <span className="ml-2 text-xs font-normal text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                                    Combo · {courseCount} courses
                                  </span>
                                </span>
                                <span className="block text-sm text-gray-600 mt-0.5">
                                  ₹{typeof combo.price === 'number' ? combo.price.toLocaleString('en-IN') : combo.price}
                                  {combo.originalPrice > combo.price && (
                                    <span className="ml-2 line-through text-gray-400">
                                      ₹{combo.originalPrice.toLocaleString('en-IN')}
                                    </span>
                                  )}
                                </span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {courses.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Single courses</p>
                      <div className="space-y-3">
                        {courses.map((c) => {
                          const value = `course:${c._id}`;
                          return (
                            <label
                              key={c._id}
                              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                                formData.purchaseSelection === value
                                  ? 'border-red-600 bg-red-50'
                                  : 'border-gray-200 bg-white hover:border-gray-300'
                              }`}
                            >
                              <input
                                type="radio"
                                name="purchaseSelection"
                                value={value}
                                checked={formData.purchaseSelection === value}
                                onChange={handleInputChange}
                                className="mt-1 h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"
                              />
                              <span className="flex-1 min-w-0">
                                <span className="block font-medium text-gray-900">{c.title}</span>
                                <span className="block text-sm text-gray-600 mt-0.5">
                                  ₹{typeof c.price === 'number' ? c.price.toLocaleString('en-IN') : c.price}
                                  {c.category ? ` · ${c.category}` : ''}
                                </span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Referral code (optional)</h3>
              <label htmlFor="referralCode" className="block text-sm font-medium text-gray-700 mb-2">
                Referral code
              </label>
              <input
                type="text"
                id="referralCode"
                name="referralCode"
                value={formData.referralCode}
                onChange={handleInputChange}
                readOnly={refLockedFromUrl}
                autoComplete="off"
                className={`w-full max-w-md px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent uppercase ${
                  refLockedFromUrl ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : ''
                }`}
                placeholder="Enter a friend's code"
              />
              {refLockedFromUrl ? (
                <p className="mt-2 text-sm text-gray-600">This code was applied from your invite link and cannot be edited.</p>
              ) : (
                <p className="mt-2 text-sm text-gray-600">Leave blank if you were not referred. You won&apos;t be able to add or change this later.</p>
              )}
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="agreeToTerms"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleInputChange}
                className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500 focus:ring-2 mt-1"
                required
              />
              <label htmlFor="agreeToTerms" className="text-sm text-gray-700">
                I agree to the{' '}
                <a href="#" className="text-red-600 hover:text-red-800 underline">
                  Terms and Conditions
                </a>{' '}
                and{' '}
                <a href="#" className="text-red-600 hover:text-red-800 underline">
                  Privacy Policy
                </a>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || catalogLoading || !hasCatalog || !formData.purchaseSelection}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </span>
              ) : (
                'Create account & pay for course'
              )}
            </button>
          </form>
        </div>
      </div>
      
      {/* <Footer /> */}
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
    </div>}>
      <SignupForm />
    </Suspense>
  );
}
