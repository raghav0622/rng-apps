const RESET_URL = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/reset-app`
  : 'http://localhost:3000/api/reset-app';

const SECRET = process.env.APP_RESET_SECRET || '';

async function resetApp() {
  console.log(`🚀 Triggering App Reset at: ${RESET_URL}...`);

  try {
    const response = await fetch(RESET_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-reset-secret': SECRET,
      },
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Success:', result.message);
    } else {
      console.error('❌ Error:', result.error);
      if (result.details) console.error('Details:', result.details);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Failed to connect to the server. Is the app running?');
    console.error('Error:', error.message);
    process.exit(1);
  }
}

resetApp();
