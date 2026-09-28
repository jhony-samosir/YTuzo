import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

interface CalendarPickerProps {
  startDate?: Date | null;
  endDate?: Date | null;
  mode?: 'single' | 'range';
  onDayPress: (date: Date) => void;
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
}

export const CalendarPicker: React.FC<CalendarPickerProps> = ({ startDate, endDate, mode = 'single', onDayPress, currentMonth, setCurrentMonth }) => {
  const [calendarMode, setCalendarMode] = useState<'DATE' | 'MONTH'>('DATE');

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  if (calendarMode === 'MONTH') {
    return (
      <View style={localStyles.calContainer}>
        <View style={localStyles.calNavRow}>
          <TouchableOpacity onPress={() => setCurrentMonth(new Date(year - 1, month, 1))}>
            <Ionicons name="chevron-back" size={20} color={Colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setCalendarMode('DATE')}>
            <Text style={localStyles.calMonthNavText}>{year}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setCurrentMonth(new Date(year + 1, month, 1))}>
            <Ionicons name="chevron-forward" size={20} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>
        <View style={localStyles.calGrid}>
          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, idx) => (
            <TouchableOpacity 
              key={m} 
              style={[localStyles.calMonthBtn, month === idx && localStyles.calDaySelected]}
              onPress={() => {
                setCurrentMonth(new Date(year, idx, 1));
                setCalendarMode('DATE');
              }}
            >
              <Text style={[localStyles.calMonthBtnText, month === idx && localStyles.calDayTextSelected]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(<View key={`empty-${i}`} style={localStyles.calDay} />);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const thisDate = new Date(year, month, i).getTime();
    const sTime = startDate ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime() : null;
    const eTime = endDate ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()).getTime() : null;
    
    let isSelected = false;
    let isBetween = false;
    
    if (mode === 'range') {
      if (sTime !== null && eTime !== null) {
        const minTime = Math.min(sTime, eTime);
        const maxTime = Math.max(sTime, eTime);
        isSelected = thisDate === minTime || thisDate === maxTime;
        isBetween = thisDate > minTime && thisDate < maxTime;
      } else if (sTime !== null) {
        isSelected = thisDate === sTime;
      }
    } else {
      if (sTime !== null) {
        isSelected = thisDate === sTime;
      }
    }
    
    days.push(
      <TouchableOpacity 
        key={`day-${i}`} 
        style={[
          localStyles.calDay, 
          isBetween && localStyles.calDayBetween,
          isSelected && localStyles.calDaySelected
        ]}
        onPress={() => {
          onDayPress(new Date(year, month, i));
        }}
      >
        <Text style={[
          localStyles.calDayText, 
          isSelected && localStyles.calDayTextSelected,
          isBetween && localStyles.calDayTextBetween
        ]}>{i}</Text>
      </TouchableOpacity>
    );
  }
  
  return (
    <View style={localStyles.calContainer}>
      <View style={localStyles.calNavRow}>
        <TouchableOpacity onPress={() => setCurrentMonth(new Date(year, month - 1, 1))}>
          <Ionicons name="chevron-back" size={20} color={Colors.text.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setCalendarMode('MONTH')}>
          <Text style={localStyles.calMonthNavText}>
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setCurrentMonth(new Date(year, month + 1, 1))}>
          <Ionicons name="chevron-forward" size={20} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>
      <View style={localStyles.calHeaderRow}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => (
          <Text key={`dw-${idx}`} style={localStyles.calHeaderText}>{d}</Text>
        ))}
      </View>
      <View style={localStyles.calGrid}>{days}</View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  calContainer: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 24,
    padding: 16,
  },
  calNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  calMonthNavText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  calHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  calHeaderText: {
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '700',
    width: 40,
    textAlign: 'center',
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  calDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
    borderRadius: 20,
  },
  calDayText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '500',
  },
  calDaySelected: {
    backgroundColor: Colors.brand.yuzu,
  },
  calDayTextSelected: {
    color: '#000',
    fontWeight: '800',
  },
  calDayBetween: {
    backgroundColor: 'rgba(224, 255, 49, 0.15)',
    borderRadius: 0,
  },
  calDayTextBetween: {
    color: Colors.brand.yuzu,
  },
  calMonthBtn: {
    width: '33.33%',
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 16,
  },
  calMonthBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '500',
  },
});
