/**
 * Role-based access control middleware and utilities
 */

const db = require('../db');

/**
 * Middleware to check if user is authenticated
 */
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

/**
 * Middleware to check if user has a specific role
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const userRole = req.session.user.admin_role || req.session.user.role;
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

/**
 * Middleware to check if user has a specific permission
 */
const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.session || !req.session.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const userRole = req.session.user.admin_role || req.session.user.role;
      
      // Check if user has permission
      const { rows } = await db.query(
        'SELECT * FROM role_permissions WHERE admin_role = $1 AND permission = $2',
        [userRole, permission]
      );
      
      if (rows.length === 0) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      
      next();
    } catch (err) {
      console.error('Permission check error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  };
};

/**
 * Check if user is verified
 */
const requireVerified = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (!req.session.user.is_verified) {
    return res.status(403).json({ error: 'User verification required' });
  }
  
  next();
};

/**
 * Get user's role from database (refreshes session)
 */
const getUserRole = async (userId) => {
  try {
    const { rows } = await db.query(
      'SELECT role, admin_role FROM users WHERE id = $1',
      [userId]
    );
    
    if (rows.length === 0) return null;
    return rows[0].admin_role || rows[0].role;
  } catch (err) {
    console.error('Error getting user role:', err);
    return null;
  }
};

/**
 * Get user's permissions
 */
const getUserPermissions = async (userId) => {
  try {
    const userRole = await getUserRole(userId);
    if (!userRole) return [];
    
    const { rows } = await db.query(
      'SELECT permission FROM role_permissions WHERE admin_role = $1',
      [userRole]
    );
    
    return rows.map(row => row.permission);
  } catch (err) {
    console.error('Error getting user permissions:', err);
    return [];
  }
};

/**
 * Check if user has permission
 */
const hasPermission = async (userId, permission) => {
  try {
    const permissions = await getUserPermissions(userId);
    return permissions.includes(permission);
  } catch (err) {
    console.error('Error checking permission:', err);
    return false;
  }
};

/**
 * Update user session with latest role info
 */
const refreshUserSession = async (req) => {
  try {
    if (!req.session || !req.session.user) return false;
    
    const { rows } = await db.query(
      'SELECT id, username, email, role, admin_role, is_verified FROM users WHERE id = $1',
      [req.session.user.id]
    );
    
    if (rows.length === 0) return false;
    
    req.session.user = {
      id: rows[0].id,
      username: rows[0].username,
      email: rows[0].email,
      role: rows[0].role,
      admin_role: rows[0].admin_role,
      is_verified: rows[0].is_verified
    };
    
    return true;
  } catch (err) {
    console.error('Error refreshing user session:', err);
    return false;
  }
};

module.exports = {
  requireAuth,
  requireRole,
  requirePermission,
  requireVerified,
  getUserRole,
  getUserPermissions,
  hasPermission,
  refreshUserSession
};
