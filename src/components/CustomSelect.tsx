'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

interface SelectOption {
  code: string;
  name: string;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  error?: string;
}

export default function CustomSelect({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  disabled = false,
  isLoading = false,
  error,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.code === value);

  const filteredOptions = options.filter(opt =>
    opt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opt.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: string) => {
    onChange(code);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`relative px-[10px] py-[7px] border rounded-[5px] text-[12px] text-[#1a2236] bg-white cursor-pointer transition-all ${
          isOpen ? 'border-[#3a7bd5] shadow-[0_0_0_2px_rgba(58,123,213,0.15)]' : 'border-[#d1d5db]'
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-[#f3f4f6]' : 'hover:border-[#3a7bd5]'} ${error ? 'border-[#e53e3e]' : ''}`}
        onClick={() => !disabled && !isLoading && setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <span className={selectedOption ? 'text-[#1a2236]' : 'text-[#9ca3af]'}>
            {isLoading ? 'Loading...' : selectedOption ? selectedOption.name : placeholder}
          </span>
          <div className="flex items-center gap-2">
            {selectedOption && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[#9ca3af] hover:text-[#6b7280] transition-colors"
              >
                <X size={14} />
              </button>
            )}
            <ChevronDown size={16} className={`text-[#6b7280] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </div>

      {isOpen && !disabled && !isLoading && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-[#d1d5db] rounded-[5px] shadow-lg max-h-60 overflow-auto">
          <div className="p-2 border-b border-[#e5e7eb]">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-2 py-1 text-[11px] border border-[#d1d5db] rounded-[4px] focus:outline-none focus:border-[#3a7bd5]"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          {filteredOptions.length === 0 ? (
            <div className="p-3 text-[11px] text-[#6b7280] text-center">No options found</div>
          ) : (
            filteredOptions.map((option) => (
              <div
                key={option.code}
                className={`px-3 py-2 text-[11px] cursor-pointer transition-colors flex items-center justify-between ${
                  option.code === value ? 'bg-[#e8f0fe] text-[#1a4a8a]' : 'hover:bg-[#f8fafd] text-[#1a2236]'
                }`}
                onClick={() => handleSelect(option.code)}
              >
                <span>{option.name}</span>
                {option.code === value && <Check size={14} className="text-[#1a4a8a]" />}
              </div>
            ))
          )}
        </div>
      )}

      {error && (
        <div className="text-[10px] text-[#e53e3e] mt-[2px]">{error}</div>
      )}
    </div>
  );
}
