const JobRequest = require('../models/JobRequest');
const fs = require('fs');

// @desc    Create a new job request
// @route   POST /api/v1/requests
// @access  Public (multipart: name, phone, email, description, province, city, neighborhood, street, photos[])
exports.createRequest = async (req, res) => {
  try {
    const { name, phone, email, description, province, city, neighborhood, street, whatsapp, telegram } = req.body;
    if (!name || !phone || !description) {
      return res.status(400).json({ success: false, error: 'Nombre, teléfono y descripción son obligatorios' });
    }
    const photos = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const base64 = fs.readFileSync(file.path, 'base64');
        photos.push(`data:${file.mimetype};base64,${base64}`);
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }
    }
    const request = await JobRequest.create({
      name, phone, email, description,
      category: req.body.category,
      location: { province, city, neighborhood, street },
      contactMethods: {
        whatsapp: whatsapp === 'true' || whatsapp === true,
        telegram: telegram === 'true' || telegram === true
      },
      photos
    });
    res.status(201).json({ success: true, data: request });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Get all job requests
// @route   GET /api/v1/requests
// @access  Public
exports.getRequests = async (req, res) => {
  try {
    const { status, province, city } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (province) filter['location.province'] = province;
    if (city) filter['location.city'] = city;
    const requests = await JobRequest.find(filter).sort('-createdAt');
    res.json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Get single job request
// @route   GET /api/v1/requests/:id
// @access  Public
exports.getRequest = async (req, res) => {
  try {
    const request = await JobRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
    res.json({ success: true, data: request });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
