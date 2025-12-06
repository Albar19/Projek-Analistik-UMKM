'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Trash2,
  Package,
  AlertCircle,
  TrendingDown,
  Settings,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';

export function NotificationCenter() {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('all');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'high') return n.priority === 'high';
    return true;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-600 bg-red-50';
      case 'medium':
        return 'border-l-yellow-600 bg-yellow-50';
      case 'low':
        return 'border-l-blue-600 bg-blue-50';
      default:
        return 'border-l-slate-600 bg-slate-50';
    }
  };

  const getPriorityIcon = (type: string) => {
    switch (type) {
      case 'stock-alert':
        return '📦';
      case 'sales-alert':
        return '📊';
      case 'prediction-alert':
        return '🔮';
      case 'recommendation':
        return '💡';
      case 'system':
        return 'ℹ️';
      default:
        return '🔔';
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-semibold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />

          {/* Notification Panel */}
          <div className="absolute right-0 top-12 z-40 w-96 max-h-96 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-linear-to-r from-blue-600 to-blue-700 text-white p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  <h3 className="font-semibold">Notifikasi</h3>
                  {unreadCount > 0 && (
                    <span className="ml-auto text-sm bg-white/20 px-2 py-1 rounded-full">
                      {unreadCount} baru
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="hover:bg-white/20 p-1 rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2 text-sm">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 rounded-full transition-colors ${
                    filter === 'all' ? 'bg-white text-blue-600' : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  Semua
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={() => setFilter('unread')}
                    className={`px-3 py-1 rounded-full transition-colors ${
                      filter === 'unread' ? 'bg-white text-blue-600' : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    Belum Dibaca
                  </button>
                )}
                <button
                  onClick={() => setFilter('high')}
                  className={`px-3 py-1 rounded-full transition-colors ${
                    filter === 'high' ? 'bg-white text-blue-600' : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  Penting
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Tidak ada notifikasi</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 border-l-4 cursor-pointer hover:bg-slate-50 transition-colors ${getPriorityColor(
                        notif.priority
                      )}`}
                      onClick={() => markNotificationAsRead(notif.id)}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl shrink-0">{notif.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-semibold text-slate-900 text-sm">{notif.title}</h4>
                            {!notif.read && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mt-1">{notif.message}</p>

                          {/* Action Link */}
                          {notif.actionUrl && (
                            <Link
                              href={notif.actionUrl}
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs text-blue-600 hover:underline mt-2 inline-block"
                            >
                              → {notif.actionLabel || 'Lihat Detail'}
                            </Link>
                          )}

                          {/* Timestamp */}
                          <span className="text-xs text-slate-500 mt-2 block">
                            {new Date(notif.createdAt).toLocaleString('id-ID', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notif.id);
                          }}
                          className="p-1 hover:bg-slate-200 rounded transition-colors shrink-0"
                        >
                          <X className="w-4 h-4 text-slate-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            {notifications.length > 0 && (
              <div className="border-t bg-slate-50 p-3 flex gap-2">
                {unreadCount > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      markAllNotificationsAsRead();
                    }}
                    className="flex-1"
                  >
                    <CheckCheck className="w-4 h-4 mr-1" />
                    Tandai Semua Dibaca
                  </Button>
                )}
                <Link href="/pengaturan" className="flex-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setIsOpen(false)}
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    Pengaturan
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
