import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lottie } from 'lottie-react';
import { ArrowUpDown, ChevronLeft, ChevronRight, MapPin, Search, X } from 'lucide-react';
import { useWarehouseContext } from '../context/warehouseContext';
import chatbotAnim from '../assets/animations/chatbot.json';
import errorAnim from '../assets/animations/Error.json';

type SortMode = 'name' | 'expiry_asc' | 'expiry_desc';

function MedRow({ item, sections, warehouseName }: { item: any; sections: any[]; warehouseName?: string }) {
    const section = sections.find((s) => s.id === item.sectionId);
    const floor = section?.floors.find((f: any) => f.id === item.floorId);

    return (
        <Link to={`/sections/${item.sectionId}/${item.floorId}/${item.id}`} className="block">
            <div className="flex flex-row items-center justify-between bg-white rounded-xl border border-slate-200 p-4 hover:bg-slate-50 cursor-pointer">
                <div className="flex flex-row w-[40%] items-center gap-2">
                    <ChevronRight size={20} color="#4338ca" />
                    <span className="flex-1 text-slate-600 text-right">{item.quantity} دواء</span>
                </div>
                <div className="w-[60%] flex flex-col gap-1.5">
                    <div className="w-full flex flex-row items-center justify-end">
                        <div className="w-[45%] p-2 bg-indigo-50 rounded-lg">
                            <span className="w-full block text-sm text-center text-indigo-600">{item.products?.dci}</span>
                        </div>
                        <span className="w-[45%] text-base font-medium text-left">{item.products?.name}</span>
                    </div>
                    <div className="flex flex-row items-center justify-between">
                        <span className="text-xs text-slate-400">{item.expiry_date}</span>
                        {section && floor && (
                            <div className="flex flex-row items-center justify-center gap-2 rounded-lg">
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

export default function Meds() {
    const navigate = useNavigate();
    const { selectedWarehouse, loading, error } = useWarehouseContext();
    const [search, setSearch] = useState('');
    const [sortMode, setSortMode] = useState<SortMode>('name');

    const sections = selectedWarehouse?.sections ?? [];

    const allBatches = useMemo(() => {
        return sections.flatMap((section: any) =>
            (section.floors ?? []).flatMap((floor: any) =>
                (floor.stock_batches ?? []).map((batch: any) => ({
                    ...batch,
                    sectionId: section.id,
                    floorId: floor.id,
                }))
            )
        );
    }, [sections]);

    const filteredBatches = useMemo(() => {
        let list = allBatches;
        if (search.trim()) {
            const query = search.trim().toLowerCase();
            list = list.filter(
                (b: any) =>
                    b.products?.name?.toLowerCase().includes(query) ||
                    b.products?.dci?.toLowerCase().includes(query)
            );
        }

        const sorted = [...list];
        if (sortMode === 'name') {
            sorted.sort((a, b) => (a.products?.name ?? '').localeCompare(b.products?.name ?? ''));
        } else if (sortMode === 'expiry_asc') {
            sorted.sort((a, b) => a.expiry_date.localeCompare(b.expiry_date));
        } else if (sortMode === 'expiry_desc') {
            sorted.sort((a, b) => b.expiry_date.localeCompare(a.expiry_date));
        }
        return sorted;
    }, [allBatches, search, sortMode]);

    if (loading) {
        return (
            <div className="flex-1 h-screen flex flex-col items-center justify-center bg-indigo-50">
                <Lottie src={chatbotAnim} loop style={{ width: 200, height: 200 }} />
                <span className="font-bold text-xl">يتم التحميل ...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 h-screen flex flex-col items-center justify-center bg-indigo-50">
                <Lottie src={errorAnim} loop style={{ width: 200, height: 200 }} />
            </div>
        );
    }

    return (
        <div className="w-full h-screen flex flex-col bg-indigo-50 overflow-hidden">
            <div className="bg-white p-4 shadow shadow-black/10 shrink-0">
                <div className="flex flex-row items-center justify-between">
                    <span className="font-semibold text-2xl">قائمة الأدوية</span>
                    <button onClick={() => navigate(-1)} className="p-2">
                        <ChevronLeft size={28} color="#4338ca" />
                    </button>
                </div>
            </div>

            <div className="px-4 pt-4 shrink-0 flex flex-col gap-2">
                <div className="flex flex-row items-center bg-white w-full h-10 rounded-md border border-slate-400 px-3">
                    <Search size={20} color="#64748b" />
                    <input
                        dir="ltr"
                        className="flex-1 mr-2 h-full text-base text-slate-800 text-right bg-transparent outline-none"
                        value={search}
                        placeholder="... DCI ابحث عن دواء أو"
                        onChange={(e) => setSearch(e.target.value)}
                        autoCorrect="off"
                    />
                    {search.length > 0 && (
                        <button onClick={() => setSearch('')} className="p-1">
                            <X size={24} color="#64748b" />
                        </button>
                    )}
                </div>

                <div className="flex flex-row items-center gap-2 overflow-x-auto py-2">
                    <ArrowUpDown size={16} color="#64748b" className="shrink-0" />
                    <button
                        onClick={() => setSortMode('name')}
                        className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${sortMode === 'name' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                    >
                        الاسم
                    </button>
                    <button
                        onClick={() => setSortMode('expiry_asc')}
                        className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${sortMode === 'expiry_asc' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                    >
                        الأقرب انتهاء
                    </button>
                    <button
                        onClick={() => setSortMode('expiry_desc')}
                        className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${sortMode === 'expiry_desc' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                    >
                        الأبعد انتهاء
                    </button>
                </div>

                <span className="text-sm text-slate-500 px-1">{filteredBatches.length} نتيجة</span>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4 mt-2">
                <div className="flex flex-col gap-3">
                    {filteredBatches.length === 0 && (
                        <div className="flex items-center justify-center py-8">
                            <span className="text-slate-400">لا توجد ادوية مطابقة</span>
                        </div>
                    )}

                    {filteredBatches.map((item: any) => (
                        <MedRow
                            key={item.id}
                            item={item}
                            sections={sections}
                            warehouseName={selectedWarehouse?.name}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}