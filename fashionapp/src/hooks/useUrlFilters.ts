import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ProductsParams } from '../types/product';

export const useUrlFilters = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const getFiltersFromUrl = useCallback((): ProductsParams => {
        const filters: ProductsParams = {};

        const search = searchParams.get('search');
        const brand_id = searchParams.get('brand_id');
        const min_price = searchParams.get('min_price');
        const max_price = searchParams.get('max_price');
        const sort = searchParams.get('sort');
        const color_id = searchParams.get('color_id');
        const size_id = searchParams.get('size_id');

        if (search) filters.search = search;
        if (brand_id) filters.brand_id = parseInt(brand_id);
        if (min_price) filters.min_price = parseInt(min_price);
        if (max_price) filters.max_price = parseInt(max_price);
        if (sort) filters.sort = sort as ProductsParams['sort'];

        if (color_id) {
            const colorIds = color_id.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
            filters.color_id = colorIds.length > 1 ? colorIds : colorIds[0];
        }
        
        if (size_id) {
            const sizeIds = size_id.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
            filters.size_id = sizeIds.length > 1 ? sizeIds : sizeIds[0];
        }

        return filters;
    }, [searchParams]);

    const saveFiltersToUrl = useCallback((filters: ProductsParams) => {
        const params = new URLSearchParams();

        if (filters.search) params.set('search', filters.search);
        if (filters.brand_id) params.set('brand_id', filters.brand_id.toString());
        if (filters.min_price) params.set('min_price', filters.min_price.toString());
        if (filters.max_price) params.set('max_price', filters.max_price.toString());
        if (filters.sort) params.set('sort', filters.sort);
        
        if (filters.color_id) {
            const colorStr = Array.isArray(filters.color_id) 
                ? filters.color_id.join(',') 
                : filters.color_id.toString();
            params.set('color_id', colorStr);
        }
        
        if (filters.size_id) {
            const sizeStr = Array.isArray(filters.size_id) 
                ? filters.size_id.join(',') 
                : filters.size_id.toString();
            params.set('size_id', sizeStr);
        }

        setSearchParams(params, { replace: true });
    }, [setSearchParams]);

    const clearUrlFilters = useCallback(() => {
        setSearchParams({}, { replace: true });
    }, [setSearchParams]);

    return {
        getFiltersFromUrl,
        saveFiltersToUrl,
        clearUrlFilters
    };
};
