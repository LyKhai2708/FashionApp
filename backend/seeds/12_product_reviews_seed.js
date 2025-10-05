const { faker } = require('@faker-js/faker');

/**
 * Tạo review comments thực tế
 */
function getReviewComments() {
  const positiveComments = [
    'Sản phẩm rất đẹp, chất lượng tốt, đúng như mô tả',
    'Giao hàng nhanh, đóng gói cẩn thận, sản phẩm ưng ý',
    'Chất liệu mềm mại, form dáng đẹp, rất hài lòng',
    'Giá cả hợp lý, chất lượng tốt, sẽ mua lại',
    'Shop phục vụ tận tình, sản phẩm đúng size, đẹp như hình',
    'Màu sắc đẹp, không phai, chất lượng vượt mong đợi',
    'Thiết kế hiện đại, trendy, phù hợp với nhiều lứa tuổi'
  ];

  const neutralComments = [
    'Sản phẩm ổn, giá cả hợp lý, giao hàng đúng hẹn',
    'Chất lượng tạm được, phù hợp với giá tiền',
    'Sản phẩm như mô tả, không có gì đặc biệt',
    'Giao hàng hơi chậm nhưng sản phẩm ok',
    'Size hơi nhỏ so với bảng size, nhưng chất lượng ổn'
  ];

  const negativeComments = [
    'Chất lượng không như mong đợi, hơi thất vọng',
    'Màu sắc khác với hình, size không đúng',
    'Giao hàng chậm, sản phẩm có một số khuyết điểm nhỏ',
    'Giá hơi cao so với chất lượng thực tế',
    'Chất liệu không như mô tả, hơi cứng'
  ];

  return { positiveComments, neutralComments, negativeComments };
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  await knex('product_reviews').del();

  // Lấy danh sách users và products
  const users = await knex('users').select('user_id');
  const products = await knex('products').select('product_id');

  const { positiveComments, neutralComments, negativeComments } = getReviewComments();
  const reviews = [];

  // Tạo 100-200 reviews
  const numReviews = faker.number.int({ min: 100, max: 200 });

  for (let i = 0; i < numReviews; i++) {
    const user = faker.helpers.arrayElement(users);
    const product = faker.helpers.arrayElement(products);
    const rating = faker.number.int({ min: 1, max: 5 });
    
    let comment, title;
    
    // Chọn comment theo rating
    if (rating >= 4) {
      comment = faker.helpers.arrayElement(positiveComments);
      title = 'Sản phẩm tốt';
    } else if (rating === 3) {
      comment = faker.helpers.arrayElement(neutralComments);
      title = 'Sản phẩm tạm ổn';
    } else {
      comment = faker.helpers.arrayElement(negativeComments);
      title = 'Cần cải thiện';
    }
    
    reviews.push({
      user_id: user.user_id,
      product_id: product.product_id,
      is_verified_purchase: faker.datatype.boolean() ? 1 : 0,
      title: title,
      comment: comment,
      rating: rating,
      created_at: faker.date.past(),
      updated_at: faker.date.past()
    });
  }

  await knex('product_reviews').insert(reviews);
};
