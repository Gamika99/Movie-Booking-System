import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { 
  FaCreditCard, FaMobileAlt, FaUniversity, FaWallet, 
  FaLock, FaShieldAlt, FaArrowLeft, FaCheckCircle 
} from 'react-icons/fa';
import { confirmBooking } from '../../store/slices/bookingSlice';
import toast from 'react-hot-toast';

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { currentBooking, paymentIntent, loading } = useSelector((state) => state.bookings);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [processing, setProcessing] = useState(false);

  const paymentMethods = [
    { id: 'card', name: 'Credit/Debit Card', icon: <FaCreditCard /> },
    { id: 'upi', name: 'UPI', icon: <FaMobileAlt /> },
    { id: 'netbanking', name: 'Net Banking', icon: <FaUniversity /> },
    { id: 'wallet', name: 'Wallet', icon: <FaWallet /> },
  ];

  const handlePayment = async () => {
    setProcessing(true);
    
    // Simulate payment processing
    setTimeout(async () => {
      try {
        const result = await dispatch(confirmBooking({
          bookingId: currentBooking._id,
          paymentDetails: {
            paymentIntentId: paymentIntent?.id,
            paymentMethod,
            amount: currentBooking.finalAmount
          }
        })).unwrap();
        
        toast.success('Payment successful! Booking confirmed.');
        navigate(`/booking-success/${currentBooking._id}`);
      } catch (error) {
        toast.error('Payment failed. Please try again.');
      } finally {
        setProcessing(false);
      }
    }, 2000);
  };

  if (!currentBooking) {
    navigate('/');
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-primary-500 mb-6"
      >
        <FaArrowLeft />
        <span>Back to Checkout</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Payment Form */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Payment Method
            </h2>

            {/* Payment Method Selection */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`p-4 rounded-lg border-2 transition flex flex-col items-center space-y-2 ${
                    paymentMethod === method.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                  }`}
                >
                  <div className={`text-2xl ${
                    paymentMethod === method.id ? 'text-primary-500' : 'text-gray-400'
                  }`}>
                    {method.icon}
                  </div>
                  <span className={`text-sm font-medium ${
                    paymentMethod === method.id ? 'text-primary-500' : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {method.name}
                  </span>
                </button>
              ))}
            </div>

            {/* Card Payment Form */}
            {paymentMethod === 'card' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Card Number
                  </label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      CVV
                    </label>
                    <input
                      type="password"
                      placeholder="123"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </motion.div>
            )}

            {/* UPI Payment Form */}
            {paymentMethod === 'upi' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    UPI ID
                  </label>
                  <input
                    type="text"
                    placeholder="username@okhdfcbank"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </motion.div>
            )}

            {/* Security Notice */}
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-start space-x-3">
              <FaLock className="text-green-600 mt-0.5" />
              <div className="text-sm text-green-800 dark:text-green-200">
                <p className="font-semibold">Secure Payment</p>
                <p>Your payment information is encrypted and secure. We never store your card details.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sticky top-24">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Order Summary
            </h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Ticket Price</span>
                <span className="font-semibold">₹{currentBooking.totalAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Convenience Fee</span>
                <span className="font-semibold">₹{currentBooking.convenienceFee}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">GST (18%)</span>
                <span className="font-semibold">₹{Math.round(currentBooking.convenienceFee * 0.18)}</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount</span>
                  <span className="text-primary-500">₹{currentBooking.finalAmount}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handlePayment}
              disabled={processing}
              className={`w-full py-3 rounded-lg font-semibold transition flex items-center justify-center space-x-2 ${
                !processing
                  ? 'bg-primary-500 text-white hover:bg-primary-600'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <FaShieldAlt />
                  <span>Pay ₹{currentBooking.finalAmount}</span>
                </>
              )}
            </button>

            <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-gray-500">
              <FaCheckCircle />
              <span>100% Secure Payment</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;