const {
  getLaunchCurtainStatus,
  setLaunchCurtainEnabled
} = require('../utils/launchCurtainConfig');

// @desc    Public launch curtain status (for grid pages)
// @route   GET /api/v1/public/launch-curtain
// @access  Public
exports.getPublicLaunchCurtainStatus = async (req, res) => {
  try {
    const status = await getLaunchCurtainStatus();
    res.status(200).json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Admin launch curtain settings
// @route   GET /api/v1/admin/launch-curtain
// @access  Private/Admin
exports.getAdminLaunchCurtainConfig = async (req, res) => {
  try {
    const status = await getLaunchCurtainStatus();
    res.status(200).json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Enable or disable launch curtain (hide grids until opening)
// @route   PUT /api/v1/admin/launch-curtain
// @access  Private/Admin
exports.updateLaunchCurtainConfig = async (req, res) => {
  try {
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ success: false, error: 'enabled must be a boolean' });
    }

    const status = await setLaunchCurtainEnabled(enabled);
    res.status(200).json({
      success: true,
      message: enabled ? 'Launch curtain enabled' : 'Launch curtain disabled',
      data: status
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
