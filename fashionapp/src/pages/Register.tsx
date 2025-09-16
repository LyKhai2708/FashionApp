export default function Register() {
    return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="w-full max-w-md p-6 rounded-md border">
                <h1 className="text-2xl font-semibold mb-4">Đăng ký</h1>
                <form className="space-y-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-sm text-gray-600">Họ và tên</label>
                        <input className="border rounded px-3 py-2" type="text" placeholder="Nguyen Van A" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-sm text-gray-600">Email</label>
                        <input className="border rounded px-3 py-2" type="email" placeholder="you@example.com" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-sm text-gray-600">Mật khẩu</label>
                        <input className="border rounded px-3 py-2" type="password" placeholder="••••••••" />
                    </div>
                    <button type="button" className="w-full bg-black text-white py-2 rounded">Đăng ký</button>
                </form>
            </div>
        </div>
    )
}


