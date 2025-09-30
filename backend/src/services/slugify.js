module.exports = function slugify(text) {
    return text
      .toString() // ép về string
      .normalize("NFD") // chuẩn hoá, tách dấu tiếng Việt
      .replace(/[\u0300-\u036f]/g, "") // xoá dấu
      .toLowerCase() // viết thường
      .trim() // xoá khoảng trắng 2 đầu
      .replace(/[^a-z0-9\s-]/g, "") // bỏ ký tự đặc biệt
      .replace(/\s+/g, "-") // thay space bằng dấu gạch ngang
      .replace(/-+/g, "-"); // gộp nhiều gạch ngang thành 1
  }
  

  