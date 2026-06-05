const axios = require('axios');
const API = 'http://localhost:5000/api/v1';

const loginData = {
  email: 'ashritasrmofficial@gmail.com',
  password: '123456'
};

async function runAudit() {
  let token = '';
  let projectId = '';
  let membersEntityId = '';
  let paymentsEntityId = '';
  let memberId = '';

  const api = axios.create({ baseURL: API, validateStatus: () => true });

  try {
    console.log('--- STARTING CODEFORGE E2E AUDIT ---');
    
    // 1. Signup / Login
    console.log('\n[1] Registering / Logging in...');
    let res = await api.post('/auth/signup', { ...loginData, name: 'Audit User' });
    if (res.status === 409) {
      res = await api.post('/auth/login', loginData);
    }
    
    if (res.status !== 200 && res.status !== 201) throw new Error('Login failed: ' + JSON.stringify(res.data));
    token = res.data.token;
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log('✅ Login successful');

    // 2. Create Project
    console.log('\n[2] Creating Gym Management System...');
    res = await api.post('/projects', { name: 'Gym Management System', description: 'Audit Project' });
    if (res.status !== 201) throw new Error('Project creation failed: ' + JSON.stringify(res.data));
    projectId = res.data.project.id;
    console.log(`✅ Project created: ${projectId}`);

    // 3. Create Entities & Fields
    console.log('\n[3] Creating Members Entity...');
    res = await api.post(`/projects/${projectId}/entities`, {
      name: 'Members',
      fields: [
        { name: 'Name', type: 'TEXT', required: true },
        { name: 'Phone', type: 'TEXT' },
        { name: 'Age', type: 'NUMBER' },
        { name: 'Plan', type: 'ENUM', options: ['Silver', 'Gold', 'Platinum'] },
        { name: 'Active', type: 'BOOLEAN', defaultValue: true }
      ]
    });
    if (res.status !== 201) throw new Error('Members entity failed: ' + JSON.stringify(res.data));
    membersEntityId = res.data.entity.id;
    console.log('✅ Members entity created');

    console.log('\n[4] Creating Payments Entity...');
    res = await api.post(`/projects/${projectId}/entities`, {
      name: 'Payments',
      fields: [
        { name: 'Member Name', type: 'TEXT', required: true },
        { name: 'Amount', type: 'NUMBER', required: true },
        { name: 'Date', type: 'DATE' },
        { name: 'Status', type: 'ENUM', options: ['Paid', 'Pending'] }
      ]
    });
    if (res.status !== 201) throw new Error('Payments entity failed: ' + JSON.stringify(res.data));
    paymentsEntityId = res.data.entity.id;
    console.log('✅ Payments entity created');

    // 4. Add Records
    console.log('\n[5] Adding Records to Members...');
    res = await api.post(`/projects/${projectId}/resources/members`, {
      name: 'John Doe',
      phone: '555-0100',
      age: 28,
      plan: 'Gold',
      active: true
    });
    if (res.status !== 201) throw new Error('Failed to add record: ' + JSON.stringify(res.data));
    memberId = res.data.record.id;
    
    await api.post(`/projects/${projectId}/resources/members`, {
      name: 'Jane Smith', age: 35, plan: 'Platinum', active: false
    });
    console.log('✅ Multiple valid records added');

    // 5. Verify Records (Fetch)
    console.log('\n[6] Fetching Records...');
    res = await api.get(`/projects/${projectId}/resources/members`);
    if (res.status !== 200 || !res.data.records || res.data.records.length !== 2) {
      throw new Error('Fetching records failed: ' + JSON.stringify(res.data));
    }
    console.log('✅ Records fetched correctly');

    // 6. Test Edit Record
    console.log('\n[7] Editing Record...');
    res = await api.put(`/projects/${projectId}/resources/members/${memberId}`, {
      plan: 'Platinum'
    });
    if (res.status !== 200 || res.data.record.plan !== 'Platinum') {
      throw new Error('Edit record failed: ' + JSON.stringify(res.data));
    }
    console.log('✅ Edit record successful');

    // 8. Test Validation Failures
    console.log('\n[8] Testing Validation Failures...');
    // Missing required field (Name is required in Members)
    res = await api.post(`/projects/${projectId}/resources/members`, {
      age: 30
    });
    if (res.status !== 400) throw new Error('Validation failed to catch missing required field. ' + res.status);
    
    // Invalid Type (Age = string)
    res = await api.post(`/projects/${projectId}/resources/members`, {
      name: 'Test', age: 'thirty'
    });
    if (res.status !== 400) throw new Error('Validation failed to catch invalid type. ' + res.status);
    
    // Invalid Enum
    res = await api.post(`/projects/${projectId}/resources/members`, {
      name: 'Test', plan: 'Bronze'
    });
    if (res.status !== 400) throw new Error('Validation failed to catch invalid ENUM. ' + res.status);
    console.log('✅ Validation rules are properly enforced');

    // 9. Test Filtering
    console.log('\n[9] Testing Filtering...');
    res = await api.get(`/projects/${projectId}/resources/members?plan=Platinum`);
    if (res.status !== 200 || res.data.records.length !== 2) {
      throw new Error('Filtering failed: ' + JSON.stringify(res.data));
    }
    console.log('✅ Filtering works');

    // 10. Test Pagination
    console.log('\n[10] Testing Pagination...');
    res = await api.get(`/projects/${projectId}/resources/members?limit=1&page=1`);
    if (res.status !== 200 || res.data.records.length !== 1 || res.data.pagination.total !== 2) {
      throw new Error('Pagination failed: ' + JSON.stringify(res.data));
    }
    console.log('✅ Pagination works');

    // 7. Test Delete Record
    console.log('\n[11] Deleting Record...');
    res = await api.delete(`/projects/${projectId}/resources/members/${memberId}`);
    if (res.status !== 200) throw new Error('Delete record failed: ' + JSON.stringify(res.data));
    
    res = await api.get(`/projects/${projectId}/resources/members`);
    if (res.data.records.length !== 1) throw new Error('Record was not actually deleted.');
    console.log('✅ Delete record successful');

    console.log('\n--- AUDIT COMPLETE: ALL BACKEND TESTS PASSED ---');
  } catch (err) {
    console.error('\n❌ AUDIT FAILED:', err.message);
    process.exit(1);
  }
}

runAudit();
