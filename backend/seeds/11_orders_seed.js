const { faker } = require('@faker-js/faker');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  await knex('orders').del();

  // Lấy danh sách users
  const users = await knex('users').select('user_id');

  const orders = [];
  const orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  const paymentMethods = ['cash_on_delivery', 'bank_transfer'];
  const paymentStatuses = ['unpaid', 'paid', 'refund'];

  // Tạo 50-100 đơn hàng
  const numOrders = faker.number.int({ min: 50, max: 100 });

  for (let i = 0; i < numOrders; i++) {
    const user = faker.helpers.arrayElement(users);
    const subTotal = faker.number.int({ min: 200000, max: 2000000 });
    const shippingFee = faker.number.int({ min: 20000, max: 50000 });
    const totalAmount = subTotal + shippingFee;
    
    orders.push({
      user_id: user.user_id,
      order_date: faker.date.past(),
      order_status: faker.helpers.arrayElement(orderStatuses),
      sub_total: subTotal,
      shipping_fee: shippingFee,
      total_amount: totalAmount,
      payment_method: faker.helpers.arrayElement(paymentMethods),
      payment_status: faker.helpers.arrayElement(paymentStatuses),
      notes: faker.datatype.boolean() ? faker.lorem.sentence() : null,
      shipping_address: `${faker.location.streetAddress()}, ${faker.location.city()}, ${faker.location.state()}`
    });
  }

  await knex('orders').insert(orders);
};
