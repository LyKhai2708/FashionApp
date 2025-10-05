const { faker } = require('@faker-js/faker');

/**
 * Tạo khuyến mãi
 */
function createPromotions() {
  const promotions = [
    {
      name: 'Sale cuối năm',
      description: 'Giảm giá lên đến 50% cho tất cả sản phẩm',
      discount_percent: 50,
      start_date: '2024-12-01',
      end_date: '2024-12-31',
      active: true
    },
    {
      name: 'Black Friday',
      description: 'Khuyến mãi Black Friday - Giảm 30%',
      discount_percent: 30,
      start_date: '2024-11-29',
      end_date: '2024-11-30',
      active: true
    },
    {
      name: 'Tết Nguyên Đán',
      description: 'Chào xuân mới - Giảm 25%',
      discount_percent: 25,
      start_date: '2025-01-20',
      end_date: '2025-02-10',
      active: true
    },
    {
      name: 'Sinh nhật thương hiệu',
      description: 'Kỷ niệm 5 năm thành lập - Giảm 40%',
      discount_percent: 40,
      start_date: '2024-10-01',
      end_date: '2024-10-31',
      active: false
    },
    {
      name: 'Mùa hè sôi động',
      description: 'Khuyến mãi mùa hè - Giảm 20%',
      discount_percent: 20,
      start_date: '2024-06-01',
      end_date: '2024-08-31',
      active: false
    }
  ];

  return promotions.map(promo => ({
    ...promo,
    created_at: faker.date.past()
  }));
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  await knex('promotions').del();
  await knex('promotions').insert(createPromotions());
};
