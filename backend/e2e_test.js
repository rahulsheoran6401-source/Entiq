const axios = require('axios');
const imaps = require('imap-simple');
const simpleParser = require('mailparser').simpleParser;
const crypto = require('crypto');

const email = 'rahulsheoran6401@gmail.com';
const password = 'tywa wuwm gaep lltp';
const apiUrl = 'http://localhost:5000/api/v1/auth';
const newPassword = `TestPass${crypto.randomBytes(4).toString('hex')}!`;

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getLatestOTP() {
  console.log('Connecting to IMAP...');
  const config = {
    imap: {
      user: email,
      password: password,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      authTimeout: 10000,
      tlsOptions: { rejectUnauthorized: false }
    }
  };

  const connection = await imaps.connect(config);
  await connection.openBox('INBOX');

  // Search for unread emails from the last hour with specific subject
  const delayDate = new Date(Date.now() - 1000 * 60 * 60);
  const searchCriteria = [
    'UNSEEN',
    ['SINCE', delayDate],
    ['SUBJECT', 'Your Password Reset OTP']
  ];
  const fetchOptions = {
    bodies: [''],
    markSeen: true
  };

  console.log('Searching for OTP email...');
  const results = await connection.search(searchCriteria, fetchOptions);
  
  if (!results || results.length === 0) {
    connection.end();
    throw new Error('No OTP email found');
  }

  // Get the most recent one
  const latestEmail = results[results.length - 1];
  const all = latestEmail.parts.find(part => part.which === '');
  const id = latestEmail.attributes.uid;
  const idHeader = 'Imap-Id: '+id+'\r\n';
  
  const parsed = await simpleParser(idHeader+all.body);
  connection.end();

  // Extract 6-digit OTP from text
  const match = parsed.text.match(/(\d{6})/);
  if (match) {
    return match[1];
  } else {
    throw new Error('Could not find 6-digit OTP in email content: ' + parsed.text);
  }
}

async function runTest() {
  try {
    console.log('1. Registering user (if not exists)...');
    try {
      await axios.post(`${apiUrl}/signup`, { email, password: 'OldPassword123!', name: 'Test User' });
      console.log('User registered.');
    } catch (e) {
      if (e.response && e.response.status === 409) {
        console.log('User already exists, continuing...');
      } else {
        throw e;
      }
    }

    console.log('\n2. Requesting Forgot Password...');
    const forgotRes = await axios.post(`${apiUrl}/forgot-password`, { email });
    console.log('Forgot Password response:', forgotRes.data.message);

    console.log('\nWaiting 10 seconds for email delivery...');
    await delay(10000);

    console.log('\n3. Fetching OTP via IMAP...');
    let otp = null;
    for (let i=0; i<3; i++) {
      try {
        otp = await getLatestOTP();
        console.log('Successfully retrieved OTP:', otp);
        break;
      } catch (err) {
        console.log('Attempt', i+1, 'failed to get OTP:', err.message);
        if (i < 2) {
          console.log('Waiting 5 more seconds...');
          await delay(5000);
        }
      }
    }

    if (!otp) throw new Error('Failed to retrieve OTP after multiple attempts.');

    console.log('\n4. Verifying OTP...');
    const verifyRes = await axios.post(`${apiUrl}/verify-otp`, { email, otp });
    console.log('Verify OTP response:', verifyRes.data.message);

    console.log('\n5. Resetting Password...');
    const resetRes = await axios.post(`${apiUrl}/reset-password`, { email, otp, newPassword });
    console.log('Reset Password response:', resetRes.data.message);

    console.log('\n6. Logging in with new password...');
    const loginRes = await axios.post(`${apiUrl}/login`, { email, password: newPassword });
    console.log('Login successful! Token:', loginRes.data.token.substring(0, 20) + '...');
    
    console.log('\n✅ END-TO-END OTP VERIFICATION COMPLETE AND SUCCESSFUL');
    
  } catch (error) {
    console.error('\n❌ E2E TEST FAILED:', error.response?.data?.error || error.message);
  }
}

runTest();
