"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  Zap,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";

interface CalendarClientProps {
  currentUser: any;
}

export const CalendarClient: React.FC<CalendarClientProps> = ({ currentUser }) => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/calendar")
      .then((res) => res.json())
      .then((data) => {
        setEvents(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Simple Month Grid generator
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const handlePrev = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNext = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getEventsForDay = (day: number) => {
    return events.filter((e) => {
      if (!e.date) return false;
      const d = new Date(e.date);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  };

  const getEventBadge = (type: string) => {
    switch (type) {
      case "TASK_DEADLINE":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "PROJECT_MILESTONE":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "SPRINT_DATE":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-emerald-600" />
            <span>Company Work Calendar</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Synchronized schedule of task deadlines, sprint boundaries, deliverables, and project milestones.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="p-1 rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-800 px-2">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={handleNext}
              className="p-1 rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200 mx-1" />

          {["month", "week", "day"].map((v) => (
            <button
              key={v}
              onClick={() => setView(v as any)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase ${
                view === v ? "bg-emerald-600 text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Month View Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/70 text-center text-[11px] font-bold text-slate-500 py-2.5 uppercase tracking-wider">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Calendar days grid */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 min-h-[500px]">
          {/* Empty prefix cells */}
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-slate-50/40 p-2 min-h-[100px]" />
          ))}

          {/* Actual days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dayEvents = getEventsForDay(dayNum);
            const isToday =
              dayNum === 18 && month === 8 && year === 2026; // Current local date September 18, 2026

            return (
              <div
                key={`day-${dayNum}`}
                className={`p-2 min-h-[100px] flex flex-col justify-between transition-colors ${
                  isToday ? "bg-emerald-50/40" : "hover:bg-slate-50/60"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center ${
                      isToday ? "bg-emerald-600 text-white" : "text-slate-700"
                    }`}
                  >
                    {dayNum}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="text-[10px] text-slate-400 font-medium">
                      {dayEvents.length} items
                    </span>
                  )}
                </div>

                {/* Day events stack */}
                <div className="space-y-1 flex-1 overflow-y-auto max-h-20">
                  {dayEvents.map((evt) => (
                    <div
                      key={evt.id}
                      onClick={() => setSelectedEvent(evt)}
                      className={`px-1.5 py-0.5 rounded border text-[10px] font-medium truncate cursor-pointer hover:opacity-80 transition-opacity ${getEventBadge(
                        evt.type
                      )}`}
                    >
                      {evt.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <Modal
          isOpen={Boolean(selectedEvent)}
          onClose={() => setSelectedEvent(null)}
          title={selectedEvent.title}
          subtitle={`Type: ${selectedEvent.type.replace("_", " ")}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 text-[10px] font-bold block">Associated Context</span>
              <p className="font-semibold text-slate-800 mt-0.5">{selectedEvent.subtitle}</p>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Scheduled: {new Date(selectedEvent.date).toLocaleDateString()}
              </span>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Link
                href={selectedEvent.link}
                className="text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
              >
                <span>Navigate to details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
