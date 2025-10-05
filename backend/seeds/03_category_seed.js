const { faker } = require('@faker-js/faker');

/**
 * Tạo danh mục thời trang
 */
function createFashionCategories() {
  const fashionCategories = [
    // Danh mục cha
    { category_name: 'Nam', slug: 'nam', parent_id: null},
    { category_name: 'Nữ', slug: 'nu', parent_id: null},
    { category_name: 'Trẻ em', slug: 'tre-em', parent_id: null},
    { category_name: 'Phụ kiện', slug: 'phu-kien', parent_id: null},
    { category_name: 'Giày dép', slug: 'giay-dep', parent_id: null}
  ];

  return fashionCategories.map(cat => ({
    ...cat,
    active: 1
  }));
}

function createSubCategories(parentCategories) {
  const subCategories = [
    // Nam
    { category_name: 'Áo thun nam', slug: 'ao-thun-nam', parent_name: 'Nam' },
    { category_name: 'Áo sơ mi nam', slug: 'ao-so-mi-nam', parent_name: 'Nam' },
    { category_name: 'Quần jean nam', slug: 'quan-jean-nam', parent_name: 'Nam' },
    { category_name: 'Quần kaki nam', slug: 'quan-kaki-nam', parent_name: 'Nam' },
    { category_name: 'Áo khoác nam', slug: 'ao-khoac-nam', parent_name: 'Nam' },
    
    // Nữ
    { category_name: 'Áo thun nữ', slug: 'ao-thun-nu', parent_name: 'Nữ' },
    { category_name: 'Áo sơ mi nữ', slug: 'ao-so-mi-nu', parent_name: 'Nữ' },
    { category_name: 'Váy', slug: 'vay', parent_name: 'Nữ' },
    { category_name: 'Quần jean nữ', slug: 'quan-jean-nu', parent_name: 'Nữ' },
    { category_name: 'Áo khoác nữ', slug: 'ao-khoac-nu', parent_name: 'Nữ' },
    
    // Trẻ em
    { category_name: 'Áo thun trẻ em', slug: 'ao-thun-tre-em', parent_name: 'Trẻ em' },
    { category_name: 'Quần áo bé trai', slug: 'quan-ao-be-trai', parent_name: 'Trẻ em' },
    { category_name: 'Quần áo bé gái', slug: 'quan-ao-be-gai', parent_name: 'Trẻ em' },
    
    // Phụ kiện
    { category_name: 'Túi xách', slug: 'tui-xach', parent_name: 'Phụ kiện' },
    { category_name: 'Ví', slug: 'vi', parent_name: 'Phụ kiện' },
    { category_name: 'Thắt lưng', slug: 'that-lung', parent_name: 'Phụ kiện' },
    { category_name: 'Mũ nón', slug: 'mu-non', parent_name: 'Phụ kiện' },
    
    // Giày dép
    { category_name: 'Giày thể thao', slug: 'giay-the-thao', parent_name: 'Giày dép' },
    { category_name: 'Giày cao gót', slug: 'giay-cao-got', parent_name: 'Giày dép' },
    { category_name: 'Dép', slug: 'dep', parent_name: 'Giày dép' },
    { category_name: 'Giày tây', slug: 'giay-tay', parent_name: 'Giày dép' }
  ];

  return subCategories.map(subCat => {
    const parent = parentCategories.find(p => p.category_name === subCat.parent_name);
    return {
      category_name: subCat.category_name,
      slug: subCat.slug,
      parent_id: parent ? parent.category_id : null,
      active: 1
    };
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  await knex('categories').del();

  // Tạo danh mục cha trước
  const parentCategories = createFashionCategories();
  const insertedParents = [];
  
  for(const cat of parentCategories) {
    const [insertedCat] = await knex('categories').insert(cat).returning('*');
    insertedParents.push(insertedCat);
  }

  // Tạo danh mục con
  const subCategories = createSubCategories(insertedParents);
  await knex('categories').insert(subCategories);
};