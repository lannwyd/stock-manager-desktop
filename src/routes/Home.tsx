
import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Lottie } from 'lottie-react';
import { ChevronLeft, Dot, Layers, Package } from 'lucide-react';
import { useWarehouseContext } from '../context/warehouseContext';
import { useHistory } from '../hooks/useHistory';
import DropdownComponent from '../components/shared/DropdownComponent';
import chatbotAnim from '../assets/animations/chatbot.json';
import errorAnim from '../assets/animations/Error.json';

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

    const onRefresh = useCallback(async () => {
        await Promise.all([refresh(), refetchHistory()]);
    }, [refresh, refetchHistory]);

    if (warehousesLoading || historyLoading) {
        return (
            <div className="flex-1 h-screen flex flex-col items-center justify-center bg-indigo-50">
                <Lottie src={chatbotAnim} loop style={{ width: 200, height: 200 }} />
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

    return (
        <div className=" w-full  h-screen flex flex-col p-4 gap-4 bg-white rounded-lg shadow shadow-black/10 border border-black/20 ">
            <div className="flex flex-row gap-2">
                <div className="flex-1">
                    <DropdownComponent
                        options={dropdownOptions}
                        value={selectedWarehouse?.id}
                        onChange={(value: string) => setSelectedWarehouseId(value)}
                    />
                </div>

                <button onClick={onRefresh} className="w-fit px-6 rounded-md cursor-pointer hover:bg-emerald-600 bg-emerald-500 text-sm text-white">
                    تحديث
                </button>
                <Link to="/meds" className="bg-indigo-500 rounded-xl w-fit px-6 flex items-center cursor-pointer hover:bg-indigo-600 text-sm text-white">
                    قائمة الأدوية
                </Link>
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

            <div className="bg-white rounded-xl border border-slate-400 p-4 flex flex-col gap-3">
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
                                <div className={`flex flex-row items-center rounded-xl justify-between px-4 py-5 ${item.color ?? 'bg-slate-100'} hover:opacity-90 cursor-pointer`}>
                                    <div className="flex-1 flex flex-row justify-between items-center gap-2">
                                        <div className="flex  gap-2 flex-col">
                                            <span className="text-lg font-medium text-right">{item.name}</span>
                                            <span className="text-sm text-slate-700 text-right">اضغط لمزيد من المعلومات</span>
                                        </div>

                                    </div>
                                    <div className='flex flex-row'>
                                        <div className="flex flex-row  items-center">
                                            <span className="flex-1 text-slate-600 text-right">{distinctProductCount} أدوية</span>
                                        </div>
                                        <div className=" h-full flex flex-row justify-end items-center">
                                            <ChevronLeft size={26} color="#4338ca" />
                                        </div>
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

            <div className="flex flex-col gap-4">
                {historyItems.length === 0 ? (
                    <div className=" h-full flex flex-col items-center justify-center bg-white px-4 py-8 ">
                        <span className="text-base font-medium text-slate-500">
                            لا توجد عناصر في السجل
                        </span>
                    </div>
                ) : (
                    historyItems.slice(0, 3).map((item: any) => (
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
                                <div className="text-sm text-slate-500 text-right">
                                    {item.from_warehouse?.name ?? 'N/A'} ← {item.to_warehouse?.name ?? 'N/A'} · {new Date(item.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}