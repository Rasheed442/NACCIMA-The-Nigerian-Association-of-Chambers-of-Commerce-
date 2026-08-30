'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Calendar } from 'lucide-react';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export default function DatePicker({ value, onChange, placeholder = 'Select date', required, className = '' }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleDateSelect = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const formattedDate = `${year}-${month}-${dayStr}`;
    onChange(formattedDate);
    setIsOpen(false);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();
    
    const days = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const isToday = (day: number | null) => {
    if (!day) return false;
    const today = new Date();
    return day === today.getDate() && 
           currentMonth.getMonth() === today.getMonth() && 
           currentMonth.getFullYear() === today.getFullYear();
  };

  const isSelected = (day: number | null) => {
    if (!day || !value) return false;
    const selectedDate = new Date(value);
    return day === selectedDate.getDate() && 
           currentMonth.getMonth() === selectedDate.getMonth() && 
           currentMonth.getFullYear() === selectedDate.getFullYear();
  };

  const days = getDaysInMonth(currentMonth);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div
        className="w-full px-3 py-2 border border-[#d1d5db] rounded-[4px] text-[13px] flex items-center justify-between cursor-pointer hover:border-[#1a4a8a] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={value ? 'text-[#1a2236]' : 'text-[#9ca3af]'}>
          {value ? formatDate(value) : placeholder}
        </span>
        <Calendar size={16} className="text-[#6b7280]" />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-[#d1d5db] rounded-[4px] shadow-lg z-50 p-3 min-w-[280px]">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => navigateMonth('prev')}
              className="p-1 hover:bg-[#f3f4f9] rounded"
            >
              ‹
            </button>
            <span className="text-[13px] font-semibold text-[#1a2236]">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button
              type="button"
              onClick={() => navigateMonth('next')}
              className="p-1 hover:bg-[#f3f4f9] rounded"
            >
              ›
            </button>
          </div>

          {/* Day Names */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-[10px] font-medium text-[#6a7a9a] text-center">
                {day}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => (
              <button
                key={index}
                type="button"
                disabled={!day}
                onClick={() => day && handleDateSelect(day)}
                className={`
                  h-7 text-[12px] rounded transition-colors
                  ${!day ? 'pointer-events-none' : 'hover:bg-[#f3f4f9] cursor-pointer'}
                  ${isToday(day) ? 'bg-[#1a4a8a] text-white hover:bg-[#153c70]' : ''}
                  ${isSelected(day) && !isToday(day) ? 'bg-[#e0f2fe] text-[#0369a1]' : ''}
                  ${!isToday(day) && !isSelected(day) ? 'text-[#1a2236]' : ''}
                `}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
