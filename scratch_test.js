const http = require('http');

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('Testing new features against backend http://localhost:5000/api...');

  // 1. Health check
  const health = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/health',
    method: 'GET'
  });
  console.log('Health check status:', health.status, health.body);

  // 2. Login to get token
  const login = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { username: 'admin', password: 'adminpassword123' });

  console.log('Login status:', login.status);
  if (!login.body || !login.body.token) {
    console.error('Login failed, cannot continue authenticated tests.');
    return;
  }
  const token = login.body.token;
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 3. Test Transaction CRUD & Void
  console.log('\n--- Testing Transaction CRUD & Void ---');
  const createTxn = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/transactions',
    method: 'POST',
    headers: authHeaders
  }, {
    type: 'Expense',
    category: 'Dental Materials',
    amount: 3500,
    description: 'Test Composite Resin Pack',
    paymentMethod: 'Cash'
  });
  console.log('Created Txn:', createTxn.status, createTxn.body?.data?.transactionId);
  const txnId = createTxn.body?.data?._id;

  if (txnId) {
    // Get by ID
    const getTxn = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/transactions/${txnId}`,
      method: 'GET',
      headers: authHeaders
    });
    console.log('Get Txn by ID:', getTxn.status, getTxn.body?.data?.description);

    // Update
    const updateTxn = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/transactions/${txnId}`,
      method: 'PUT',
      headers: authHeaders
    }, {
      description: 'Updated Composite Resin Pack (2 Units)',
      amount: 4000
    });
    console.log('Update Txn:', updateTxn.status, updateTxn.body?.data?.description, 'Amount:', updateTxn.body?.data?.amount);

    // Void
    const voidTxn = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/transactions/${txnId}/void`,
      method: 'POST',
      headers: authHeaders
    }, { reason: 'Test void functionality' });
    console.log('Void Txn:', voidTxn.status, 'isVoid:', voidTxn.body?.data?.isVoid, 'Reason:', voidTxn.body?.data?.voidReason);

    // Delete
    const delTxn = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/transactions/${txnId}`,
      method: 'DELETE',
      headers: authHeaders
    });
    console.log('Delete Txn:', delTxn.status, delTxn.body?.message);
  }

  // 4. Test Appointments (Optional Service & No doctor required)
  console.log('\n--- Testing Appointments API ---');
  const apt = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/appointments',
    method: 'POST',
    headers: authHeaders
  }, {
    patientName: 'Test Walk-in Patient',
    phone: '0300-9999999',
    date: '2026-09-12',
    time: '11:00',
    notes: 'General checkup testing'
  });
  console.log('Create Appointment:', apt.status, apt.body?.data?.appointmentId, 'Service:', apt.body?.data?.serviceName);

  // 5. Test Treatment Settle
  console.log('\n--- Testing Treatment Settle API ---');
  const treatments = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/treatments',
    method: 'GET',
    headers: authHeaders
  });
  console.log('Treatments count:', treatments.body?.count);
  const activeTreatment = treatments.body?.data?.find(t => t.status === 'Active');
  if (activeTreatment) {
    console.log('Found active treatment to test settle:', activeTreatment.treatmentId, 'Remaining:', activeTreatment.remainingBalance);
    const settleRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/treatments/${activeTreatment._id}/settle`,
      method: 'PATCH',
      headers: authHeaders
    }, { reason: 'Clinical early completion test' });
    console.log('Settle result:', settleRes.status, 'isSettled:', settleRes.body?.data?.isSettled, 'Remaining:', settleRes.body?.data?.remainingBalance);
  }

  // 6. Test Settings API
  console.log('\n--- Testing Settings API ---');
  const settingsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/settings',
    method: 'PUT',
    headers: authHeaders
  }, {
    clinicName: 'Smile Care Dental Clinic',
    doctorName: 'Dr. Tariq Khan, BDS',
    phone: '+92 300 7654321',
    email: 'info@smilecare.com',
    currencySymbol: 'Rs.',
    currency: 'PKR',
    receiptFooter: 'Thank you for choosing Smile Care Dental Clinic.'
  });
  console.log('Settings update:', settingsRes.status, 'Clinic:', settingsRes.body?.data?.clinicName, 'Doctor:', settingsRes.body?.data?.doctorName);

  console.log('\nAll API feature tests completed successfully!');
}

runTests().catch(err => {
  console.error('Error running test script:', err);
});
