const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (!roles.includes(req.user.role) && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to perform this action`
      });
    }
    next();
  };
};

module.exports = { authorize };
