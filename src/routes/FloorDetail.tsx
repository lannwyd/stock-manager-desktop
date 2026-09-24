import { useWarehouseContext } from '../context/warehouseContext';
import { supabase } from '../lib/supabase';
import { useNavigate, useParams } from 'react-router-dom';
import { Lottie } from 'lottie-react';
import { ChevronRight, Layers, Package, Plus, Search, X } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import chatbotAnimation from '../assets/animations/chatbot.json';
import errorAnimation from '../assets/animations/Error.json';

function formatMonthYear(isoDate: string) {
    const [year, month] = isoDate.split('-');
    return `${month}/${year}`;
}

export default function FloorDetail() {
    const navigate = useNavigate();
    const { sectionId, floorId } = useParams<{ sectionId: string; floorId: string }>();
    const [search, setSearch] = useState('');
    const { selectedWarehouse, loading, error, refresh } = useWarehouseContext();

    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refresh();
        setRefreshing(false);
    }, [refresh]);

    const section = selectedWarehouse?.sections.find((s) => s.id === sectionId);
    const floor = section?.floors.find((f) => f.id === floorId);

    const [addVisible, setAddVisible] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDci, setNewDci] = useState('');
    const [newLot, setNewLot] = useState('');
    const [newExpiryMonth, setNewExpiryMonth] = useState('');
    const [newExpiryYear, setNewExpiryYear] = useState('');
    const [newQuantity, setNewQuantity] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const filteredBatches = useMemo(() => {
        if (!floor) return [];
        const batches = floor.stock_batches ?? [];
        if (!search.trim()) return batches;

        const query = search.trim().toLowerCase();
        return batches.filter(
            (b) =>
                b.products?.name.toLowerCase().includes(query) ||
                b.products?.dci.toLowerCase().includes(query)
        );
    }, [floor, search]);

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

    if (!floor) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-indigo-50" dir="rtl">
                <p className="font-bold text-xl">الطابق غير موجود</p>
            </div>
        );
    }

    const totalItems = (floor.stock_batches ?? []).reduce((sum, b) => sum + (b.quantity ?? 0), 0);
    const totalProducts = floor.stock_batches?.length ?? 0;

    const resetForm = () => {
        setNewName('');
        setNewDci('');
        setNewLot('');
        setNewExpiryMonth('');
        setNewExpiryYear('');
        setNewQuantity('');
    };

    const openAddModal = () => {
        resetForm();
        setAddVisible(true);
    };

    const handleAddition = async () => {
        if (!newName.trim() || !newDci.trim() || !newLot.trim()) {
            alert('معلومات ناقصة: يرجى إدخال الاسم، الـ DCI، ورقم اللوت.');
            return;
        }

        const month = newExpiryMonth.padStart(2, '0');
        const year = newExpiryYear;
        if (!/^\d{2}$/.test(month) || !/^\d{4}$/.test(year)) {
            alert('تاريخ غير صالح: يرجى إدخال شهر وسنة صحيحين.');
            return;
        }
        const expiryDate = `${year}-${month}-01`;

        const qty = parseInt(newQuantity, 10);
        if (isNaN(qty) || qty <= 0) {
            alert('كمية غير صالحة: أدخل كمية أكبر من 0.');
            return;
        }

        setSubmitting(true);

        let productId: string;
        const { data: existingProduct } = await supabase
            .from('products')
            .select('id')
            .eq('name', newName.trim())
            .eq('dci', newDci.trim())
            .maybeSingle();

        if (existingProduct) {
            productId = existingProduct.id;
        } else {
            const { data: createdProduct, error: productError } = await supabase
                .from('products')
                .insert({ name: newName.trim(), dci: newDci.trim() })
                .select('id')
                .single();

            if (productError || !createdProduct) {
                setSubmitting(false);
                alert(`خطأ: ${productError?.message ?? 'تعذر إنشاء الدواء'}`);
                return;
            }
            productId = createdProduct.id;
        }

        const { error: batchError } = await supabase.from('stock_batches').insert({
            product_id: productId,
            floor_id: floorId,
            lot: newLot.trim(),
            expiry_date: expiryDate,
            quantity: qty,
        });

        setSubmitting(false);

        if (batchError) {
            alert(`خطأ: ${batchError.message}`);
            return;
        }

        setAddVisible(false);
        resetForm();
        refresh();
    };

    return (
        <div className="w-full h-screen bg-indigo-50 p-4 font-sans relative flex flex-col" dir="rtl">
            <div className="flex flex-col gap-4 mb-4">
                <div className="flex flex-row items-center justify-between mt-2 px-1">
                    <h1 className="font-semibold text-2xl text-left">{floor.name}</h1>
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-indigo-100 rounded-full cursor-pointer transition-colors"
                    >
                        <ChevronRight size={28} color="#4338ca" className="rotate-180" />
                    </button>
                </div>

                <div className="flex flex-row items-center bg-white w-full h-16 rounded-xl border border-slate-400 px-3 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 shadow-sm">
                    <Search size={20} color="#64748b" />
                    <input
                        className="flex-1 mr-2 h-full text-base text-slate-800 text-right bg-transparent outline-none"
                        placeholder="ابحث عن دواء أو DCI..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {search.length > 0 && (
                        <button
                            onClick={() => setSearch('')}
                            className="p-1 hover:bg-slate-100 rounded-full cursor-pointer"
                        >
                            <X size={24} color="#64748b" />
                        </button>
                    )}
                </div>

                <div className="flex flex-row gap-4">
                    <div className="flex-1 flex flex-row bg-white rounded-xl border justify-between border-slate-400 py-4 px-6">
                        <div className='bg-indigo-100 border border-indigo-200 rounded-lg p-3'>
                            <Package size={40} color="#4338ca" />
                        </div>
                        <div >
                            <div className="text-slate-700 text-base text-left">إجمالي الأدوية</div>
                            <div className="text-2xl font-bold mt-2 text-left">{totalProducts}</div>
                        </div>
                    </div>
                    <div className="flex-1 flex flex-row bg-white rounded-xl border border-slate-400 py-4 px-6 justify-between">
                        <div className='bg-indigo-100 border border-indigo-200 rounded-lg p-3'>
                            <Layers size={40} color="#4338ca" />
                        </div>
                        <div>
                            <div className="text-slate-700 text-base text-left">الأدوية</div>
                            <div className="text-2xl font-bold mt-2 text-left">{totalProducts}</div>
                        </div>

                    </div>
                </div>

                

                <h2 className="font-semibold text-lg mt-2 px-1">قائمة الأدوية :</h2>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col gap-4 pb-24  custom-scroll">
                {filteredBatches.length === 0 ? (
                    <div className="flex flex-col items-center py-8">
                        <span className="text-slate-500">لا توجد أدوية مطابقة</span>
                    </div>
                ) : (
                    filteredBatches.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => navigate(`/sections/${sectionId}/${floorId}/${item.id}`)}
                            className="flex flex-row items-center justify-between bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-4 cursor-pointer hover:border-indigo-300 transition-colors"
                        >
                            <div className="flex flex-col">
                                <span className="text-base font-medium text-right">{item.products?.name}</span>
                                <span className="text-sm text-slate-500 text-right">{item.products?.dci}</span>
                                <span className="text-xs text-slate-400 text-right mt-0.5">
                                    {formatMonthYear(item.expiry_date)}
                                </span>
                            </div>
                            <div className="flex w-[50%] justify-end h-full flex-row items-center gap-4">
                                <span className="flex-1 text-left text-slate-800 font-medium">
                                    {item.quantity} علبة
                                </span>
                                <ChevronRight size={28} color="#4338ca" className="rotate-180" />
                            </div>
                        </div>
                    ))
                )}
            </div>

            <button
                onClick={openAddModal}
                className="absolute bottom-10 left-8 flex flex-col h-16 w-16 justify-center items-center bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-xl cursor-pointer transition-colors z-10"
            >
                <Plus size={32} color="#FFFFFF" />
            </button>

            {addVisible && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
                    <div className="w-full max-w-2xl bg-white rounded-t-2xl p-5 flex flex-col gap-4 animate-in slide-in-from-bottom-full duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex flex-row items-center justify-between">
                            <h2 className="text-xl font-bold">إضافة دواء إلى {floor.name}</h2>
                            <button
                                onClick={() => setAddVisible(false)}
                                className="p-1 hover:bg-slate-100 rounded-full cursor-pointer"
                            >
                                <X size={22} color="#64748b" />
                            </button>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-slate-700 text-md">اسم الدواء</label>
                            <div className="flex flex-row items-center border border-slate-300 rounded-lg px-3 focus-within:border-indigo-500 focus-within:ring-1">
                                <input
                                    className="flex-1 py-2 text-base bg-transparent outline-none"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                />
                                {newName.length > 0 && (
                                    <button
                                        onClick={() => setNewName('')}
                                        className="p-1 hover:bg-slate-100 rounded-full cursor-pointer"
                                    >
                                        <X size={18} color="#64748b" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-slate-700 text-md">DCI</label>
                            <div className="flex flex-row items-center border border-slate-300 rounded-lg px-3 focus-within:border-indigo-500 focus-within:ring-1">
                                <input
                                    className="flex-1 py-2 text-base bg-transparent outline-none"
                                    value={newDci}
                                    onChange={(e) => setNewDci(e.target.value)}
                                />
                                {newDci.length > 0 && (
                                    <button
                                        onClick={() => setNewDci('')}
                                        className="p-1 hover:bg-slate-100 rounded-full cursor-pointer"
                                    >
                                        <X size={18} color="#64748b" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-slate-700 text-md">LOT</label>
                            <div className="flex flex-row items-center border border-slate-300 rounded-lg px-3 focus-within:border-indigo-500 focus-within:ring-1">
                                <input
                                    className="flex-1 py-2 text-base bg-transparent outline-none"
                                    value={newLot}
                                    onChange={(e) => setNewLot(e.target.value)}
                                />
                                {newLot.length > 0 && (
                                    <button
                                        onClick={() => setNewLot('')}
                                        className="p-1 hover:bg-slate-100 rounded-full cursor-pointer"
                                    >
                                        <X size={18} color="#64748b" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-slate-700 text-md">تاريخ الانتهاء (شهر/سنة)</label>
                            <div className="flex flex-row gap-2">
                                <div className="flex-1 flex flex-row items-center border border-slate-300 rounded-lg px-3 focus-within:border-indigo-500 focus-within:ring-1">
                                    <input
                                        className="flex-1 py-2 text-base text-center bg-transparent outline-none"
                                        type="number"
                                        maxLength={2}
                                        placeholder="شهر"
                                        value={newExpiryMonth}
                                        onChange={(e) => setNewExpiryMonth(e.target.value)}
                                    />
                                    {newExpiryMonth.length > 0 && (
                                        <button
                                            onClick={() => setNewExpiryMonth('')}
                                            className="p-1 hover:bg-slate-100 rounded-full cursor-pointer"
                                        >
                                            <X size={18} color="#64748b" />
                                        </button>
                                    )}
                                </div>
                                <div className="flex-1 flex flex-row items-center border border-slate-300 rounded-lg px-3 focus-within:border-indigo-500 focus-within:ring-1">
                                    <input
                                        className="flex-1 py-2 text-base text-center bg-transparent outline-none"
                                        type="number"
                                        maxLength={4}
                                        placeholder="سنة"
                                        value={newExpiryYear}
                                        onChange={(e) => setNewExpiryYear(e.target.value)}
                                    />
                                    {newExpiryYear.length > 0 && (
                                        <button
                                            onClick={() => setNewExpiryYear('')}
                                            className="p-1 hover:bg-slate-100 rounded-full cursor-pointer"
                                        >
                                            <X size={18} color="#64748b" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-slate-700 text-md">الكمية</label>
                            <div className="flex flex-row items-center border border-slate-300 rounded-lg px-3 focus-within:border-indigo-500 focus-within:ring-1">
                                <input
                                    className="flex-1 py-2 text-base bg-transparent outline-none"
                                    type="number"
                                    value={newQuantity}
                                    onChange={(e) => setNewQuantity(e.target.value)}
                                />
                                {newQuantity.length > 0 && (
                                    <button
                                        onClick={() => setNewQuantity('')}
                                        className="p-1 hover:bg-slate-100 rounded-full cursor-pointer"
                                    >
                                        <X size={18} color="#64748b" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={handleAddition}
                            disabled={submitting}
                            className="bg-indigo-700 hover:bg-indigo-800 disabled:bg-indigo-400 rounded-xl py-3 flex items-center justify-center mt-2 cursor-pointer transition-colors shadow-sm"
                        >
                            <span className="text-white font-semibold">
                                {submitting ? 'جارٍ الإضافة...' : 'إضافة دواء'}
                            </span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}