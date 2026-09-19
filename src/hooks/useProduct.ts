import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useProduct(batchId: string | null) {
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProduct = useCallback(async () => {
        if (!batchId) {
            setProduct(null);
            setLoading(false);
            return;
        }
        setLoading(true);
        const { data, error } = await supabase
            .from('stock_batches')
            .select('id, lot, expiry_date, quantity, floor_id, products ( id, name, dci )')
            .eq('id', batchId)
            .single();

        if (error) setError(error.message);
        else setProduct(data);
        setLoading(false);
    }, [batchId]);

    useEffect(() => { fetchProduct(); }, [fetchProduct]);

    return { product, loading, error, refetch: fetchProduct };
}