import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Check, Star, Zap, Shield, Crown } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function Premium() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgrade = async () => {
    if (currentUser?.isPremium) {
      toast.success('You are already on the Premium plan!');
      return;
    }

    setLoading(true);

    try {
      // 1. Load Razorpay script
      const res = await loadRazorpayScript();
      if (!res) {
        toast.error('Razorpay SDK failed to load. Are you online?');
        setLoading(false);
        return;
      }

      // 2. Create Order on Backend
      const { data: order } = await api.post('/payments/create-order');

      // 3. Initialize Razorpay Checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_SyHdQL7pK1tlnG', // fallback for dev
        amount: order.amount,
        currency: order.currency,
        name: 'File Sharing App',
        description: 'Upgrade to Premium Plan (100MB)',
        image: 'https://cdn-icons-png.flaticon.com/512/3589/3589030.png',
        order_id: order.id,
        handler: async function (response) {
          try {
            // 4. Verify Payment on Backend
            const verifyRes = await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.data.success) {
              toast.success('Payment successful! Upgraded to Premium. Please refresh.');
              // Optionally trigger a context refresh here or reload
              setTimeout(() => {
                window.location.reload();
              }, 2000);
            } else {
              toast.error('Payment verification failed.');
            }
          } catch (err) {
            console.error(err);
            toast.error('Error verifying payment.');
          }
        },
        prefill: {
          name: currentUser.fullName || 'User',
          email: currentUser.email,
        },
        theme: {
          color: '#3B82F6', // primary blue
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to initiate checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
          Upgrade your Cloud Experience
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
          Choose the plan that best fits your storage needs. Seamlessly share files, host websites, and never worry about running out of space.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-12">
        
        {/* Free Plan */}
        <div className="glass rounded-2xl p-8 border border-gray-200 dark:border-gray-700 relative flex flex-col">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Basic</h3>
            <div className="mt-4 flex items-baseline text-4xl font-extrabold text-gray-900 dark:text-white">
              ₹0
              <span className="ml-1 text-xl font-medium text-gray-500 dark:text-gray-400">/forever</span>
            </div>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Perfect for getting started with file sharing and hosting small static sites.
            </p>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <Check className="w-5 h-5 text-emerald-500 mr-3 shrink-0" />
              10 MB Total Storage (Free Tier)
            </li>
            <li className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <Check className="w-5 h-5 text-emerald-500 mr-3 shrink-0" />
              8 MB Max File Size
            </li>
            <li className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <Check className="w-5 h-5 text-emerald-500 mr-3 shrink-0" />
              Basic File Sharing Links
            </li>
            <li className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <Check className="w-5 h-5 text-emerald-500 mr-3 shrink-0" />
              HTML Live Hosting
            </li>
          </ul>
          <button 
            disabled
            className="w-full py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium rounded-xl border border-gray-200 dark:border-gray-700 text-center"
          >
            {currentUser?.isPremium ? 'Downgrade not available' : 'Current Plan'}
          </button>
        </div>

        {/* Premium Plan */}
        <div className="glass rounded-2xl p-8 border-2 border-primary relative flex flex-col shadow-2xl shadow-primary/20 transform md:-translate-y-4">
          <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-xl flex items-center shadow-lg">
            <Star className="w-3 h-3 mr-1 fill-current" /> MOST POPULAR
          </div>
          
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
              Premium <Crown className="w-5 h-5 ml-2 text-yellow-500" />
            </h3>
            <div className="mt-4 flex items-baseline text-4xl font-extrabold text-primary">
              ₹199
              <span className="ml-1 text-xl font-medium text-gray-500 dark:text-gray-400">/one-time</span>
            </div>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              For power users who need massive storage and priority features.
            </p>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-center text-sm font-medium text-gray-900 dark:text-white">
              <Check className="w-5 h-5 text-primary mr-3 shrink-0" />
              100 MB Total Storage
            </li>
            <li className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <Check className="w-5 h-5 text-primary mr-3 shrink-0" />
              No Max File Size Limit
            </li>
            <li className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <Check className="w-5 h-5 text-primary mr-3 shrink-0" />
              Advanced Security & Encrypted Links
            </li>
            <li className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <Check className="w-5 h-5 text-primary mr-3 shrink-0" />
              Priority HTML Hosting Speed
            </li>
          </ul>
          
          <button 
            onClick={handleUpgrade}
            disabled={loading || currentUser?.isPremium}
            className={`w-full py-3 px-4 font-medium rounded-xl text-white shadow-lg transition-all
              ${currentUser?.isPremium 
                ? 'bg-emerald-500 hover:bg-emerald-600' 
                : 'bg-primary hover:bg-primary/90 hover:scale-[1.02] active:scale-95 shadow-primary/30'}
            `}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing...
              </span>
            ) : currentUser?.isPremium ? (
              <span className="flex items-center justify-center">
                <Check className="w-5 h-5 mr-2" /> Active Plan
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <Zap className="w-5 h-5 mr-2 fill-current" /> Upgrade Now
              </span>
            )}
          </button>
        </div>

      </div>

      <div className="mt-12 max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
        <div className="p-4">
          <Shield className="w-8 h-8 text-primary mx-auto mb-3" />
          <h4 className="font-semibold text-gray-900 dark:text-white">Secure Payments</h4>
          <p className="text-xs text-gray-500 mt-1">Processed securely by Razorpay. We do not store your card details.</p>
        </div>
        <div className="p-4">
          <Zap className="w-8 h-8 text-primary mx-auto mb-3" />
          <h4 className="font-semibold text-gray-900 dark:text-white">Instant Activation</h4>
          <p className="text-xs text-gray-500 mt-1">Your 100MB storage is unlocked instantly upon successful payment.</p>
        </div>
        <div className="p-4">
          <Star className="w-8 h-8 text-primary mx-auto mb-3" />
          <h4 className="font-semibold text-gray-900 dark:text-white">One-Time Fee</h4>
          <p className="text-xs text-gray-500 mt-1">No recurring subscriptions. Pay once and enjoy premium forever.</p>
        </div>
      </div>
    </div>
  );
}
