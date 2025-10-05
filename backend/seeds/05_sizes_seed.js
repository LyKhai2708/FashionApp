const { faker } = require('@faker-js/faker');

/**
 * Tạo kích cỡ cho sản phẩm thời trang
 */
function createSizes() {
  const fashionSizes = [
    // Quần áo
    { name: 'XS' },
    { name: 'S' },
    { name: 'M' },
    { name: 'L' },
    { name: 'XL' },
    { name: 'XXL' },
    { name: 'XXXL' },
    
    // Giày dép (size Việt Nam)
    { name: '35' },
    { name: '36' },
    { name: '37' },
    { name: '38' },
    { name: '39' },
    { name: '40' },
    { name: '41' },
    { name: '42' },
    { name: '43' },
    { name: '44' },
    { name: '45' },
    
    // Phụ kiện
    { name: 'Free Size' },
    { name: 'Nhỏ' },
    { name: 'Vừa' },
    { name: 'Lớn' }
  ];

  return fashionSizes;
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  await knex('sizes').del();
  await knex('sizes').insert(createSizes());
};
