import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface CustomDropdownProps {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onBlur?: () => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  icon: React.ComponentType<{ className?: string }>;
  error?: string | null;
  disabled?: boolean;
  required?: boolean;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({ 
  id, 
  value, 
  onChange, 
  onBlur, 
  options, 
  placeholder = "Select option",
  icon: Icon,
  error,
  disabled = false,
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredValue, setHoveredValue] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (onBlur) onBlur();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onBlur]);

  const handleSelect = (optionValue: string) => {
    // Create a synthetic event that matches React.ChangeEvent<HTMLSelectElement>
    const syntheticEvent = {
      target: { value: optionValue }
    } as React.ChangeEvent<HTMLSelectElement>;
    
    onChange(syntheticEvent);
    setIsOpen(false);
    setHoveredValue(null);
    if (onBlur) onBlur();
  };

  const selectedOption = options.find(opt => opt.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  return (
    <div className="relative" ref={dropdownRef}>
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 z-10 pointer-events-none" />
      
      <button
        type="button"
        id={id}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full pl-10 pr-10 py-3 border rounded-lg bg-white text-left text-slate-900 flex items-center justify-between text-sm ${
          error ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-slate-400'} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
        disabled={disabled}
        aria-required={required}
      >
        <span className={!value ? 'text-slate-400' : ''}>{displayText}</span>
        <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg overflow-hidden">
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => handleSelect(option.value)}
              onMouseEnter={() => setHoveredValue(option.value)}
              onMouseLeave={() => setHoveredValue(null)}
              className={`px-4 py-3 cursor-pointer transition-colors text-sm ${
                hoveredValue === option.value
                  ? 'bg-[#10142c] text-white'
                  : 'text-slate-900 bg-white'
              }`}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;