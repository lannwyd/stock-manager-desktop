import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useFloors(sectionId: string | null) {
    const [floors, setFloors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchFloors = useCallback(async () => {
        if (!sectionId) {
            setFloors([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        const { data, error } = await supabase
            .from('floors')
            .select('id, name, stock_batches ( quantity )')
            .eq('section_id', sectionId);

        if (error) setError(error.message);
        else setFloors(data ?? []);
        setLoading(false);
    }, [sectionId]);

    useEffect(() => { fetchFloors(); }, [fetchFloors]);

    return { floors, loading, error, refetch: fetchFloors };
}