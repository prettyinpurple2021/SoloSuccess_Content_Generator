import React, { useState } from 'react';
import { Post } from '../types';

interface CalendarViewProps {
    posts: Post[];
    onPostClick: (post: Post) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ posts, onPostClick }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDay = startOfMonth.getDay();
    const daysInMonth = endOfMonth.getDate();
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const calendarDays = Array.from({ length: startDay }, (_, i) => ({ key: `empty-${i}`, empty: true, day: 0, posts: [] as Post[], isToday: false }));

    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
        const datePosts = posts.filter(p => p.scheduleDate && p.scheduleDate.toDateString() === date.toDateString());
        calendarDays.push({ key: `day-${i}`, day: i, posts: datePosts, isToday: new Date().toDateString() === date.toDateString(), empty: false });
    }

    const changeMonth = (offset: number) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'posted':
                return 'bg-gradient-to-r from-pink-400 to-red-400 text-white shadow-lg';
            case 'scheduled':
                return 'bg-gradient-to-r from-green-400 to-emerald-400 text-black shadow-lg';
            case 'draft':
                return 'bg-gradient-to-r from-yellow-300 to-orange-300 text-black shadow-lg';
            default:
                return 'bg-gradient-to-r from-purple-300 to-blue-300 text-black shadow-lg';
        }
    }

    return (
        <div className="glass-card relative">
            <div className="sparkle"></div>
            <div className="sparkle"></div>
            <div className="sparkle"></div>
            <div className="sparkle"></div>
            <div className="glass-card-inner">
                <div className="flex justify-between items-center mb-8">
                    <button 
                        onClick={() => changeMonth(-1)} 
                        className="holographic-btn text-2xl px-6 py-3"
                    >
                        ←
                    </button>
                    <h3 className="text-3xl font-display font-black text-white tracking-wider">
                        {currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}
                    </h3>
                    <button 
                        onClick={() => changeMonth(1)} 
                        className="holographic-btn text-2xl px-6 py-3"
                    >
                        →
                    </button>
                </div>
                <div className="grid grid-cols-7 gap-2 text-center">
                    {daysOfWeek.map(day => (
                        <div key={day} className="font-accent text-lg font-bold text-white pb-3">
                            {day}
                        </div>
                    ))}
                    {calendarDays.map(dayInfo => (
                        <div 
                            key={dayInfo.key} 
                            className={`h-32 sm:h-36 border rounded-xl p-2 overflow-y-auto transition-all backdrop-filter blur-10 ${
                                dayInfo.isToday 
                                    ? 'bg-gradient-to-br from-purple-500/30 to-pink-500/30 border-purple-400/50 shadow-lg' 
                                    : 'bg-white/10 border-white/20'
                            } ${dayInfo.empty ? 'opacity-30' : ''}`}
                        >
                            {!dayInfo.empty && (
                                <>
                                    <div className="font-bold text-sm text-right text-white mb-1">
                                        {dayInfo.day}
                                    </div>
                                    {dayInfo.posts.map(post => (
                                        <div
                                            key={post.id}
                                            onClick={() => onPostClick(post)}
                                            className={`text-xs p-2 mt-1 rounded-lg cursor-pointer truncate transition-all hover:scale-105 font-semibold ${getStatusColor(post.status)}`}
                                            title={post.idea}
                                        >
                                            {post.idea}
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CalendarView;