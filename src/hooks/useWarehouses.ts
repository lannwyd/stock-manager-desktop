import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useWarehouses() {
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchWarehouses = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('warehouses').select('id, name');
        if (error) setError(error.message);
        else setWarehouses(data ?? []);
        setLoading(false);
    }, []);

    useEffect(() => { fetchWarehouses(); }, [fetchWarehouses]);

    return { warehouses, loading, error, refetch: fetchWarehouses };
}