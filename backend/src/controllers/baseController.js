/**
 * Base Controller Class
 * Provides common CRUD operations and response helpers for all controllers
 */
class BaseController {
  constructor(model, modelName) {
    this.model = model;
    this.modelName = modelName;
  }

  /**
   * Standard success response
   */
  sendSuccess(res, data, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Standard error response
   */
  sendError(res, message = 'Internal Server Error', statusCode = 500, details = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Standard validation error response
   */
  sendValidationError(res, errors) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Standard not found response
   */
  sendNotFound(res, message = `${this.modelName} not found`) {
    return res.status(404).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Generic create operation
   */
  async create(req, res) {
    try {
      const data = new this.model(req.body);
      await data.save();
      return this.sendSuccess(res, data, `${this.modelName} created successfully`, 201);
    } catch (error) {
      if (error.name === 'ValidationError') {
        return this.sendValidationError(res, error.errors);
      }
      console.error(`Error creating ${this.modelName}:`, error);
      return this.sendError(res, `Failed to create ${this.modelName}`);
    }
  }

  /**
   * Generic read all operation with pagination
   */
  async getAll(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Max 100 items
      const skip = (page - 1) * limit;
      
      const filter = this.buildFilter(req.query);
      const sort = this.buildSort(req.query.sort);

      const [data, total] = await Promise.all([
        this.model.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate(this.getPopulateFields()),
        this.model.countDocuments(filter)
      ]);

      const pagination = {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      };

      return this.sendSuccess(res, { items: data, pagination }, `${this.modelName}s retrieved successfully`);
    } catch (error) {
      console.error(`Error fetching ${this.modelName}s:`, error);
      return this.sendError(res, `Failed to fetch ${this.modelName}s`);
    }
  }

  /**
   * Generic read one operation
   */
  async getById(req, res) {
    try {
      const data = await this.model
        .findById(req.params.id)
        .populate(this.getPopulateFields());
      
      if (!data) {
        return this.sendNotFound(res);
      }

      return this.sendSuccess(res, data, `${this.modelName} retrieved successfully`);
    } catch (error) {
      console.error(`Error fetching ${this.modelName}:`, error);
      return this.sendError(res, `Failed to fetch ${this.modelName}`);
    }
  }

  /**
   * Generic update operation
   */
  async update(req, res) {
    try {
      const data = await this.model.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate(this.getPopulateFields());

      if (!data) {
        return this.sendNotFound(res);
      }

      return this.sendSuccess(res, data, `${this.modelName} updated successfully`);
    } catch (error) {
      if (error.name === 'ValidationError') {
        return this.sendValidationError(res, error.errors);
      }
      console.error(`Error updating ${this.modelName}:`, error);
      return this.sendError(res, `Failed to update ${this.modelName}`);
    }
  }

  /**
   * Generic delete operation
   */
  async delete(req, res) {
    try {
      const data = await this.model.findByIdAndDelete(req.params.id);
      
      if (!data) {
        return this.sendNotFound(res);
      }

      return this.sendSuccess(res, null, `${this.modelName} deleted successfully`);
    } catch (error) {
      console.error(`Error deleting ${this.modelName}:`, error);
      return this.sendError(res, `Failed to delete ${this.modelName}`);
    }
  }

  /**
   * Build filter object from query parameters
   * Override in child classes for custom filtering
   */
  buildFilter(query) {
    const filter = {};
    
    // Add organization filter if present in request
    if (query.organizationId) {
      filter.organizationId = query.organizationId;
    }

    // Add search functionality
    if (query.search && this.getSearchFields().length > 0) {
      filter.$or = this.getSearchFields().map(field => ({
        [field]: { $regex: query.search, $options: 'i' }
      }));
    }

    // Add date range filter
    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) {
        filter.createdAt.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        filter.createdAt.$lte = new Date(query.endDate);
      }
    }

    return filter;
  }

  /**
   * Build sort object from sort parameter
   */
  buildSort(sortParam) {
    if (!sortParam) return { createdAt: -1 };
    
    const [field, order] = sortParam.split(':');
    return { [field]: order === 'asc' ? 1 : -1 };
  }

  /**
   * Get fields to populate in queries
   * Override in child classes
   */
  getPopulateFields() {
    return '';
  }

  /**
   * Get searchable fields for text search
   * Override in child classes
   */
  getSearchFields() {
    return [];
  }

  /**
   * Validate request body against schema
   */
  validateRequest(schema) {
    return (req, res, next) => {
      const { error } = schema.validate(req.body);
      if (error) {
        return this.sendValidationError(res, error.details);
      }
      next();
    };
  }

  /**
   * Check if user has permission for operation
   */
  checkPermission(permission) {
    return (req, res, next) => {
      if (!req.user.permissions.includes(permission) && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          timestamp: new Date().toISOString()
        });
      }
      next();
    };
  }

  /**
   * Ensure user can only access their organization's data
   */
  filterByOrganization(req, res, next) {
    if (req.user.role !== 'admin') {
      req.query.organizationId = req.user.organizationId;
    }
    next();
  }
}

module.exports = BaseController;
