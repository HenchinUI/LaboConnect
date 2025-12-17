/**
 * Audit logging utility for tracking admin actions
 */

const db = require('../db');

/**
 * Log an admin action
 */
const logAction = async (adminId, action, targetTable, targetId, oldValue, newValue, req) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';
    
    await db.query(
      `INSERT INTO audit_logs (admin_id, action, target_table, target_id, old_value, new_value, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [adminId, action, targetTable, targetId, oldValue, newValue, ipAddress, userAgent]
    );
    
    return true;
  } catch (err) {
    console.error('Error logging action:', err);
    return false;
  }
};

/**
 * Get audit logs for a specific entity
 */
const getAuditLogs = async (targetTable, targetId, limit = 50) => {
  try {
    const { rows } = await db.query(
      `SELECT a.id, a.admin_id, u.username, a.action, a.target_table, a.target_id, 
              a.old_value, a.new_value, a.ip_address, a.created_at
       FROM audit_logs a
       LEFT JOIN users u ON a.admin_id = u.id
       WHERE a.target_table = $1 AND a.target_id = $2
       ORDER BY a.created_at DESC
       LIMIT $3`,
      [targetTable, targetId, limit]
    );
    
    return rows;
  } catch (err) {
    console.error('Error getting audit logs:', err);
    return [];
  }
};

/**
 * Get audit logs for an admin
 */
const getAdminAuditLogs = async (adminId, limit = 50) => {
  try {
    const { rows } = await db.query(
      `SELECT id, admin_id, action, target_table, target_id, old_value, new_value, ip_address, created_at
       FROM audit_logs
       WHERE admin_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [adminId, limit]
    );
    
    return rows;
  } catch (err) {
    console.error('Error getting admin audit logs:', err);
    return [];
  }
};

module.exports = {
  logAction,
  getAuditLogs,
  getAdminAuditLogs
};
