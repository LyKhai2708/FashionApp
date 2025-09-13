import { HeartIcon } from 'lucide-react';
import { useState } from 'react';

interface Product {
    id: number;
    image: string;
    name: string;
    price: number;
    discount?: number;
    sold?: number;
}

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    const [liked, setLiked] = useState(false)
    
    return (
        <div className="cursor-pointer relative group flex flex-col items-center border border-gray-200 rounded-lg overflow-visible shadow hover:shadow-lg transition-shadow duration-300 h-full group-hover:z-20">
            <img src={product.image} alt="Product Image" className="w-full aspect-[3/4] object-cover" />
            <div className="p-4 flex flex-col flex-grow w-full">
                <h3 className="text-lg font-semibold mb-2 line-clamp-2">{product.name}</h3>
                <div className='mt-auto'>
                    <div className='flex justify-between'>
                        <div className="flex items-baseline gap-1">
                            <span className="text-lg font-bold text-black-600">{product.price.toLocaleString()}</span>
                            <span className="text-lg font-semibold text-black-600">₫</span>
                        </div>
                        <div>
                            <span className="text-sm font-semibold text-red-500">Đã bán: </span>
                            <span className="text-sm font-semibold text-red-500">{product.sold || 0}</span>
                        </div>
                    </div>
                    <div className="flex gap-2 mb-2 mt-2">
                        <div className="w-8 h-8 rounded-full border-2 border-gray-300 bg-[url('/images/stripe.png')] bg-cover cursor-pointer"></div>
                        <div className="w-8 h-8 rounded-full border-2 border-gray-300 bg-gray-200 cursor-pointer"></div>
                    </div>
                    {/* <div className="flex gap-2 mb-3">
                    {["S", "M", "L"].map((size) => (
                        <button
                        key={size}
                        className="px-3 py-1 border rounded text-sm hover:bg-black hover:text-white transition"
                        >
                        {size}
                        </button>
                    ))}
                    </div>
                    <div className='hidden mx-auto group-hover:block'>
                        <button className="block mt-4 mx-auto w-40 bg-black text-white py-2 px-4 rounded cursor-pointer transition-colors duration-300">
                            MUA NGAY
                        </button>
                    </div> */}
                    
                </div>

            </div>
            {product.discount && (
                <div className='absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded'>-{product.discount}%</div>
            )}
            <button  className='cursor-pointer absolute top-3 right-3 rounded-full bg-white border border-black-500 px-2 py-2' onClick={() => setLiked((v) => !v)}>
                <HeartIcon className={(liked ? 'text-red-500' : 'text-gray-400') + ' transition-colors duration-200'} fill={liked ? 'currentColor' : 'none'}/>
            </button>
            
        </div>
    )
}