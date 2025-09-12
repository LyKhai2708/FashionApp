import ProductCard from "./ProductCard"
export default function ProductList() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
                <ProductCard key={index} />
            ))}
        </div>
    )
}