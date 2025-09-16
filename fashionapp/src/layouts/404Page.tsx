export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl font-bold">404</div>
        <div className="mt-2 text-gray-600">Trang bạn tìm không tồn tại</div>
        <a href="/" className="inline-block mt-6 px-6 py-3 rounded-md border border-gray-300 hover:bg-gray-100 cursor-pointer">Về trang chủ</a>
      </div>
    </div>
  );
}

