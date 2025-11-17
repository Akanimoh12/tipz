// X OAuth Configuration Diagnostic Tool
// Run this in browser console to check your setup

console.log('=== X OAuth Configuration Check ===\n');

// Check environment variables
const clientId = import.meta.env.VITE_X_API_CLIENT_ID;
const appUrl = import.meta.env.VITE_APP_URL;

console.log('1. Environment Variables:');
console.log('   Client ID:', clientId ? '✅ Set' : '❌ Missing');
console.log('   Value:', clientId);
console.log('   App URL:', appUrl ? '✅ Set' : '❌ Missing');
console.log('   Value:', appUrl);
console.log('   Redirect URI:', `${appUrl || 'http://localhost:5173'}/register`);

// Check if running on correct port
console.log('\n2. Server Check:');
const currentUrl = window.location.origin;
console.log('   Current URL:', currentUrl);
if (currentUrl === 'http://localhost:5173') {
  console.log('   Status: ✅ Correct port');
} else {
  console.log('   Status: ⚠️ Not on port 5173');
  console.log('   Expected: http://localhost:5173');
}

// Generate OAuth URL for inspection
console.log('\n3. OAuth URL Components:');
const redirectUri = `${appUrl || 'http://localhost:5173'}/register`;
console.log('   Redirect URI:', redirectUri);
console.log('   Encoded:', encodeURIComponent(redirectUri));

// Check session storage
console.log('\n4. Session Storage:');
const oauthState = sessionStorage.getItem('tipz_x_oauth_state');
if (oauthState) {
  console.log('   OAuth State: ✅ Found');
  try {
    const parsed = JSON.parse(oauthState);
    console.log('   State:', parsed.state);
    console.log('   Redirect:', parsed.redirectUri);
  } catch (e) {
    console.log('   ⚠️ Error parsing state');
  }
} else {
  console.log('   OAuth State: ℹ️ None (normal before OAuth)');
}

// Check local storage
console.log('\n5. Local Storage:');
const userData = localStorage.getItem('tipz_x_user_data');
if (userData) {
  console.log('   User Data: ✅ Found (previously connected)');
  try {
    const parsed = JSON.parse(userData);
    console.log('   Username:', parsed.username);
  } catch (e) {
    console.log('   ⚠️ Error parsing user data');
  }
} else {
  console.log('   User Data: ℹ️ None (not connected yet)');
}

console.log('\n=== Configuration Summary ===');
console.log('\nFor X Developer Portal, ensure:');
console.log('1. OAuth 2.0 is ENABLED (toggle ON)');
console.log('2. App Type: "Web App, Automated App or Bot"');
console.log('3. Permissions: "Read"');
console.log('4. Callback URL: http://localhost:5173/register');
console.log('5. Website URL: http://localhost:5173');
console.log('\n📋 Copy these exact values to X Developer Portal:');
console.log('   Callback URL: http://localhost:5173/register');
console.log('   Website URL: http://localhost:5173');
console.log('   Client ID:', clientId);

console.log('\n=== Testing Instructions ===');
console.log('1. Verify all settings in X Developer Portal');
console.log('2. Save changes and wait 2-5 minutes');
console.log('3. Clear browser cache or use incognito');
console.log('4. Try connecting X account again');

export {};
