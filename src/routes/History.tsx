import { useHistory } from '../hooks/useHistory';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Lottie } from 'lottie-react';
import { ChevronRight, Search, Trash2, X } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import chatbotAnimation from '../assets/animations/chatbot.json';
import errorAnimation from '../assets/animations/Error.json';

export default function HistoryScreen() {
    const { historyItems, loading, error, refetch } = useHistory();
    const [search, setSearch] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const navigate = useNavigate();

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    }, [refetch]);

    const filteredHistory = useMemo(() => {
        if (!search.trim()) return historyItems;
        const query = search.trim().toLowerCase();
        return historyItems.filter((item) =>
            item.stock_batches?.products?.name?.toLowerCase().includes(query)
        );
    }, [historyItems, search]);

    const handleDeleteHistoryItem = async (item: (typeof historyItems)[number]) => {
        const isConfirmed = window.confirm(
            `حذف هذا السجل؟\nسيتم حذف سجل نقل "${item.stock_batches?.products?.name ?? 'هذا الدواء'}" نهائيًا.`
        );

        if (isConfirmed) {
            const { error: deleteError } = await supabase.from('stock_movements').delete().eq('id', item.id);
            if (deleteError) {
                alert(deleteError.message);
            } else {
                refetch();
            }
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-indigo-50" dir="rtl">
                <div className="w-50 h-50">
                    <Lottie src={chatbotAnimation} loop={true} />
                </div>
                <p className="font-bold text-xl mt-4">يتم التحميل ...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-indigo-50" dir="rtl">
                <div className="w-50 h-50">
                    <Lottie src={errorAnimation} loop={true} />
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-screen bg-white p-4 font-sans" dir="rtl">
            <div className="w-full h-full flex flex-col gap-4">

                <div className="flex flex-col gap-4 mb-2">
                    <div className="flex flex-row items-center justify-between mt-2 px-1">
                        <h1 className="font-semibold text-2xl">السجل</h1>
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-slate-200 rounded-full cursor-pointer transition-colors"
                        >
                            <ChevronRight size={28} color="#4338ca" className="rotate-180" />
                        </button>
                    </div>

                    <div className="flex flex-row items-center bg-white w-full h-16 rounded-xl border border-slate-400 px-3">
                        <Search size={20} color="#64748b" />
                        <input
                            className="flex-1 mr-2 h-full text-base text-slate-800 text-right bg-transparent outline-none"
                            placeholder="ابحث في السجل..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoCorrect="off"
                        />
                        {search.length > 0 && (
                            <button onClick={() => setSearch('')} className="p-1 cursor-pointer hover:bg-slate-100 rounded-full">
                                <X size={24} color="#64748b" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 flex flex-col gap-4 bg-indigo-50 rounded-lg p-4 border border-slate-400 overflow-y-auto  custom-scroll">
                    {filteredHistory.length === 0 ? (
                        <div className="flex items-center justify-center py-8">
                            <span className="text-slate-400">لا توجد سجلات مطابقة</span>
                        </div>
                    ) : (
                        filteredHistory.map((item) => (
                            <div
                                key={item.id}
                                className="bg-white px-4 py-3 rounded-xl border border-slate-200 flex flex-row items-center justify-between"
                            >
                                <button
                                    onClick={() => handleDeleteHistoryItem(item)}
                                    className="p-2 cursor-pointer hover:bg-red-50 rounded-full transition-colors"
                                >
                                    <Trash2 size={20} color="#dc2626" />
                                </button>
                                <div className="flex-1">
                                    <span className="text-lg font-medium text-right block">
                                        {item.stock_batches?.products?.name ?? 'دواء غير معروف'}
                                    </span>
                                    <span className="text-slate-700 text-md text-right block">
                                        {item.from_warehouse?.name ?? 'N/A'} ← {item.to_warehouse?.name ?? 'N/A'} · {item.quantity} دواء · {new Date(item.created_at).toLocaleDateString('ar')}
                                    </span>
                                    {item.note && (
                                        <span className="text-slate-700 text-sm text-right block mt-1">{item.note}</span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}