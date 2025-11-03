import React, { useState, useEffect } from 'react'
import CalendarDropdown from './CalendarDropdown'
import TimePicker from './TimePicker'

interface DateTimePickerProps {
  value?: Date
  onChange: (date: Date) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  minDate?: Date
  maxDate?: Date
  timeFormat?: '12' | '24'
  minuteStep?: number
  showTime?: boolean
  dateOnly?: boolean
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select date and time',
  disabled = false,
  className = '',
  minDate,
  maxDate,
  timeFormat = '12',
  minuteStep = 15,
  showTime = true,
  dateOnly = false
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(value)
  const [selectedTime, setSelectedTime] = useState<string>('')

  // Initialize time from value
  useEffect(() => {
    if (value) {
      setSelectedDate(value)
      const hours = value.getHours().toString().padStart(2, '0')
      const minutes = value.getMinutes().toString().padStart(2, '0')
      setSelectedTime(`${hours}:${minutes}`)
    }
  }, [value])

  const handleDateChange = (date: Date) => {
    setSelectedDate(date)
    
    if (dateOnly) {
      // For date-only mode, set time to start of day
      const newDateTime = new Date(date)
      newDateTime.setHours(0, 0, 0, 0)
      onChange(newDateTime)
    } else if (selectedTime) {
      // Combine selected date with existing time
      const [hours, minutes] = selectedTime.split(':').map(Number)
      const newDateTime = new Date(date)
      newDateTime.setHours(hours, minutes, 0, 0)
      onChange(newDateTime)
    } else {
      // Set default time to 9:00 AM if no time selected
      const newDateTime = new Date(date)
      newDateTime.setHours(9, 0, 0, 0)
      setSelectedTime('09:00')
      onChange(newDateTime)
    }
  }

  const handleTimeChange = (time: string) => {
    setSelectedTime(time)
    
    if (selectedDate) {
      const [hours, minutes] = time.split(':').map(Number)
      const newDateTime = new Date(selectedDate)
      newDateTime.setHours(hours, minutes, 0, 0)
      onChange(newDateTime)
    }
  }

  const formatDateTime = (date: Date) => {
    if (dateOnly) {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }

    const dateStr = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })

    const timeStr = timeFormat === '12'
      ? date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
      : date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })

    return `${dateStr} at ${timeStr}`
  }

  if (dateOnly) {
    return (
      <CalendarDropdown
        value={selectedDate}
        onChange={handleDateChange}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        minDate={minDate}
        maxDate={maxDate}
      />
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Combined Display (when both date and time are selected) */}
      {selectedDate && selectedTime && (
        <div className="p-3 bg-primary-50 border border-primary-200 rounded-md">
          <div className="text-sm text-primary-800 font-medium">
            Selected: {formatDateTime(selectedDate)}
          </div>
        </div>
      )}

      {/* Date and Time Pickers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Date Picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <CalendarDropdown
            value={selectedDate}
            onChange={handleDateChange}
            placeholder="Select date"
            disabled={disabled}
            minDate={minDate}
            maxDate={maxDate}
          />
        </div>

        {/* Time Picker */}
        {showTime && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time
            </label>
            <TimePicker
              value={selectedTime}
              onChange={handleTimeChange}
              placeholder="Select time"
              disabled={disabled || !selectedDate}
              format={timeFormat}
              minuteStep={minuteStep}
            />
          </div>
        )}
      </div>

      {/* Helper Text */}
      {!selectedDate && (
        <p className="text-sm text-gray-500">
          Please select a date first
        </p>
      )}
      
      {selectedDate && showTime && !selectedTime && (
        <p className="text-sm text-gray-500">
          Please select a time
        </p>
      )}
    </div>
  )
}

export default DateTimePicker