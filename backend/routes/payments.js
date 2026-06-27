const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { db } = require('../config/firebase');
const { verifyToken } = require('../middleware/authMiddleware');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Order Route
router.post('/create-order', verifyToken, async (req, res) => {
  try {
    const options = {
      amount: 19900, // amount in the smallest currency unit (paise for INR) -> ₹199.00
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`,
    };
    
    const order = await razorpay.orders.create(options);
    
    if (!order) {
      return res.status(500).send('Error creating order');
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error creating razorpay order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Verify Payment Route
router.post('/verify', verifyToken, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature === expectedSignature) {
      // Payment is verified
      // Upgrade the user in Firestore
      const userRef = db.collection('Users').doc(req.user.uid);
      
      await userRef.update({
        isPremium: true,
        storageLimit: 100 * 1024 * 1024, // 100 MB
      });

      return res.json({ success: true, message: 'Payment verified and account upgraded successfully' });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

module.exports = router;
