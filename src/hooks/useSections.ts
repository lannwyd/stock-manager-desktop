import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useSections(warehouseId: string) {
    const [sections, setSections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSections = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('sections')
            .select('id, name, color, floors(id)') 
            .eq('warehouse_id', warehouseId);

        if (error) setError(error.message);
        else setSections(data ?? []);
        setLoading(false);
    }, [warehouseId]);

    useEffect(() => { fetchSections(); }, [fetchSections]);

    return { sections, loading, error, refetch: fetchSections };
}