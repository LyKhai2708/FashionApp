// src/components/Footer.tsx
import { Facebook, Instagram, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#2F3235] text-gray-200">
      <div className="max-w-[1280px] mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-3 md:gap-50 gap-10">
        {/* Thông tin shop */}
        <div>
          <h3 className="text-lg font-semibold text-red-500">DELULU</h3>
          <p className="text-sm mt-2">
            Bringing you the latest fashion trends.
          </p>
        </div>

        {/* Liên kết nhanh */}
        <div>
          <h4 className="font-semibold mb-2">Links</h4>
          <ul className="space-y-1 text-sm">
            <li><a href="#" className="hover:underline">About us</a></li>
            <li><a href="#" className="hover:underline">Contact</a></li>
            <li><a href="#" className="hover:underline">Terms</a></li>
          </ul>
        </div>

        {/* Mạng xã hội */}
        <div>
          <h4 className="font-semibold mb-2">Connect</h4>
          <div className="flex space-x-3">
            <Facebook className="w-5 h-5 cursor-pointer hover:text-blue-500" />
            <Instagram className="w-5 h-5 cursor-pointer hover:text-pink-500" />
            <Twitter className="w-5 h-5 cursor-pointer hover:text-sky-400" />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-700 text-center py-3 text-sm">
        © 2025 FashionShop. All rights reserved.
      </div>
    </footer>
  );
}
