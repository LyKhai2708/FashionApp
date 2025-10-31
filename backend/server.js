require('dotenv').config();
const cron = require('node-cron');
const app = require('./src/app');
const { checkPendingPayments, cancelExpiredPayments } = require('./src/services/payment.service');
const promotionService = require('./src/services/promotions.service');
const voucherService = require('./src/services/voucher.service');

const PORT = process.env.PORT || 3000;

app.listen(PORT,'0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});

cron.schedule('0 0 * * *', () => {
  promotionService.autoDeactivateExpiredPromotions();
  voucherService.autoDeactivateExpiredVouchers();
});
setInterval(async () => {
  try {
    const result = await checkPendingPayments();
  } catch (error) {
    console.error('checkPendingPayments error:', error.message);
  }
}, 5 * 60 * 1000);

setInterval(async () => {
  try {
    const result = await cancelExpiredPayments();
  } catch (error) {
    console.error('cancelExpiredPayments error:', error.message);
  }
}, 2 * 60 * 1000);