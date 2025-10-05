const { faker } = require('@faker-js/faker');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  await knex('orderdetails').del();

  // Lấy danh sách orders và product_variants
  const orders = await knex('orders').select('order_id');
  const productVariants = await knex('product_variants').select('product_variants_id');
  const products = await knex('products').select('product_id', 'base_price');

  const orderDetails = [];

  // Mỗi đơn hàng có 1-5 sản phẩm
  for (const order of orders) {
    const numItems = faker.number.int({ min: 1, max: 5 });
    const selectedVariants = faker.helpers.arrayElements(productVariants, numItems);
    
    for (const variant of selectedVariants) {
      const quantity = faker.number.int({ min: 1, max: 3 });
      
      
      const product = faker.helpers.arrayElement(products);
      const price = product.base_price;
      const discountAmount = faker.datatype.boolean() ? faker.number.int({ min: 0, max: price * 0.2 }) : 0;
      const subTotal = (price - discountAmount) * quantity;
      
      orderDetails.push({
        order_id: order.order_id,
        product_variant_id: variant.product_variants_id,
        quantity: quantity,
        price: price,
        discount_amount: discountAmount,
        sub_total: subTotal
      });
    }
  }

  await knex('orderdetails').insert(orderDetails);
};
