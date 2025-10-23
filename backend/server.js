require('dotenv').config();
const app = require('./src/app');
const { checkPendingPayments, cancelExpiredPayments } = require('./src/services/payment.service');

const PORT = process.env.PORT || 3000;

app.listen(PORT,'0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});


setInterval(async () => {
  console.log(' checkPendingPayments...');
  try {
    const result = await checkPendingPayments();
    console.log(`Checked ${result.checked} pending payments`);
  } catch (error) {
    console.error('checkPendingPayments error:', error.message);
  }
}, 5 * 60 * 1000);

setInterval(async () => {
  console.log('Running cancelExpiredPayments...');
  try {
    const result = await cancelExpiredPayments();
    console.log(`Cancelled ${result.cancelled} expired payments`);
  } catch (error) {
    console.error('cancelExpiredPayments error:', error.message);
  }
}, 2 * 60 * 1000);

console.log('Payment cronjobs started (running every 5 minutes)');