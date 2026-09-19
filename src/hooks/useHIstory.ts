import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useHistory() {
    const [historyItems, setHistoryItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('stock_movements')
            .select(`
        id,
        quantity,
        movement_type,
        note,
        created_at,
        from_warehouse:from_warehouse_id ( id, name ),
        to_warehouse:to_warehouse_id ( id, name ),
        stock_batches (
          lot,
          products ( name, dci )
        )
      `)
            .order('created_at', { ascending: false });

        if (error) setError(error.message);
        else setHistoryItems(data ?? []);
        setLoading(false);
    }, []);

    useEffect(() => { fetchHistory(); }, [fetchHistory]);

    return { historyItems, loading, error, refetch: fetchHistory };
}