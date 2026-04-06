'use client';

import CoursePayCard from './CoursePayCard';

const PaymentModal = ({
  course,
  isOpen,
  onClose,
  onSuccess,
  initialCouponCode = '',
  couponLockedFromUrl = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900">Purchase course</h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex items-center space-x-4 mb-4">
            {course.thumbnail && (
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-16 h-16 object-cover rounded-lg"
              />
            )}
            <div>
              <h4 className="font-semibold text-gray-900">{course.title}</h4>
              <p className="text-sm text-gray-600">{course.category}</p>
            </div>
          </div>

          <CoursePayCard
            course={course}
            initialCouponCode={initialCouponCode}
            couponLockedFromUrl={couponLockedFromUrl}
            onSuccess={(c) => {
              onSuccess?.(c);
              onClose();
            }}
          />

          <button
            type="button"
            onClick={onClose}
            className="mt-4 w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>

          <p className="mt-3 text-xs text-gray-500 text-center">
            You will receive a confirmation email after successful payment
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
