import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

export type Product = { id: string; name: string; dci: string };
export type StockBatch = { id: string; lot: string; expiry_date: string; quantity: number; products: Product };
export type Floor = { id: string; name: string; stock_batches: StockBatch[] };
export type Section = { id: string; name: string; color: string | null; floors: Floor[] };
export type Warehouse = { id: string; name: string; sections: Section[] };

export type HistoryItem = {
    key: string;
    productName: string;
    dci: string;
    lot: string;
    quantity: number;
    fromWarehouse: string;
    toWarehouse: string;
    date: string;
    note?: string;
};

export type WarehouseContextType = {
    warehouses: Warehouse[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    selectedWarehouseId: string | null;
    setSelectedWarehouseId: (id: string | null) => void;
    selectedWarehouse: Warehouse | null;
};

const WarehouseContext = createContext<WarehouseContextType | undefined>(undefined);

export function WarehouseProvider({ children }: { children: React.ReactNode }) {
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
            .from('warehouses')
            .select(`
        id,
        name,
        sections (
        id,
        name,
        color,
        floors (
            id,
            name,
            stock_batches (
                id,
                lot,
                expiry_date,
                quantity,
                products ( id, name, dci )
                )
            )
        )
    `);

        if (fetchError) {
            setError(fetchError.message);
        } else {
            setWarehouses((data as unknown as Warehouse[]) ?? []);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const selectedWarehouse = useMemo(() => {
        if (warehouses.length === 0) return null;
        return (
            warehouses.find((w) => w.id === selectedWarehouseId) ??
            warehouses.find((w) => w.name === 'Pharmacie') ??
            warehouses[0]
        );
    }, [warehouses, selectedWarehouseId]);

    const value = useMemo(
        () => ({
            warehouses,
            loading,
            error,
            refresh: fetchData,
            selectedWarehouseId,
            setSelectedWarehouseId,
            selectedWarehouse,
        }),
        [warehouses, loading, error, fetchData, selectedWarehouseId, selectedWarehouse]
    );

    return React.createElement(WarehouseContext.Provider, { value }, children);
}

export function useWarehouseContext() {
    const ctx = useContext(WarehouseContext);
    if (!ctx) {
        throw new Error('useWarehouseContext must be used within a WarehouseProvider');
    }
    return ctx;
}