import { useWarehouseContext } from '../context/warehouseContext';
import { useProduct } from '../hooks/useProduct';
import { supabase } from '../lib/supabase';
import { useNavigate, useParams } from 'react-router-dom';
import { Lottie } from 'lottie-react';
import { RefreshCw,ArrowLeftRight, Calendar, ChevronRight, Hash, Layers, MapPin, Pencil, Trash2, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import chatbotAnimation from '../assets/animations/chatbot.json';
import errorAnimation from '../assets/animations/Error.json';

export default function ProductDetail() {
    const navigate = useNavigate();
    const { productId } = useParams<{ productId: string }>();
    const { product: batch, loading, error, refetch } = useProduct(productId as string);
    const { warehouses, selectedWarehouse, refresh } = useWarehouseContext();

    const [editVisible, setEditVisible] = useState(false);
    const [transferVisible, setTransferVisible] = useState(false);

    const [editName, setEditName] = useState('');
    const [editDci, setEditDci] = useState('');
    const [editQuantity, setEditQuantity] = useState('');
    const [editLot, setEditLot] = useState('');
    const [editExpiryMonth, setEditExpiryMonth] = useState('');
    const [editExpiryYear, setEditExpiryYear] = useState('');
    const [transferQuantity, setTransferQuantity] = useState('');
    const [transferNote, setTransferNote] = useState('');
    const [transferTargetWarehouseId, setTransferTargetWarehouseId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([refetch(), refresh()]);
        setRefreshing(false);
    }, [refetch, refresh]);

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

    if (!batch) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-indigo-50" dir="rtl">
                <p className="font-bold text-xl">الدواء غير موجود</p>
            </div>
        );
    }

    function formatMonthYear(isoDate: string) {
        const [year, month] = isoDate.split('-');
        return `${month}/${year}`;
    }

    let location: { warehouseName: string; sectionName: string; floorName: string } | null = null;
    for (const warehouse of warehouses) {
        for (const section of warehouse.sections ?? []) {
            for (const floor of section.floors ?? []) {
                if ((floor.stock_batches ?? []).some((b) => b.id === batch.id)) {
                    location = { warehouseName: warehouse.name, sectionName: section.name, floorName: floor.name };
                }
            }
        }
    }

    const handleDelete = async () => {
        const confirmed = window.confirm(
            `حذف هذه الدفعة؟\nسيتم حذف ${batch.products?.name} (${batch.lot}) نهائيًا من المخزون.`
        );

        if (confirmed) {
            const { error: deleteError } = await supabase.from('stock_batches').delete().eq('id', batch.id);
            if (deleteError) {
                alert(`خطأ: ${deleteError.message}`);
            } else {
                navigate(-1);
            }
        }
    };

    const openEditModal = () => {
        setEditName(batch.products?.name ?? '');
        setEditDci(batch.products?.dci ?? '');
        setEditQuantity(String(batch.quantity));
        setEditLot(batch.lot);
        const [year, month] = batch.expiry_date.split('-');
        setEditExpiryMonth(month);
        setEditExpiryYear(year);
        setEditVisible(true);
    };

    const handleSaveEdit = async () => {
        if (!editName.trim() || !editDci.trim()) {
            alert('معلومات ناقصة: يرجى إدخال اسم الدواء والـ DCI.');
            return;
        }

        const month = editExpiryMonth.padStart(2, '0');
        const year = editExpiryYear;
        if (!/^\d{2}$/.test(month) || !/^\d{4}$/.test(year)) {
            alert('تاريخ غير صالح: يرجى إدخال شهر وسنة صحيحين.');
            return;
        }
        const reconstructedExpiry = `${year}-${month}-01`;

        setSubmitting(true);

        if (batch.products?.id) {
            const { error: productError } = await supabase
                .from('products')
                .update({ name: editName.trim(), dci: editDci.trim() })
                .eq('id', batch.products.id);

            if (productError) {
                setSubmitting(false);
                alert(`خطأ: ${productError.message}`);
                return;
            }
        }

        const { error: updateError } = await supabase
            .from('stock_batches')
            .update({
                quantity: parseInt(editQuantity, 10) || 0,
                lot: editLot,
                expiry_date: reconstructedExpiry,
            })
            .eq('id', batch.id);

        setSubmitting(false);

        if (updateError) {
            alert(`خطأ: ${updateError.message}`);
            return;
        }

        setEditVisible(false);
        refetch();
        refresh();
    };

    const otherWarehouses = warehouses.filter((w) => w.id !== selectedWarehouse?.id);

    const openTransferModal = () => {
        setTransferQuantity(String(batch.quantity));
        setTransferNote('');
        setTransferTargetWarehouseId(otherWarehouses[0]?.id ?? null);
        setTransferVisible(true);
    };

    const handleConfirmTransfer = async () => {
        if (!transferTargetWarehouseId || !selectedWarehouse) return;

        const qty = parseInt(transferQuantity, 10) || 0;
        if (qty <= 0 || qty > batch.quantity) {
            alert(`كمية غير صالحة: أدخل رقمًا بين 1 و ${batch.quantity}.`);
            return;
        }

        setSubmitting(true);

        const { error: movementError } = await supabase.from('stock_movements').insert({
            batch_id: batch.id,
            quantity: qty,
            movement_type: 'transfer',
            from_warehouse_id: selectedWarehouse.id,
            to_warehouse_id: transferTargetWarehouseId,
            note: transferNote.trim() || null,
        });

        if (movementError) {
            setSubmitting(false);
            alert(`خطأ: ${movementError.message}`);
            return;
        }

        const remaining = batch.quantity - qty;
        if (remaining <= 0) {
            await supabase.from('stock_batches').delete().eq('id', batch.id);
        } else {
            await supabase.from('stock_batches').update({ quantity: remaining }).eq('id', batch.id);
        }

        setSubmitting(false);
        setTransferVisible(false);
        navigate(-1);
    };

    return (
        <div className="w-full min-h-screen bg-indigo-50 font-sans relative flex flex-col" dir="rtl">
            <div className="flex-1 overflow-y-auto p-4 gap-4 flex flex-col pb-24">
                <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-4 shadow-sm">
                    <div className="flex flex-row items-center justify-between mt-2 px-1">
                        <h1 className="font-semibold text-2xl text-left">{batch.products?.name}</h1>
                        <div className='flex flex-row '>
                            <button onClick={onRefresh} className="p-2 flex justify-center items-center rounded-[50%] cursor-pointer hover:bg-emerald-600 bg-emerald-500 text-sm text-white">
                                <RefreshCw />
                            </button>
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 hover:bg-slate-200 rounded-full cursor-pointer transition-colors"
                            >
                                <ChevronRight size={28} color="#4338ca" className="rotate-180" />
                            </button>
                        </div>
                    </div>

                    {location && (
                        <div className="flex flex-row items-center justify-center gap-2 bg-indigo-50 rounded-lg px-3 py-2">
                            <MapPin size={20} color="#4338ca" />
                            <span className="flex-1 text-sm text-indigo-800 text-right">
                                {location.warehouseName} · {location.sectionName} · {location.floorName}
                            </span>
                        </div>
                    )}

                    <div className="flex flex-row">
                        <div className="flex-1 flex flex-col gap-3">
                            <div className="flex flex-row items-center gap-3">
                                <Layers size={18} color="#4338ca" />
                                <div>
                                    <div className="text-slate-800 text-xs text-right">DCI</div>
                                    <div className="text-base text-slate-800 text-right">{batch.products?.dci}</div>
                                </div>
                            </div>

                            <div className="flex flex-row items-center gap-3">
                                <Hash size={18} color="#4338ca" />
                                <div>
                                    <div className="text-slate-800 text-xs text-right">LOT</div>
                                    <div className="text-base text-slate-800 text-right">{batch.lot}</div>
                                </div>
                            </div>

                            <div className="flex flex-row items-center gap-3">
                                <Calendar size={18} color="#4338ca" />
                                <div>
                                    <div className="text-slate-800 text-sm text-right">تاريخ نهاية الصلاحية</div>
                                    <div className="text-base text-slate-800 text-right">{formatMonthYear(batch.expiry_date)}</div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-col justify-center items-center flex-1 border-r border-slate-300 flex">
                            <span className="w-[30%] text-slate-600 text-xl text-center mb-2">الكمية</span>
                            <span className="text-5xl font-bold text-indigo-700 text-center">{batch.quantity}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={openEditModal}
                        className="flex flex-row items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl py-4 transition-colors cursor-pointer"
                    >
                        <Pencil size={18} color="#4338ca" />
                        <span className="text-indigo-700 font-medium text-base">تعديل</span>
                    </button>

                    <button
                        onClick={openTransferModal}
                        className="flex flex-row items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl py-4 transition-colors cursor-pointer"
                    >
                        <ArrowLeftRight size={18} color="#4338ca" />
                        <span className="text-indigo-700 font-medium text-base">نقل</span>
                    </button>

                    <button
                        onClick={handleDelete}
                        className="flex flex-row items-center justify-center gap-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl py-4 transition-colors cursor-pointer"
                    >
                        <Trash2 size={18} color="#dc2626" />
                        <span className="text-red-600 font-medium text-base">حذف</span>
                    </button>
                </div>
            </div>

            {editVisible && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
                    <div className="w-full max-w-2xl bg-white rounded-t-2xl p-5 flex flex-col gap-4 animate-in slide-in-from-bottom-full duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex flex-row items-center justify-between">
                            <h2 className="text-xl font-bold">تعديل الدواء</h2>
                            <button
                                onClick={() => setEditVisible(false)}
                                className="p-1 hover:bg-slate-100 rounded-full cursor-pointer transition-colors"
                            >
                                <X size={22} color="#64748b" />
                            </button>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-slate-700 text-md text-right">اسم الدواء</label>
                            <div className="flex flex-row items-center border border-slate-300 rounded-lg px-3 focus-within:border-indigo-500 focus-within:ring-1">
                                <input
                                    className="flex-1 py-2 text-base text-right bg-transparent outline-none"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                />
                                {editName.length > 0 && (
                                    <button onClick={() => setEditName('')} className="p-1 hover:bg-slate-100 rounded-full cursor-pointer">
                                        <X size={18} color="#64748b" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-slate-700 text-md text-right">DCI</label>
                            <div className="flex flex-row items-center border border-slate-300 rounded-lg px-3 focus-within:border-indigo-500 focus-within:ring-1">
                                <input
                                    className="flex-1 py-2 text-base text-right bg-transparent outline-none"
                                    value={editDci}
                                    onChange={(e) => setEditDci(e.target.value)}
                                />
                                {editDci.length > 0 && (
                                    <button onClick={() => setEditDci('')} className="p-1 hover:bg-slate-100 rounded-full cursor-pointer">
                                        <X size={18} color="#64748b" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-slate-700 text-md text-right">الكمية</label>
                            <div className="flex flex-row items-center border border-slate-300 rounded-lg px-3 focus-within:border-indigo-500 focus-within:ring-1">
                                <input
                                    type="number"
                                    className="flex-1 py-2 text-base text-right bg-transparent outline-none"
                                    value={editQuantity}
                                    onChange={(e) => setEditQuantity(e.target.value)}
                                />
                                {editQuantity.length > 0 && (
                                    <button onClick={() => setEditQuantity('')} className="p-1 hover:bg-slate-100 rounded-full cursor-pointer">
                                        <X size={18} color="#64748b" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-slate-700 text-md text-right">LOT</label>
                            <div className="flex flex-row items-center border border-slate-300 rounded-lg px-3 focus-within:border-indigo-500 focus-within:ring-1">
                                <input
                                    className="flex-1 py-2 text-base text-right bg-transparent outline-none"
                                    value={editLot}
                                    onChange={(e) => setEditLot(e.target.value)}
                                />
                                {editLot.length > 0 && (
                                    <button onClick={() => setEditLot('')} className="p-1 hover:bg-slate-100 rounded-full cursor-pointer">
                                        <X size={18} color="#64748b" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-slate-700 text-md text-right">تاريخ نهاية الصلاحية (شهر/سنة)</label>
                            <div className="flex flex-row gap-2">
                                <div className="flex-1 flex flex-row items-center border border-slate-300 rounded-lg px-3 focus-within:border-indigo-500 focus-within:ring-1">
                                    <input
                                        type="number"
                                        className="flex-1 py-2 text-base text-center bg-transparent outline-none"
                                        maxLength={2}
                                        placeholder="شهر"
                                        value={editExpiryMonth}
                                        onChange={(e) => setEditExpiryMonth(e.target.value)}
                                    />
                                    {editExpiryMonth.length > 0 && (
                                        <button onClick={() => setEditExpiryMonth('')} className="p-1 hover:bg-slate-100 rounded-full cursor-pointer">
                                            <X size={18} color="#64748b" />
                                        </button>
                                    )}
                                </div>
                                <div className="flex-1 flex flex-row items-center border border-slate-300 rounded-lg px-3 focus-within:border-indigo-500 focus-within:ring-1">
                                    <input
                                        type="number"
                                        className="flex-1 py-2 text-base text-center bg-transparent outline-none"
                                        maxLength={4}
                                        placeholder="سنة"
                                        value={editExpiryYear}
                                        onChange={(e) => setEditExpiryYear(e.target.value)}
                                    />
                                    {editExpiryYear.length > 0 && (
                                        <button onClick={() => setEditExpiryYear('')} className="p-1 hover:bg-slate-100 rounded-full cursor-pointer">
                                            <X size={18} color="#64748b" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleSaveEdit}
                            disabled={submitting}
                            className="bg-indigo-700 hover:bg-indigo-800 disabled:bg-indigo-400 rounded-xl py-3 flex items-center justify-center mt-2 cursor-pointer transition-colors shadow-sm"
                        >
                            <span className="text-white font-semibold">{submitting ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}</span>
                        </button>
                    </div>
                </div>
            )}

            {transferVisible && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
                    <div className="w-full max-w-2xl bg-white rounded-t-2xl p-5 flex flex-col gap-4 animate-in slide-in-from-bottom-full duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex flex-row items-center justify-between">
                            <h2 className="text-xl font-bold">نقل الدفعة</h2>
                            <button
                                onClick={() => setTransferVisible(false)}
                                className="p-1 hover:bg-slate-100 rounded-full cursor-pointer transition-colors"
                            >
                                <X size={22} color="#64748b" />
                            </button>
                        </div>

                        <span className="text-slate-700 text-md text-right">
                            المتاح: {batch.quantity} وحدة
                        </span>

                        <div className="flex flex-col gap-1">
                            <label className="text-slate-700 text-md text-right">الكمية المراد نقلها</label>
                            <div className="flex flex-row items-center border border-slate-300 rounded-lg px-3 focus-within:border-indigo-500 focus-within:ring-1">
                                <input
                                    type="number"
                                    className="flex-1 py-2 text-base text-right bg-transparent outline-none"
                                    value={transferQuantity}
                                    onChange={(e) => setTransferQuantity(e.target.value)}
                                />
                                {transferQuantity.length > 0 && (
                                    <button onClick={() => setTransferQuantity('')} className="p-1 hover:bg-slate-100 rounded-full cursor-pointer">
                                        <X size={18} color="#64748b" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-slate-700 text-md text-right">المستودع الوجهة</label>
                            {otherWarehouses.map((w) => (
                                <button
                                    key={w.id}
                                    onClick={() => setTransferTargetWarehouseId(w.id)}
                                    className={`flex flex-row items-center justify-between border rounded-lg px-3 py-3 cursor-pointer transition-colors ${transferTargetWarehouseId === w.id
                                            ? 'border-indigo-600 bg-indigo-50'
                                            : 'border-slate-300 hover:bg-slate-50'
                                        }`}
                                >
                                    <span className="text-base text-right w-full">{w.name}</span>
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-slate-700 text-md text-right">ملاحظة (اختياري)</label>
                            <div className="flex flex-row items-start border border-slate-300 rounded-lg px-3 py-2 focus-within:border-indigo-500 focus-within:ring-1">
                                <textarea
                                    className="flex-1 text-base text-right bg-transparent outline-none resize-none min-h-[60px]"
                                    value={transferNote}
                                    onChange={(e) => setTransferNote(e.target.value)}
                                />
                                {transferNote.length > 0 && (
                                    <button onClick={() => setTransferNote('')} className="p-1 hover:bg-slate-100 rounded-full cursor-pointer mt-0.5">
                                        <X size={18} color="#64748b" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={handleConfirmTransfer}
                            disabled={submitting || !transferTargetWarehouseId}
                            className="bg-indigo-700 hover:bg-indigo-800 disabled:bg-indigo-400 rounded-xl py-3 flex items-center justify-center mt-2 cursor-pointer transition-colors shadow-sm"
                        >
                            <span className="text-white font-semibold">{submitting ? 'جارٍ النقل...' : 'تأكيد النقل'}</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}