const User = require('../models/User');

// @desc    Force verify a user for testing purposes
// @route   POST /api/v1/testing/verify-user
// @access  Development only
exports.forceVerifyUser = async (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ success: false, error: 'Not Found' });
  }

  try {
    const { userId } = req.body;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.isVerified = true;
    user.verificationStatus = 'approved';
    await user.save();

    res.status(200).json({ success: true, message: `User ${userId} has been force-verified.` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};