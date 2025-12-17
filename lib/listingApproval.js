/**
 * Listing approval workflow utilities
 */

const db = require('../db');
const { logAction } = require('./auditLog');

/**
 * Create approval workflow entry when listing is submitted
 */
const createListingApprovalWorkflow = async (listingId, userId) => {
  try {
    const { rows } = await db.query(
      `INSERT INTO listing_approvals (listing_id, listing_status, submitted_by)
       VALUES ($1, 'submitted', $2)
       RETURNING *`,
      [listingId, userId]
    );
    
    return rows[0];
  } catch (err) {
    console.error('Error creating listing approval workflow:', err);
    return null;
  }
};

/**
 * Update listing status in approval workflow
 */
const updateListingStatus = async (listingId, newStatus, adminId, notes, req) => {
  try {
    let query, params;
    
    if (newStatus === 'admin_approved') {
      query = `
        UPDATE listing_approvals 
        SET listing_status = 'admin_approved', 
            admin_approved_by = $1, 
            admin_approved_at = NOW(),
            admin_notes = $2
        WHERE listing_id = $3
        RETURNING *
      `;
      params = [adminId, notes || null, listingId];
    } else if (newStatus === 'head_admin_pending') {
      query = `
        UPDATE listing_approvals 
        SET listing_status = 'head_admin_pending'
        WHERE listing_id = $1
        RETURNING *
      `;
      params = [listingId];
    } else if (newStatus === 'published') {
      query = `
        UPDATE listing_approvals 
        SET listing_status = 'published', 
            head_admin_approved_by = $1, 
            head_admin_approved_at = NOW(),
            head_admin_notes = $2
        WHERE listing_id = $3
        RETURNING *
      `;
      params = [adminId, notes || null, listingId];
      
      // Also update listings table status
      await db.query('UPDATE listings SET status = $1 WHERE id = $2', ['approved', listingId]);
    } else if (newStatus === 'rejected') {
      query = `
        UPDATE listing_approvals 
        SET listing_status = 'rejected', 
            rejected_at = NOW(),
            rejection_reason = $1
        WHERE listing_id = $2
        RETURNING *
      `;
      params = [notes || 'No reason provided', listingId];
      
      // Also update listings table status
      await db.query('UPDATE listings SET status = $1 WHERE id = $2', ['rejected', listingId]);
    }
    
    const { rows } = await db.query(query, params);
    
    if (rows.length > 0 && req) {
      await logAction(adminId, `Listing ${newStatus}`, 'listing_approvals', listingId, null, newStatus, req);
    }
    
    return rows[0];
  } catch (err) {
    console.error('Error updating listing status:', err);
    return null;
  }
};

/**
 * Get listing approval workflow
 */
const getListingApprovalWorkflow = async (listingId) => {
  try {
    const { rows } = await db.query(
      `SELECT la.*, l.title, l.owner_first_name, l.owner_last_name
       FROM listing_approvals la
       JOIN listings l ON la.listing_id = l.id
       WHERE la.listing_id = $1`,
      [listingId]
    );
    
    return rows[0] || null;
  } catch (err) {
    console.error('Error getting listing approval workflow:', err);
    return null;
  }
};

/**
 * Get listings pending admin approval
 */
const getListingsPendingAdminApproval = async (limit = 50) => {
  try {
    const { rows } = await db.query(
      `SELECT la.id, la.listing_id, l.id as id, l.title, l.owner_first_name, l.owner_last_name, 
              l.type, l.price, l.size_sqm as size, l.description, l.status,
              l.image_url, l.oct_tct_url, l.tax_declaration_url, l.doas_url, l.government_id_url,
              u.email as owner_email, u.username as owner_username, l.views, l.inquiries, l.created_at,
              la.listing_status, la.submitted_at, admin.username as submitted_by_username
       FROM listing_approvals la
       JOIN listings l ON la.listing_id = l.id
       JOIN users u ON l.owner_id = u.id
       LEFT JOIN users admin ON la.submitted_by = admin.id
       WHERE la.listing_status = 'submitted'
       ORDER BY la.submitted_at ASC
       LIMIT $1`,
      [limit]
    );
    
    return rows;
  } catch (err) {
    console.error('Error getting listings pending approval:', err);
    return [];
  }
};

/**
 * Get listings pending head admin approval
 */
const getListingsPendingHeadAdminApproval = async (limit = 50) => {
  try {
    console.log('[listingApproval] Querying for admin_approved listings...');
    const { rows } = await db.query(
      `SELECT la.id, la.listing_id, l.id as id, l.title, l.owner_first_name, l.owner_last_name, 
              l.type, l.price, l.size_sqm as size, l.description, l.status,
              l.image_url, l.oct_tct_url, l.tax_declaration_url, l.doas_url, l.government_id_url,
              u.email as owner_email, u.username as owner_username, l.views, l.inquiries, l.created_at,
              la.listing_status, la.admin_approved_at, admin.username as admin_approved_by_username
       FROM listing_approvals la
       JOIN listings l ON la.listing_id = l.id
       JOIN users u ON l.owner_id = u.id
       LEFT JOIN users admin ON la.admin_approved_by = admin.id
       WHERE la.listing_status = 'admin_approved'
       ORDER BY la.admin_approved_at ASC
       LIMIT $1`,
      [limit]
    );
    console.log(`[listingApproval] Found ${rows.length} admin_approved listings`);
    if (rows.length > 0) {
      console.log('[listingApproval] Sample listing:', rows[0]);
    }
    
    return rows;
  } catch (err) {
    console.error('Error getting listings pending head admin approval:', err);
    return [];
  }
};

/**
 * Get all listings in approval workflow
 */
const getAllListingApprovals = async (limit = 100) => {
  try {
    const { rows } = await db.query(
      `SELECT la.*, l.title, l.owner_first_name, l.owner_last_name,
              u1.username as submitted_by_username,
              u2.username as admin_approved_by_username,
              u3.username as head_admin_approved_by_username
       FROM listing_approvals la
       JOIN listings l ON la.listing_id = l.id
       LEFT JOIN users u1 ON la.submitted_by = u1.id
       LEFT JOIN users u2 ON la.admin_approved_by = u2.id
       LEFT JOIN users u3 ON la.head_admin_approved_by = u3.id
       ORDER BY la.created_at DESC
       LIMIT $1`,
      [limit]
    );
    
    return rows;
  } catch (err) {
    console.error('Error getting all listing approvals:', err);
    return [];
  }
};

module.exports = {
  createListingApprovalWorkflow,
  updateListingStatus,
  getListingApprovalWorkflow,
  getListingsPendingAdminApproval,
  getListingsPendingHeadAdminApproval,
  getAllListingApprovals
};
