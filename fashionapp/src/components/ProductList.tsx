import ProductCard from "./ProductCard"
import aaaa from '../assets/aaaa.jpg';
interface Product {
    id: number;
    image: string;
    name: string;
    price: number;
    discount?: number;
    sold?: number;
}
export default function ProductList() {
    const mockProducts: Product[] = [
        {
            id: 1,
            image: aaaa,
            name: "Giày Thể Thao Biti's Helio Teen Nam Màu Nâu",
            price: 300000,
            discount: 20,
            sold: 150
        },
        {
            id: 2,
            image: aaaa,
            name: "Giày Thể Thao Nike Air Max 270",
            price: 2500000,
            discount: 15,
            sold: 89
        },
        {
            id: 3,
            image: aaaa,
            name: "Giày Chạy Bộ Adidas Ultraboost 22",
            price: 1800000,
            discount: 10,
            sold: 234
        },
        {
            id: 4,
            image: aaaa,
            name: "Giày Sneaker Converse Chuck Taylor",
            price: 800000,
            sold: 567
        },
        {
            id: 5,
            image: aaaa,
            name: "Giày Thể Thao Puma RS-X",
            price: 1200000,
            discount: 25,
            sold: 123
        },
        {
            id: 6,
            image: aaaa,
            name: "Giày Bóng Đá Adidas Predator",
            price: 2200000,
            discount: 30,
            sold: 78
        }
    ];
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {mockProducts.map(product => (
                <ProductCard key={product.id} product={product} />)
            )}
        </div>
    )
}