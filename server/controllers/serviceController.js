const Service = require('../models/Service');
const Treatment = require('../models/Treatment');
const { nextServiceId } = require('../utils/idGenerator');
const { logAudit } = require('../services/auditService');

// @desc    Get all services
// @route   GET /api/services
const getServices = async (req, res, next) => {
  try {
    const { q, status } = req.query;
    let query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (q && q.trim()) {
      query.name = new RegExp(q.trim(), 'i');
    }

    const services = await Service.find(query).sort({ name: 1 });
    res.json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single service
// @route   GET /api/services/:id
const getServiceById = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new service
// @route   POST /api/services
const createService = async (req, res, next) => {
  try {
    const { name, description, minPrice, maxPrice, defaultPrice, type, status } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Service name is required'
      });
    }

    const existing = await Service.findOne({ name: new RegExp(`^${name.trim()}$`, 'i') });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A service named "${name}" already exists`
      });
    }

    const serviceId = await nextServiceId();

    const service = await Service.create({
      serviceId,
      name: name.trim(),
      description: description || '',
      minPrice: Number(minPrice) || 0,
      maxPrice: Number(maxPrice) || 0,
      defaultPrice: Number(defaultPrice) || Number(minPrice) || 0,
      type: type || 'One-time',
      status: status || 'Active'
    });

    await logAudit({
      user: req.user ? req.user.username : 'Staff',
      action: 'CREATE_SERVICE',
      entity: 'Service',
      entityId: service.serviceId,
      details: { name: service.name, type: service.type }
    });

    res.status(201).json({
      success: true,
      data: service
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update service
// @route   PUT /api/services/:id
const updateService = async (req, res, next) => {
  try {
    let service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    service = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    await logAudit({
      user: req.user ? req.user.username : 'Staff',
      action: 'UPDATE_SERVICE',
      entity: 'Service',
      entityId: service.serviceId,
      details: { name: service.name }
    });

    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle service status (Disable / Enable)
// @route   PATCH /api/services/:id/toggle-status
const toggleServiceStatus = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    service.status = service.status === 'Active' ? 'Inactive' : 'Active';
    await service.save();

    await logAudit({
      user: req.user ? req.user.username : 'Staff',
      action: 'TOGGLE_SERVICE_STATUS',
      entity: 'Service',
      entityId: service.serviceId,
      details: { name: service.name, newStatus: service.status }
    });

    res.json({
      success: true,
      message: `Service marked as ${service.status}`,
      data: service
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete service
// @route   DELETE /api/services/:id
const deleteService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    const treatmentsUsingService = await Treatment.countDocuments({ serviceId: service._id });
    if (treatmentsUsingService > 0) {
      // Soft disable instead
      service.status = 'Inactive';
      await service.save();

      return res.json({
        success: true,
        message: 'Service is assigned to existing treatments. It has been deactivated instead of permanently deleted.',
        data: service
      });
    }

    await Service.findByIdAndDelete(req.params.id);

    await logAudit({
      user: req.user ? req.user.username : 'Staff',
      action: 'DELETE_SERVICE',
      entity: 'Service',
      entityId: service.serviceId,
      details: { name: service.name }
    });

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getServices,
  getServiceById,
  createService,
  updateService,
  toggleServiceStatus,
  deleteService
};
