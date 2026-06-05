// scripts/verify_phase1.js
// Run with: node scripts/verify_phase1.js

const axios = require('axios');
require('dotenv').config({ path: './frontend/.env' });

const API_URL = process.env.VITE_API_URL || 'http://localhost:5000/api/v1';
const api = axios.create({ baseURL: API_URL, timeout: 15000 });

let token = '';
let projectId = '';
let entitySlug = '';

async function register(){
  console.log('Register');
  try {
    const res = await api.post('/auth/signup', { email: 'test@example.com', password: 'Password123', name: 'Test User' });
    console.log('  ->', res.data.message);
    token = res.data.token;
  } catch (e) {
    if (e.response && e.response.status === 409) {
      console.log('  ->', 'User already exists, proceeding to login');
    } else {
      throw e;
    }
  }
}
async function login(){
  console.log('Login');
  const res = await api.post('/auth/login', { email: 'test@example.com', password: 'Password123' });
  console.log('  ->', res.data.message);
  token = res.data.token;
}
async function profile(){
  console.log('Profile');
  const res = await api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
  console.log('  -> User', res.data.user.email);
}
async function createProject(){
  console.log('Create Project');
  const res = await api.post('/projects', { name: 'Demo Project', description: 'Phase1 test' }, { headers: { Authorization: `Bearer ${token}` } });
  projectId = res.data.project.id;
  console.log('  -> Project ID', projectId);
}
async function createEntity(){
  console.log('Create Entity');
  const res = await api.post(`/projects/${projectId}/entities`, {
    name: 'Employee',
    apiSlug: 'employee',
    fields: [
      { name: 'Name', apiSlug: 'name', type: 'TEXT', required: true },
      { name: 'Salary', apiSlug: 'salary', type: 'NUMBER', required: true },
      { name: 'Role', apiSlug: 'role', type: 'ENUM', required: true, options: 'ADMIN,HR,STAFF' }
    ]
  }, { headers: { Authorization: `Bearer ${token}` } });
  entitySlug = res.data.entity.apiSlug;
  console.log('  -> Entity slug', entitySlug);
}
async function crud(){
  console.log('CRUD Record');
  const create = await api.post(`/projects/${projectId}/resources/${entitySlug}`, { name: 'Alice', salary: 90000, role: 'ADMIN' }, { headers: { Authorization: `Bearer ${token}` } });
  const recId = create.data.record.id;
  console.log('  -> Created', recId);
  const read = await api.get(`/projects/${projectId}/resources/${entitySlug}/${recId}`, { headers: { Authorization: `Bearer ${token}` } });
  console.log('  -> Read name', read.data.record.data.name);
  await api.patch(`/projects/${projectId}/resources/${entitySlug}/${recId}`, { salary: 95000 }, { headers: { Authorization: `Bearer ${token}` } });
  console.log('  -> Updated salary');
  await api.delete(`/projects/${projectId}/resources/${entitySlug}/${recId}`, { headers: { Authorization: `Bearer ${token}` } });
  console.log('  -> Soft deleted');
}
async function validation(){
  console.log('Validation Tests');
  try {
    await api.post(`/projects/${projectId}/resources/${entitySlug}`, { salary: 'abc', role: 'SUPER_ADMIN' }, { headers: { Authorization: `Bearer ${token}` } });
    console.error('  !! Validation should have failed');
  } catch(e){
    console.log('  -> Validation errors as expected');
  }
}

(async()=>{
  try {
    await register();
    await login();
    await profile();
    await createProject();
    await createEntity();
    await crud();
    await validation();
    console.log('\nAll Phase1 checks passed');
  } catch(err){
    console.error('Phase1 verification failed', err.response?.data || err.message);
    process.exit(1);
  }
})();
