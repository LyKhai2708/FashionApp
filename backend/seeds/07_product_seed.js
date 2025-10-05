const { faker } = require('@faker-js/faker');

/**
 * Tạo sản phẩm thời trang
 */
function createFashionProducts(brands, categories) {
  const fashionProducts = [
    // Áo thun nam
    'Áo thun nam basic', 'Áo thun nam polo', 'Áo thun nam oversize', 'Áo thun nam slim fit',
    // Áo thun nữ  
    'Áo thun nữ crop top', 'Áo thun nữ basic', 'Áo thun nữ form rộng', 'Áo thun nữ tay dài',
    // Quần jean
    'Quần jean nam skinny', 'Quần jean nam regular', 'Quần jean nữ skinny', 'Quần jean nữ boyfriend',
    // Váy
    'Váy midi', 'Váy maxi', 'Váy ngắn', 'Váy xòe',
    // Áo khoác
    'Áo khoác bomber', 'Áo khoác denim', 'Áo blazer', 'Áo hoodie',
    // Giày
    'Giày sneaker', 'Giày cao gót', 'Giày oxford', 'Giày boot',
    // Phụ kiện
    'Túi xách tay', 'Túi đeo chéo', 'Ví da', 'Thắt lưng da'
  ];

  return fashionProducts.map(productName => {
    const brand = faker.helpers.arrayElement(brands);
    const category = faker.helpers.arrayElement(categories);
    const basePrice = faker.number.int({ min: 100000, max: 2000000 });
    
    return {
      name: productName,
      description: faker.commerce.productDescription() + ` ${productName} chất lượng cao, thiết kế hiện đại, phù hợp cho nhiều dịp khác nhau.`,
      brand_id: brand ? brand.id : null,
      category_id: category ? category.category_id : null,
      base_price: basePrice,
      thumbnail: `/images/products/${faker.helpers.slugify(productName)}.jpg`,
      sold: faker.number.int({ min: 0, max: 500 }),
      slug: faker.helpers.slugify(productName) + '-' + faker.string.alphanumeric(6),
      del_flag: 0,
      created_at: faker.date.past()
    };
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  await knex('products').del();

  // Lấy danh sách brand_id và category_id
  const brands = await knex('brand').select('id');
  const categories = await knex('categories').select('category_id');

  const products = createFashionProducts(brands, categories);
  await knex('products').insert(products);
};