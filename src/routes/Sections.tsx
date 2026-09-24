import { useWarehouseContext } from '../context/warehouseContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Lottie } from 'lottie-react';
import { ChevronRight, Layers, Package, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import chatbotAnimation from '../assets/animations/chatbot.json';
import errorAnimation from '../assets/animations/Error.json';

const COLOR_OPTIONS = [
    { label: 'أبيض', value: 'bg-white' },
    { label: 'برتقالي', value: 'bg-orange-100' },
    { label: 'أصفر', value: 'bg-yellow-100' },
    { label: 'أزرق', value: 'bg-blue-100' },
    { label: 'أخضر', value: 'bg-green-100' },
    { label: 'وردي', value: 'bg-pink-100' },
    { label: 'بنفسجي', value: 'bg-purple-100' },
    { label: 'أحمر', value: 'bg-red-100' },
    { label: 'رمادي', value: 'bg-slate-200' },
    { label: 'سماوي', value: 'bg-cyan-100' },
    { label: 'ليموني', value: 'bg-lime-100' },
];

export default function Sections() {
    const { selectedWarehouse, loading, error, refresh } = useWarehouseContext();
    const navigate = useNavigate();

    const [addVisible, setAddVisible] = useState(false);
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState(COLOR_OPTIONS[0].value);
    const [submitting, setSubmitting] = useState(false);

    const [editVisible, setEditVisible] = useState(false);
    const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editColor, setEditColor] = useState(COLOR_OPTIONS[0].value);

    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refresh();
        setRefreshing(false);
    }, [refresh]);

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

    const sections = selectedWarehouse?.sections ?? [];

    const totalProducts = new Set(
        sections.flatMap((section) =>
            (section.floors ?? []).flatMap((floor) =>
                (floor.stock_batches ?? []).map((batch) => batch.products?.name)
            )
        )
    ).size;

    const openAddModal = () => {
        setNewName('');
        setNewColor(COLOR_OPTIONS[0].value);
        setAddVisible(true);
    };

    const handleAddSection = async () => {
        if (!newName.trim()) {
            alert('اسم مفقود: يرجى إدخال اسم القسم.');
            return;
        }
        if (!selectedWarehouse) return;

        setSubmitting(true);
        const { error: insertError } = await supabase.from('sections').insert({
            warehouse_id: selectedWarehouse.id,
            name: newName.trim(),
            color: newColor,
        });
        setSubmitting(false);

        if (insertError) {
            alert(`خطأ: ${insertError.message}`);
            return;
        }

        setAddVisible(false);
        refresh();
    };

    const openEditModal = (item: (typeof sections)[number]) => {
        setEditingSectionId(item.id);
        setEditName(item.name);
        setEditColor(item.color ?? COLOR_OPTIONS[0].value);
        setEditVisible(true);
    };

    const handleSaveEdit = async () => {
        if (!editName.trim() || !editingSectionId) {
            alert('اسم مفقود: يرجى إدخال اسم القسم.');
            return;
        }

        setSubmitting(true);
        const { error: updateError } = await supabase
            .from('sections')
            .update({ name: editName.trim(), color: editColor })
            .eq('id', editingSectionId);
        setSubmitting(false);

        if (updateError) {
            alert(`خطأ: ${updateError.message}`);
            return;
        }

        setEditVisible(false);
        refresh();
    };

    const handleDeleteSection = async (item: (typeof sections)[number]) => {
        const isConfirmed = window.confirm(
            `حذف هذا القسم؟\nسيتم حذف "${item.name}" وجميع الطوابق و الادوية الموجودة بداخله نهائيًا.`
        );

        if (isConfirmed) {
            const { error: deleteError } = await supabase.from('sections').delete().eq('id', item.id);
            if (deleteError) {
                alert(`خطأ: ${deleteError.message}`);
            } else {
                refresh();
            }
        }
    };

    return (
        <div className="w-full h-screen bg-white p-4 font-sans" dir="rtl">
            <div className=" w-full h-full flex flex-col justify-between  gap-4">
                <div className="flex flex-col gap-4 mb-2">
                    <div className="flex flex-row items-center justify-between mt-2 px-1">
                        <h1 className="font-semibold text-2xl">الأقسام</h1>
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-slate-200 rounded-full cursor-pointer transition-colors"
                        >
                            <ChevronRight size={28} color="#4338ca" className="rotate-180" />
                        </button>
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
                                <div className="text-slate-700 text-base text-left">الأقسام</div>
                                <div className="text-2xl font-bold mt-2 text-left">{sections.length}</div>
                            </div>
                        </div>

                    </div>
                </div>

                <div className="flex w-full flex-1 bg-indigo-50 rounded-lg p-4 flex-col gap-4 border border-slate-400 overflow-y-auto  custom-scroll ">
                    {sections.map((item) => {
                        const distinctProductCount = new Set(
                            (item.floors ?? []).flatMap((floor) =>
                                (floor.stock_batches ?? []).map((batch) => batch.products?.name)
                            )
                        ).size;

                        return (
                            <div
                                key={item.id}
                                onClick={() => navigate(`/sections/${item.id}`)}
                                className={`rounded-xl  shadow-sm cursor-pointer ${item.color ?? 'bg-slate-100'}`}
                            >
                                <div className="flex flex-row items-center justify-between px-4 py-5  transition-colors">
                                    <div className="w-[90%] flex flex-row justify-between items-center gap-2">
                                        <div className="flex w-[50%] flex-col">
                                            <span className="text-lg font-medium">{item.name}</span>
                                            <span className="text-md text-slate-700">اضغط لمزيد من المعلومات</span>
                                        </div>
                                        <div className="flex w-[50%] justify-end h-full flex-row items-center">
                                            <span className="flex-1 text-slate-800 text-left">{distinctProductCount} أدوية</span>
                                        </div>
                                    </div>
                                    <div className="w-[10%] h-full flex flex-row justify-end items-center">
                                        <ChevronRight size={26} color="#4338ca" className="rotate-180" />
                                    </div>
                                </div>

                                <div className="flex flex-row gap-2 px-4 pb-3 justify-end">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openEditModal(item);
                                        }}
                                        className="flex flex-row items-center gap-1 border border-indigo-500  hover:bg-indigo-100 rounded-lg px-4 py-3 cursor-pointer "
                                    >
                                        <Pencil size={14} color="#4338ca" />
                                        <span className=" text-sm font-semibold">تعديل</span>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteSection(item);
                                        }}
                                        className="flex flex-row items-center gap-1 border border-red-500 bg-white hover:bg-red-100   rounded-lg px-4 py-3 cursor-pointer transition-colors"
                                    >
                                        <Trash2 size={14} color="#dc2626" />
                                        <span className="text-red-600 text-sm font-semibold">حذف</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <button
                    onClick={openAddModal}
                    className="w-full flex flex-col justify-center items-center bg-indigo-500 hover:bg-indigo-600 min-h-20 rounded-md mt-2 cursor-pointer transition-colors shadow-sm"
                >
                    <Plus size={36} color="#FFFFFF" />
                </button>
            </div>

            {addVisible && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
                    <div className="w-full max-w-2xl bg-white rounded-t-2xl p-5 flex flex-col gap-4 animate-in slide-in-from-bottom-full duration-200">
                        <div className="flex flex-row items-center justify-between">
                            <h2 className="text-xl font-bold">قسم جديد</h2>
                            <button onClick={() => setAddVisible(false)} className="p-1 hover:bg-slate-100 rounded-full cursor-pointer">
                                <X size={22} color="#64748b" />
                            </button>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-slate-700 text-md">اسم القسم</label>
                            <div className="flex flex-row items-center border border-slate-300 rounded-lg px-3 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 bg-white">
                                <input
                                    className="flex-1 py-2 text-base bg-transparent outline-none"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="..."
                                    autoFocus
                                />
                                {newName.length > 0 && (
                                    <button onClick={() => setNewName('')} className="p-1 cursor-pointer hover:bg-slate-100 rounded-full">
                                        <X size={18} color="#64748b" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-slate-700 text-md"> اللون ( اختياري ) </span>
                            <div className="flex flex-row flex-wrap gap-2">
                                {COLOR_OPTIONS.map((c) => (
                                    <button
                                        key={c.value}
                                        onClick={() => setNewColor(c.value)}
                                        className={`w-14 h-14 items-center justify-center rounded-lg border-2 cursor-pointer transition-colors ${c.value} ${newColor === c.value ? 'border-indigo-600 shadow-sm' : 'border-transparent hover:border-slate-300'
                                            }`}
                                        type="button"
                                        aria-label={`اختر اللون ${c.label}`}
                                    />
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleAddSection}
                            disabled={submitting}
                            className="bg-indigo-700 hover:bg-indigo-800 disabled:bg-indigo-400 rounded-xl py-3 flex items-center justify-center mt-2 cursor-pointer transition-colors shadow-sm"
                        >
                            <span className="text-white font-semibold">{submitting ? 'جارٍ الإضافة...' : 'إضافة قسم'}</span>
                        </button>
                    </div>
                </div>
            )}

            {editVisible && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
                    <div className="w-full max-w-2xl bg-white rounded-t-2xl p-5 flex flex-col gap-4 animate-in slide-in-from-bottom-full duration-200">
                        <div className="flex flex-row items-center justify-between">
                            <h2 className="text-xl font-bold">تعديل القسم</h2>
                            <button onClick={() => setEditVisible(false)} className="p-1 hover:bg-slate-100 rounded-full cursor-pointer">
                                <X size={22} color="#64748b" />
                            </button>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-slate-700 text-md">اسم القسم</label>
                            <div className="flex flex-row items-center border border-slate-300 rounded-lg px-3 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 bg-white">
                                <input
                                    className="flex-1 py-2 text-base bg-transparent outline-none"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    autoFocus
                                />
                                {editName.length > 0 && (
                                    <button onClick={() => setEditName('')} className="p-1 cursor-pointer hover:bg-slate-100 rounded-full">
                                        <X size={18} color="#64748b" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-slate-700 text-md">اللون ( اختياري ) </span>
                            <div className="flex flex-row flex-wrap gap-2">
                                {COLOR_OPTIONS.map((c) => (
                                    <button
                                        key={c.value}
                                        onClick={() => setEditColor(c.value)}
                                        className={`w-14 h-14 items-center justify-center rounded-lg border-2 cursor-pointer transition-colors ${c.value} ${editColor === c.value ? 'border-indigo-600 shadow-sm' : 'border-transparent hover:border-slate-300'
                                            }`}
                                        type="button"
                                        aria-label={`اختر اللون ${c.label}`}
                                    />
                                ))}
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
        </div>
    );
}