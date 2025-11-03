import React, { useState, useRef, useEffect } from 'react'
import { Clock } from 'lucide-react'

interface TimePickerProps {
  value?: string // Format: "HH:MM" (24-hour format)
  onChange: (time: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  format?: '12' | '24' // 12-hour or 24-hour format
  minuteStep?: number // Step for minutes (e.g., 15 for 15-minute intervals)
}

const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select time',
  disabled = false,
  className = '',
  format = '12',
  minuteStep = 15
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedHour, setSelectedHour] = useState<number>(9) // Default to 9 AM
  const [selectedMinute, setSelectedMinute] = useState<number>(0)
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Initialize selected values from prop
  useEffect(() => {
    if (value) {
      const [hours, minutes] = value.split(':').map(Number)
      if (format === '12') {
        const period = hours >= 12 ? 'PM' : 'AM'
        const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
        setSelectedHour(displayHour)
        setSelectedPeriod(period)
      } else {
        setSelectedHour(hours)
      }
      setSelectedMinute(minutes)
    }
  }, [value, format])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const formatTime = (time: string) => {
    if (!time) return ''
    
    const [hours, minutes] = time.split(':').map(Number)
    
    if (format === '12') {
      const period = hours >= 12 ? 'PM' : 'AM'
      const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
      return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  const generateTimeString = () => {
    let hour = selectedHour
    
    if (format === '12') {
      if (selectedPeriod === 'PM' && selectedHour !== 12) {
        hour = selectedHour + 12
      } else if (selectedPeriod === 'AM' && selectedHour === 12) {
        hour = 0
      }
    }
    
    return `${hour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`
  }

  const handleTimeSelect = () => {
    const timeString = generateTimeString()
    onChange(timeString)
    setIsOpen(false)
  }

  const generateHours = () => {
    if (format === '12') {
      return Array.from({ length: 12 }, (_, i) => i + 1)
    }
    return Array.from({ length: 24 }, (_, i) => i)
  }

  const generateMinutes = () => {
    const minutes = []
    for (let i = 0; i < 60; i += minuteStep) {
      minutes.push(i)
    }
    return minutes
  }

  const getCommonTimes = () => {
    const times = [
      { label: '9:00 AM', value: '09:00' },
      { label: '10:00 AM', value: '10:00' },
      { label: '11:00 AM', value: '11:00' },
      { label: '12:00 PM', value: '12:00' },
      { label: '1:00 PM', value: '13:00' },
      { label: '2:00 PM', value: '14:00' },
      { label: '3:00 PM', value: '15:00' },
      { label: '4:00 PM', value: '16:00' },
      { label: '5:00 PM', value: '17:00' }
    ]
    
    return format === '24' 
      ? times.map(t => ({ ...t, label: t.value }))
      : times
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Input Field */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-3 sm:px-4 py-2 sm:py-2.5 text-left bg-white border-interactive rounded-md shadow-sm
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
          disabled:bg-gray-100 disabled:cursor-not-allowed
          transition-colors duration-200
          flex items-center justify-between
          text-sm sm:text-base min-h-[48px]
        `}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-500'}>
          {value ? formatTime(value) : placeholder}
        </span>
        <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
      </button>

      {/* Dropdown Time Picker */}
      {isOpen && (
        <div className="absolute z-50 mt-1 bg-white border-standard rounded-md shadow-lg p-3 sm:p-4 min-w-[280px] sm:min-w-[320px] max-w-[95vw]">
          {/* Quick Time Selection */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Common Times</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
              {getCommonTimes().map(time => (
                <button
                  key={time.value}
                  type="button"
                  onClick={() => {
                    onChange(time.value)
                    setIsOpen(false)
                  }}
                  className="btn-secondary px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm"
                >
                  {time.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-light pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Custom Time</h4>
            
            {/* Time Selectors */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Hour Selector */}
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Hour</label>
                <select
                  value={selectedHour}
                  onChange={(e) => setSelectedHour(Number(e.target.value))}
                  className="input-primary text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 min-h-[40px] sm:min-h-[44px]"
                >
                  {generateHours().map(hour => (
                    <option key={hour} value={hour}>
                      {format === '24' ? hour.toString().padStart(2, '0') : hour}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-gray-500 mt-5 text-sm sm:text-base">:</div>

              {/* Minute Selector */}
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Minute</label>
                <select
                  value={selectedMinute}
                  onChange={(e) => setSelectedMinute(Number(e.target.value))}
                  className="input-primary text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 min-h-[40px] sm:min-h-[44px]"
                >
                  {generateMinutes().map(minute => (
                    <option key={minute} value={minute}>
                      {minute.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>

              {/* AM/PM Selector for 12-hour format */}
              {format === '12' && (
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Period</label>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value as 'AM' | 'PM')}
                    className="input-primary text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 min-h-[40px] sm:min-h-[44px]"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 sm:space-x-3 mt-3 sm:mt-4">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="btn-secondary text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTimeSelect}
                className="btn-primary px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm"
              >
                Select
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TimePicker