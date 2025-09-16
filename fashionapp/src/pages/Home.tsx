import ProductSlider from "../components/ProductSlider"
import type { ReactNode, FC } from "react";
import { Mars,Venus, Shirt, ShoppingBag, Watch, Sparkles } from "lucide-react";
import ProductList from "../components/ProductList";

interface CategoryItem{
    id: number;
    name: string;
    icon: ReactNode;
}

const categories: CategoryItem[] = [
    { id: 1, name: "Nam", icon: <Mars className="w-10 h-10" /> },
    { id: 2, name: "Nữ", icon: <Venus className="w-10 h-10" /> },
    { id: 3, name: "Áo thun", icon: <Shirt className="w-10 h-10" /> },
    { id: 4, name: "Quần", icon: <ShoppingBag className="w-10 h-10 rotate-90" /> },
    { id: 5, name: "Váy", icon: <Sparkles className="w-10 h-10" /> },
    { id: 6, name: "Túi xách", icon: <ShoppingBag className="w-10 h-10" /> },
    { id: 7, name: "Phụ kiện", icon: <Watch className="w-10 h-10" /> },
];

const Home: FC = () => {
    return(
        <>
            {/* Category Section */}
            <section className="mx-auto max-w-6xl p-4 flex flex-col items-center">
                <h2 className="font-bold text-2xl">DANH MỤC SẢN PHẨM</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 mt-4">
                    {categories.map((category) => (
                        <button key={category.id} className="cursor-pointer" onClick={() => alert(`Bạn đã chọn danh mục: ${category.name}`)}>
                            <div className="flex flex-col items-center p-10 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">
                                {category.icon}
                                <span className="mt-2 text-md font-medium">{category.name}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </section>
            <div className="mt-20">
                <h2 className="text-xl font-bold mb-4">SẢN PHẨM NỔI BẬT</h2>
                <ProductSlider />
            </div>
            <div className="mt-20">
                <h2 className="text-xl font-bold mb-4">HÀNG MỚI VỀ</h2>
                <ProductList limit={8}></ProductList>
            </div>
        </>
    )
}

export default Home