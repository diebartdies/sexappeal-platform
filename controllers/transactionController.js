const User = require('../models/User');
const Connection = require('../models/Connection');

// @desc    Request a connection with a professional
// @route   POST /api/v1/transactions/request
// @access  Private (User or Guest)
exports.requestConnection = async (req, res, next) => {
  try {
    const { professionalAlias, message } = req.body;

    if (!professionalAlias) {
      return res.status(400).json({ success: false, error: 'Please provide a professional to connect with.' });
    }

    const professional = await User.findOne({ 'professionalProfile.alias': professionalAlias, role: 'professional' });

    if (!professional) {
      return res.status(404).json({ success: false, error: 'Professional not found.' });
    }

    // The requester's ID comes from the 'protect' middleware
    const requesterId = req.user.id;

    // Check if requester is trying to connect with themselves
    if (professional.id === requesterId) {
        return res.status(400).json({ success: false, error: 'You cannot connect with yourself.' });
    }

    await Connection.create({
      requester: requesterId,
      professional: professional.id,
      message: message
    });

    res.status(201).json({
      success: true,
      message: `Your connection request to ${professionalAlias} has been sent successfully.`
    });

  } catch (error) {
    // Handle potential unique index violation gracefully
    if (error.code === 11000) {
        return res.status(400).json({ success: false, error: 'You already have a pending connection request with this professional.' });
    }
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error: Could not process your request.' });
  }
};