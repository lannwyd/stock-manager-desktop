import  { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

type DropdownItem = { label: string; value: string };

type Props = {
    options: DropdownItem[];
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
};

export default function DropdownComponent({ options, value, onChange, placeholder = 'اختر...' }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedLabel = options.find((opt) => opt.value === value)?.label || placeholder;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className="relative w-full font-sans" ref={dropdownRef} dir="rtl">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between px-3 h-[50px] bg-white border rounded-lg transition-colors focus:outline-none ${isOpen ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-300 hover:border-slate-400'
                    }`}
            >
                <span className={`text-base ${value ? 'text-slate-900' : 'text-slate-500'}`}>
                    {selectedLabel}
                </span>
                <ChevronDown
                    size={20}
                    className={`transition-transform duration-250 ease-in-out ${isOpen ? 'rotate-180 text-indigo-600' : 'text-slate-700'
                        }`}
                />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-[300px] overflow-auto animate-in fade-in zoom-in-95 duration-100">
                    <ul className="py-1 m-0 list-none">
                        {options.map((option) => (
                            <li
                                key={option.value}
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`px-4 py-3 cursor-pointer transition-colors ${value === option.value
                                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                                        : 'text-slate-700 hover:bg-slate-100'
                                    }`}
                            >
                                {option.label}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}