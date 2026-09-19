type Product = { id: string; name: string; dci: string };
type StockBatch = { id: string; lot: string; expiry_date: string; quantity: number; products: Product };
type Floor = { id: string; name: string; stock_batches: StockBatch[] };
type Section = { id: string; name: string; color: string | null; floors: Floor[] };
type Warehouse = { id: string; name: string; sections: Section[] };
type HistoryItem = {
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
type WarehouseContextType = {
    warehouses: Warehouse[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    selectedWarehouseId: string | null;
    setSelectedWarehouseId: (id: string) => void;
    selectedWarehouse: Warehouse | undefined;
};

export type { Warehouse, Section, Floor, Product, HistoryItem ,WarehouseContextType};