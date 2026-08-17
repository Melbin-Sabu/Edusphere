const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verify JWT token middleware
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "Not authorized, user not found" });
      }

      if (req.user.status === "Inactive") {
        return res.status(403).json({ message: "Account is inactive" });
      }

      next();
    } catch (error) {
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token provided" });
  }
};

// Role authorization middleware
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user?.role ? req.user.role.toUpperCase() : "";
    const allowedRoles = roles.map((r) => r.toUpperCase());
    if (!req.user || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: `Role (${req.user?.role}) is not authorized to access this resource`,
      });
    }
    next();
  };
};

module.exports = {
  protect,
  authorizeRoles,
};
