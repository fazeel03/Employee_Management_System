import React, { useState, useMemo } from 'react';

const AttendanceCalendar = ({ attendanceData, loading = false }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Format date to YYYY-MM-DD
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Transform attendance data into date-status map
  const attendanceMap = useMemo(() => {
    if (!attendanceData || attendanceData.length === 0) return {};
    
    const map = {};
    attendanceData.forEach(record => {
      if (record.attendance_date && record.attendance_status) {
        const date = new Date(record.attendance_date);
        const dateKey = formatDate(date);
        map[dateKey] = record.attendance_status;
      }
    });
    return map;
  }, [attendanceData]);

  // Get calendar data for current month
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of month
    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday
    
    // Last day of month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Generate calendar grid
    const days = [];
    
    // Empty cells before first day
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = formatDate(date);
      const status = attendanceMap[dateKey] || null;
      
      days.push({
        day,
        date,
        dateKey,
        status,
        isToday: formatDate(new Date()) === dateKey
      });
    }
    
    return days;
  }, [currentDate, attendanceMap]);

  // Navigate months
  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get status color (HROne-style subtle filled circles)
  const getStatusColor = (status) => {
    switch (status) {
      case 'Present':
        return 'bg-green-200 text-green-800';
      case 'Absent':
        return 'bg-red-200 text-red-700';
      case 'Leave':
        return 'bg-orange-200 text-orange-700';
      default:
        return 'text-gray-600';
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Present':
        return 'bg-green-100 text-green-800';
      case 'Absent':
        return 'bg-red-100 text-red-800';
      case 'Leave':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Month/Year display
  const monthYear = currentDate.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow border-t-4 border-yellow-500 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Calendar</h3>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!attendanceData || attendanceData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow border-t-4 border-yellow-500 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Calendar</h3>
        <div className="flex items-center justify-center h-64 text-gray-400">
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">No attendance data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow border-t-4 border-yellow-500 p-4 w-full max-w-sm">
      {/* Compact Header: Month Navigation */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <button
          onClick={previousMonth}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          aria-label="Previous month"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h4 className="text-sm font-semibold text-gray-900 min-w-[120px] text-center">{monthYear}</h4>
        
        <button
          onClick={nextMonth}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          aria-label="Next month"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        
        <button
          onClick={goToToday}
          className="ml-1 px-2 py-0.5 text-[10px] font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
        >
          Today
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <div key={`${day}-${index}`} className="text-center text-[10px] text-gray-400 font-medium">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {calendarData.map((dayData, index) => {
          if (!dayData) {
            return <div key={`empty-${index}`} className="w-8 h-8"></div>;
          }

          const { day, dateKey, status, isToday } = dayData;
          const hasStatus = status !== null;

          return (
            <div
              key={dateKey}
              className="relative group flex justify-center"
            >
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
                  transition-all duration-150 cursor-pointer hover:scale-110
                  ${hasStatus ? getStatusColor(status) : 'text-gray-600 hover:bg-gray-100'}
                  ${isToday ? 'ring-2 ring-blue-500' : ''}
                `}
              >
                {day}
              </div>
              
              {/* Tooltip */}
              {hasStatus && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  <div className="font-semibold">{dateKey}</div>
                  <div className={`inline-block px-2 py-1 rounded mt-1 ${getStatusBadgeColor(status)}`}>
                    {status}
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                    <div className="border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Legend Below Grid */}
      <div className="flex flex-wrap gap-2 text-[10px] text-gray-500 mt-3 justify-center">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <span>Today</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-200 border border-green-300"></div>
          <span>Present</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-orange-200 border border-orange-300"></div>
          <span>Leave</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-200 border border-red-300"></div>
          <span>Absent</span>
        </div>
      </div>
    </div>
  );
};

export default AttendanceCalendar;
