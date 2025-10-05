const { faker } = require('@faker-js/faker');

/**
 * Tạo màu sắc cho sản phẩm thời trang
 */
function createColors() {
  const fashionColors = [
    { name: 'Đen', hex_code: '#000000' },
    { name: 'Trắng', hex_code: '#FFFFFF' },
    { name: 'Xám', hex_code: '#808080' },
    { name: 'Xám đậm', hex_code: '#404040' },
    { name: 'Xám nhạt', hex_code: '#D3D3D3' },
    { name: 'Đỏ', hex_code: '#FF0000' },
    { name: 'Đỏ đậm', hex_code: '#8B0000' },
    { name: 'Hồng', hex_code: '#FFC0CB' },
    { name: 'Hồng đậm', hex_code: '#FF1493' },
    { name: 'Xanh navy', hex_code: '#000080' },
    { name: 'Xanh dương', hex_code: '#0000FF' },
    { name: 'Xanh nhạt', hex_code: '#87CEEB' },
    { name: 'Xanh lá', hex_code: '#008000' },
    { name: 'Xanh lá đậm', hex_code: '#006400' },
    { name: 'Vàng', hex_code: '#FFFF00' },
    { name: 'Vàng cam', hex_code: '#FFA500' },
    { name: 'Cam', hex_code: '#FF8C00' },
    { name: 'Nâu', hex_code: '#A52A2A' },
    { name: 'Nâu nhạt', hex_code: '#D2B48C' },
    { name: 'Tím', hex_code: '#800080' },
    { name: 'Tím nhạt', hex_code: '#DDA0DD' },
    { name: 'Be', hex_code: '#F5F5DC' },
    { name: 'Kem', hex_code: '#FFFDD0' },
    { name: 'Khaki', hex_code: '#F0E68C' },
    { name: 'Bạc', hex_code: '#C0C0C0' }
  ];

  return fashionColors;
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  await knex('colors').del();
  await knex('colors').insert(createColors());
};
