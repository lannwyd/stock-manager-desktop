import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {Lottie} from 'lottie-react';
import { ChevronLeft, ChevronRight, Dot, Layers, MapPin, Package, Search, X } from 'lucide-react';
import { useWarehouseContext } from '../context/warehouseContext';
import { useHistory } from '../hooks/useHistory';
import DropdownComponent from '../components/shared/DropdownComponent';
import chatbotAnim from '../assets/animations/chatbot.json';
import errorAnim from '../assets/animations/Error.json';

function SearchResultRow({ item, sections, warehouseName }: { item: any; sections: any[]; warehouseName?: string }) {
    const section = sections.find((s) => s.id === item.sectionId);
    const floor = section?.floors.find((f: any) => f.id === item.floorId);

    return (
        <Link to={`/sections/${item.sectionId}/${item.floorId}/${item.id}`} className="block">
            <div className="flex flex-row items-center justify-between bg-white rounded-xl border border-slate-200 p-4 hover:bg-slate-50 cursor-pointer">
                <div className="flex flex-row w-[40%] items-center gap-2">
                    <ChevronRight size={20} color="#4338ca" />
                    <span className="flex-1 text-slate-600 text-left">{item.quantity} دواء</span>
                </div>
                <div className="w-[60%] flex flex-col gap-1.5">
                    <div className="w-full flex flex-row items-center justify-between">
                        <div className="w-[45%] p-2 bg-indigo-50 rounded-lg">
                            <span className="w-full block text-sm text-center text-indigo-600">{item.products?.dci}</span>
                        </div>
                        <span className="w-[45%] text-base font-medium text-right">{item.products?.name}</span>
                    </div>
                    <div>
                        {section && floor && (
                            <div className="flex flex-row items-center justify-center p-1.5 gap-2 rounded-lg">
                                <span className="w-full text-sm text-indigo-600 text-left">{warehouseName} · {section.name} · {floor.name}</span>
                                <MapPin size={14} color="#4338ca" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}

export default function Home() {
    const {
        warehouses,
        loading: warehousesLoading,
        error: warehousesError,
        selectedWarehouseId,
        setSelectedWarehouseId,
        selectedWarehouse,
        refresh,
    } = useWarehouseContext();
    const { historyItems, loading: historyLoading, error: historyError, refetch: refetchHistory } = useHistory();

    const [search, setsearch] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([refresh(), refetchHistory()]);
        setRefreshing(false);
    }, [refresh, refetchHistory]);

    const allBatches = useMemo(() => {
        const sections = selectedWarehouse?.sections ?? [];
        return sections.flatMap((section: any) =>
            (section.floors ?? []).flatMap((floor: any) =>
                (floor.stock_batches ?? []).map((batch: any) => ({
                    ...batch,
                    sectionId: section.id,
                    floorId: floor.id,
                }))
            )
        );
    }, [selectedWarehouse]);

    const searchResults = useMemo(() => {
        if (!search.trim()) return [];
        const query = search.trim().toLowerCase();
        return allBatches.filter(
            (b: any) =>
                b.products?.name?.toLowerCase().includes(query) ||
                b.products?.dci?.toLowerCase().includes(query)
        );
    }, [allBatches, search]);

    if (warehousesLoading || historyLoading) {
        return (
            <div className="flex-1 h-screen flex flex-col items-center justify-center bg-indigo-50">
                <Lottie  src={chatbotAnim } loop style={{ width: 200, height: 200 }} />
                <span className="font-bold text-xl">يتم التحميل ...</span>
            </div>
        );
    }

    if (warehousesError || historyError) {
        return (
            <div className="flex-1 h-screen flex flex-col items-center justify-center bg-indigo-50">
                <Lottie src={errorAnim} loop style={{ width: 200, height: 200 }} />
            </div>
        );
    }

    const dropdownOptions = warehouses.map((w) => ({ label: w.name, value: w.id }));
    const sections = selectedWarehouse?.sections ?? [];

    const totalProducts = new Set(
        sections.flatMap((section: any) =>
            (section.floors ?? []).flatMap((floor: any) =>
                (floor.stock_batches ?? []).map((batch: any) => batch.products?.name)
            )
        )
    ).size;

    const isSearching = search.trim().length > 0;
    const listData = isSearching ? searchResults : historyItems.slice(0, 3);

    return (
        <div className="min-h-screen bg-indigo-50 p-4" dir="rtl">
            <div className="max-w-2xl mx-auto flex flex-col gap-4">
                <div className="flex justify-end">
                    <button onClick={onRefresh} className="text-sm text-indigo-700">
                        {refreshing ? 'جارٍ التحديث...' : 'تحديث'}
                    </button>
                </div>

                <DropdownComponent
                    options={dropdownOptions}
                    value={selectedWarehouse?.id}
                    onChange={(value: string) => setSelectedWarehouseId(value)}
                />

                <div className="flex flex-row items-center bg-white w-full h-16 rounded-xl border border-slate-400 px-3">
                    <Search size={20} color="#64748b" />
                    <input
                        className="flex-1 mr-2 h-full text-base text-slate-800 text-right bg-transparent outline-none"
                        value={search}
                        placeholder="ابحث عن دواء أو DCI..."
                        onChange={(e) => setsearch(e.target.value)}
                        autoCorrect="off"
                    />
                    {search.length > 0 && (
                        <button onClick={() => setsearch('')} className="p-1">
                            <X size={24} color="#64748b" />
                        </button>
                    )}
                </div>

                {!isSearching && (
                    <>
                        <div className="flex flex-row gap-4">
                            <div className="flex-1 bg-white rounded-xl border border-slate-200 py-4 px-6">
                                <Package size={20} color="#4338ca" />
                                <div className="text-2xl font-bold mt-2 text-left">{totalProducts}</div>
                                <div className="text-slate-700 text-base text-left">إجمالي الأدوية</div>
                            </div>
                            <div className="flex-1 bg-white rounded-xl border border-slate-200 py-4 px-6">
                                <Layers size={20} color="#4338ca" />
                                <div className="text-2xl font-bold mt-2 text-left">{sections.length}</div>
                                <div className="text-slate-700 text-base text-left">الأقسام</div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-3">
                            <div className="flex flex-row items-center justify-between">
                                <span className="font-semibold text-lg">الأقسام</span>
                                <Link to="/sections" className="flex flex-row items-center">
                                    <span className="text-indigo-700 font-medium ml-1">عرض الكل</span>
                                    <ChevronLeft size={16} color="#4338ca" />
                                </Link>
                            </div>

                            <div className="flex flex-col gap-3">
                                {sections.slice(0, 2).map((item: any) => {
                                    const distinctProductCount = new Set(
                                        (item.floors ?? []).flatMap((floor: any) =>
                                            (floor.stock_batches ?? []).map((batch: any) => batch.products?.name)
                                        )
                                    ).size;

                                    return (
                                        <Link key={item.id} to={`/sections/${item.id}`}>
                                            <div className={`flex flex-row items-start rounded-xl justify-between px-4 py-5 ${item.color ?? 'bg-slate-100'} hover:opacity-90 cursor-pointer`}>
                                                <div className="w-[90%] flex flex-row justify-between items-center gap-2">
                                                    <div className="flex w-[50%] gap-2 flex-col">
                                                        <span className="text-lg font-medium text-left">{item.name}</span>
                                                        <span className="text-sm text-slate-700 text-left">اضغط لمزيد من المعلومات</span>
                                                    </div>
                                                    <div className="flex flex-row w-[50%] items-center">
                                                        <span className="flex-1 text-slate-600 text-right">{distinctProductCount} أدوية</span>
                                                    </div>
                                                </div>
                                                <div className="w-[10%] h-full flex flex-row justify-end items-center">
                                                    <ChevronLeft size={26} color="#4338ca" />
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}

                                {sections.length > 2 ? (
                                    <div className="w-full flex flex-row items-center justify-center">
                                        <Dot size={15} />
                                        <Dot size={15} />
                                        <Dot size={15} />
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        <div className="flex flex-row items-center justify-between mt-2 px-1">
                            <span className="font-semibold text-lg">السجل</span>
                            <Link to="/sections/history" className="flex flex-row items-center">
                                <span className="text-indigo-700 font-medium ml-1">عرض الكل</span>
                                <ChevronLeft size={16} color="#4338ca" />
                            </Link>
                        </div>
                    </>
                )}

                {isSearching && (
                    <span className="font-semibold text-lg px-1 text-right">
                        {searchResults.length} نتائج البحث
                    </span>
                )}

                <div className="flex flex-col gap-4">
                    {listData.length === 0 && isSearching && (
                        <div className="flex items-center justify-center py-8">
                            <span className="text-slate-400">لا توجد ادوية مطابقة</span>
                        </div>
                    )}

                    {listData.map((item: any) =>
                        isSearching ? (
                            <SearchResultRow key={item.id} item={item} sections={sections} warehouseName={selectedWarehouse?.name} />
                        ) : (
                            <div key={item.id} className="flex flex-row justify-between bg-white px-4 py-3 rounded-xl border border-slate-200">
                                <div>
                                    <span className="flex flex-col items-center text-base font-medium text-right">
                                        {item.quantity} علب
                                    </span>
                                </div>
                                <div>
                                    <div className="text-base font-medium text-right">
                                        {item.stock_batches?.products?.name ?? 'دواء غير معروف'}
                                    </div>
                                    <div className="text-sm text-right">
                                        {item.from_warehouse?.name ?? 'N/A'} ← {item.to_warehouse?.name ?? 'N/A'} · {new Date(item.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}