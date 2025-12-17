const db = require('./db');

async function addSystemAdminRole() {
  try {
    const result = await db.query(
      `INSERT INTO admin_roles (id, role_name, display_name, description) 
       VALUES (5, 'system_admin', 'System Admin', 'Manages website content and customization')
       ON CONFLICT DO NOTHING`
    );
    console.log('System Admin role added successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error adding system admin role:', err.message);
    process.exit(1);
  }
}

addSystemAdminRole();
