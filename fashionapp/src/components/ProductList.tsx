import ProductCard from "./ProductCard"
import aaaa from '../assets/aaaa.jpg';

interface Product {
    id: number;
    image: string;
    name: string;
    price: number;
    discount?: number;
    sold?: number;
    isFavorite?: boolean;
}

interface ProductListProps {
    products?: Product[];
    limit?: number;
    pagination?: boolean;
    pageSize?: number;
}

export default function ProductList({ products, limit, pagination = false, pageSize = 12 }: ProductListProps) {
    const mockProducts: Product[] = [
        {
            id: 1,
            image: aaaa,
            name: "Giày Thể Thao Biti's Helio Teen Nam Màu Nâu",
            price: 300000,
            discount: 20,
            sold: 150,
            isFavorite: true
        },
        {
            id: 2,
            image: aaaa,
            name: "Giày Thể Thao Nike Air Max 270",
            price: 2500000,
            discount: 15,
            sold: 89,
            isFavorite: true
        },
        {
            id: 3,
            image: aaaa,
            name: "Giày Chạy Bộ Adidas Ultraboost 22",
            price: 1800000,
            discount: 10,
            sold: 234,
            isFavorite: true
        },
        {
            id: 4,
            image: aaaa,
            name: "Giày Sneaker Converse Chuck Taylor",
            price: 800000,
            sold: 567,
            isFavorite: false
        },
        {
            id: 5,
            image: aaaa,
            name: "Giày Thể Thao Puma RS-X",
            price: 1200000,
            discount: 25,
            sold: 123,
            isFavorite: false
        },
        {
            id: 6,
            image: aaaa,
            name: "Giày Bóng Đá Adidas Predator",
            price: 2200000,
            discount: 30,
            sold: 78,
            isFavorite: false
        }
    ];

    const data: Product[] = products && products.length > 0 ? products : mockProducts;

    // derive items to render based on mode
    let itemsToRender: Product[] = data;
    if (!pagination && typeof limit === 'number') {
        itemsToRender = data.slice(0, Math.max(0, limit));
    }

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {(!pagination ? itemsToRender : data.slice(0, pageSize)).map((product) => (
                    <ProductCard  key={product.id} product={product} />
                ))}
            </div>
            {pagination && (
                <div className="flex justify-center mt-8">
                    <button className="cursor-pointer px-6 py-2 border rounded-md hover:bg-gray-50">
                        Tải thêm
                    </button>
                </div>
            )}
        </>
    )
}