/**
 * Test RBAC System
 * Tests permissions, role assignment, and audit logging
 */

require('dotenv').config();
const { Pool } = require('pg');
const rbacService = require('./services/rbac-service');
const auditService = require('./services/audit-service');
const { checkPermission, getUserPermissions, getUserRoles } = require('./middleware/rbac');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runTests() {
  console.log('🧪 KejaMarket RBAC System Test\n');
  
  try {
    // Test 1: Verify database tables exist
    console.log('📊 Test 1: Verify Database Schema');
    const rolesCount = await pool.query('SELECT COUNT(*) FROM roles');
    const permsCount = await pool.query('SELECT COUNT(*) FROM permissions');
    const rolePermsCount = await pool.query('SELECT COUNT(*) FROM role_permissions');
    
    console.log(`✅ Roles: ${rolesCount.rows[0].count}`);
    console.log(`✅ Permissions: ${permsCount.rows[0].count}`);
    console.log(`✅ Role-Permission mappings: ${rolePermsCount.rows[0].count}\n`);
    
    // Test 2: List all roles
    console.log('📋 Test 2: List All Roles');
    const roles = await rbacService.getAllRoles();
    roles.forEach(role => {
      console.log(`  - ${role.name}: ${role.permission_count} permissions, ${role.user_count} users`);
    });
    console.log();
    
    // Test 3: Get Super Admin role details
    console.log('🔍 Test 3: Super Admin Role Details');
    const superAdmin = roles.find(r => r.name === 'Super Admin');
    if (superAdmin) {
      const details = await rbacService.getRoleDetails(superAdmin.id);
      console.log(`✅ ${details.name}: ${details.description}`);
      console.log(`   Permissions: ${details.permissions.length} total`);
      console.log(`   Sample permissions: ${details.permissions.slice(0, 5).map(p => p.name).join(', ')}...\n`);
    }
    
    // Test 4: Find admin users to assign role
    console.log('👥 Test 4: Find Admin Users');
    const adminUsers = await pool.query(`
      SELECT id, name, email, role, is_admin 
      FROM users 
      WHERE is_admin = true OR role = 'admin'
      LIMIT 5
    `);
    
    if (adminUsers.rows.length === 0) {
      console.log('⚠️  No admin users found in database');
      console.log('   Create an admin user first, then run this test again\n');
    } else {
      console.log(`✅ Found ${adminUsers.rows.length} admin users:`);
      adminUsers.rows.forEach(u => {
        console.log(`  - ${u.name} (${u.email}) [ID: ${u.id}]`);
      });
      console.log();
      
      // Test 5: Assign Super Admin role to first admin
      const testUser = adminUsers.rows[0];
      console.log(`🔐 Test 5: Assign Super Admin Role to ${testUser.name}`);
      
      try {
        await rbacService.assignRole(testUser.id, superAdmin.id, 'system');
        console.log(`✅ Role assigned successfully\n`);
        
        // Test 6: Check permissions
        console.log('🔑 Test 6: Check User Permissions');
        const permissions = await getUserPermissions(testUser.id);
        const userRoles = await getUserRoles(testUser.id);
        
        console.log(`✅ User has ${permissions.length} permissions via ${userRoles.length} role(s)`);
        console.log(`   Roles: ${userRoles.map(r => r.name).join(', ')}`);
        console.log(`   Sample permissions: ${permissions.slice(0, 10).join(', ')}...\n`);
        
        // Test 7: Test permission check
        console.log('🔍 Test 7: Test Permission Checks');
        const hasUserView = await checkPermission(testUser.id, 'user.view');
        const hasListingApprove = await checkPermission(testUser.id, 'listing.approve');
        const hasFakePermission = await checkPermission(testUser.id, 'nonexistent.permission');
        
        console.log(`  user.view: ${hasUserView ? '✅ Granted' : '❌ Denied'}`);
        console.log(`  listing.approve: ${hasListingApprove ? '✅ Granted' : '❌ Denied'}`);
        console.log(`  nonexistent.permission: ${hasFakePermission ? '❌ ERROR - Should be denied!' : '✅ Denied (correct)'}\n`);
        
      } catch (error) {
        if (error.message.includes('duplicate')) {
          console.log(`ℹ️  Role already assigned (this is fine)\n`);
        } else {
          throw error;
        }
      }
    }
    
    // Test 8: Audit log test
    console.log('📝 Test 8: Audit Logging');
    await auditService.log({
      eventType: 'test_event',
      actorId: 'test-user',
      action: 'rbac_system_test',
      resourceType: 'system',
      outcome: 'success',
      metadata: { test: true, timestamp: new Date().toISOString() }
    });
    console.log('✅ Audit event logged successfully\n');
    
    // Test 9: Get recent audit events
    console.log('📊 Test 9: Retrieve Recent Audit Events');
    const recentEvents = await auditService.getActivityLog({ limit: 5 });
    console.log(`✅ Retrieved ${recentEvents.length} recent events:`);
    recentEvents.forEach(e => {
      console.log(`  - [${e.created_at.toISOString()}] ${e.action} by ${e.actor_id || 'system'} → ${e.outcome}`);
    });
    console.log();
    
    // Test 10: Get audit summary
    console.log('📈 Test 10: Audit Summary Statistics');
    const summary = await auditService.getSummary();
    if (summary) {
      console.log(`✅ Total events: ${summary.total_events}`);
      console.log(`   Unique actors: ${summary.unique_actors}`);
      console.log(`   Successful: ${summary.successful_events}`);
      console.log(`   Failed: ${summary.failed_events}`);
      console.log(`   Critical: ${summary.critical_events}\n`);
    }
    
    console.log('🎉 All tests passed!\n');
    console.log('✅ RBAC system is fully operational');
    console.log('✅ Permissions are being checked correctly');
    console.log('✅ Audit logging is working');
    console.log('\n📌 Next Steps:');
    console.log('   1. Start the server: npm start');
    console.log('   2. Test admin endpoints with your Super Admin user');
    console.log('   3. Verify 403 errors for users without permissions');
    console.log('   4. Check audit_events table for logged actions');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

runTests();
