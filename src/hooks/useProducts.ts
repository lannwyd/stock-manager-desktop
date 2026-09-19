import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useProducts(floorId: string | null) {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProducts = useCallback(async () => {
        if (!floorId) {
            setProducts([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        const { data, error } = await supabase
            .from('stock_batches')
            .select('id, lot, expiry_date, quantity, products ( id, name, dci )')
            .eq('floor_id', floorId);

        if (error) setError(error.message);
        else setProducts(data ?? []);
        setLoading(false);
    }, [floorId]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    return { products, loading, error, refetch: fetchProducts };
}