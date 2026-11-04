import React, { useState, useRef, useEffect, useMemo } from 'react';
import { NotificationItem, UserProfile, P2HFormRecord } from '../types/p2h';
import { 
  Bell, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  Truck, 
  Check, 
  ExternalLink,
  Lock,
  CheckCheck
} from 'lucide-react';

interface NotificationBellProps {
  notifications: NotificationItem[];
  records: P2HFormRecord[];
  currentUser: UserProfile;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onQuickApprove: (formId: string, notifId: string) => void;
  onViewForm: (formId: string) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  notifications,
  records,
  currentUser,
  onMarkAsRead,
  onMarkAllAsRead,
  onQuickApprove,
  onViewForm
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Deduplicate and filter notifications: only pending or new items that should be in the bell.
  // Approved/Read items are filtered out so they "disappear" as requested.
  // CRITICAL: We check the 'records' status:
  // 1. If form does not exist in records (no transaction), DO NOT DISPLAY!
  // 2. If form is already approved, DO NOT DISPLAY!
  const uniqueNotifications = useMemo(() => {
    const map = new Map<string, NotificationItem>();
    
    // Map of all available records by id
    const recordMap = new Map((records || []).map(r => [r.id, r]));

    (notifications || []).forEach((n, idx) => {
      if (!n) return;

      // If notification is associated with a P2H form:
      if (n.formId) {
        const linkedRecord = recordMap.get(n.formId);
        // If there is NO transaction for this notification, skip it completely!
        if (!linkedRecord) return;

        // If the transaction is already approved, skip it completely!
        if (linkedRecord.overallStatus === 'approved' || linkedRecord.foremanApproval?.status === 'approved') {
          return;
        }
      } else if (n.type === 'p2h_submitted') {
        // Submission notification with no formId is invalid - skip!
        return;
      }

      // If already marked read or approved/rejected, skip!
      if (n.read || n.type === 'p2h_approved' || n.type === 'p2h_rejected') {
        return;
      }

      const key = n.formId ? `form_${n.formId}` : (n.id || `notif_${idx}`);

      if (map.has(key)) {
        const existing = map.get(key)!;
        const isRead = existing.read || n.read;
        const isApproved = String(existing.type) === 'p2h_approved' || String(n.type) === 'p2h_approved';
        if (isRead || isApproved) {
          map.delete(key);
        } else {
          map.set(key, {
            ...n,
            id: existing.id || n.id,
            read: false,
            type: n.type
          });
        }
      } else {
        map.set(key, { ...n, id: n.id || `notif_${idx}_${Date.now()}` });
      }
    });

    return Array.from(map.values())
      .filter(n => !n.read && n.type !== 'p2h_approved' && n.type !== 'p2h_rejected')
      .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
  }, [notifications, records]);

  const unreadCount = useMemo(() => {
    return uniqueNotifications.length;
  }, [uniqueNotifications]);

  const canApprove = ['master admin', 'admin', 'foreman', 'pengawas'].includes(
    (currentUser?.role || '').toLowerCase().trim()
  );

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Glossy Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 active:bg-slate-200 rounded-xl transition-all shadow-soft-xxs cursor-pointer border border-slate-200 shrink-0"
        title="Pemberitahuan P2H & Persetujuan Atasan"
      >
        <Bell className="w-5 h-5 text-amber-500 fill-amber-500/10 stroke-[2.2]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white font-black text-[10px] flex items-center justify-center animate-pulse border-2 border-white shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div className="fixed sm:absolute right-2 sm:right-0 top-16 sm:top-auto sm:mt-2 w-[calc(100vw-1.5rem)] sm:w-96 max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden text-slate-900 font-sans">
          
          {/* Header */}
          <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-sky-400" />
              <span className="font-extrabold text-xs tracking-tight">Pemberitahuan & Approval</span>
              {unreadCount > 0 && (
                <span className="text-[10px] bg-rose-500 text-white font-bold px-1.5 py-0.2 rounded-full">
                  {unreadCount} Baru
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllAsRead}
                className="text-[11px] text-sky-300 hover:text-white font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Tandai Semua Dibaca
              </button>
            )}
          </div>

          {/* Notification Items List (Action Only) */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 text-xs">
            {uniqueNotifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <Bell className="w-8 h-8 mx-auto opacity-30 text-slate-400" />
                <p className="text-xs font-medium">Tidak ada pemberitahuan atau permintaan approval baru.</p>
              </div>
            ) : (
              uniqueNotifications.map(item => {
                const isPendingForm = item.type === 'p2h_submitted';

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 transition-colors ${
                      !item.read ? 'bg-sky-50/70 hover:bg-sky-50 border-l-4 border-l-sky-500' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 shrink-0">
                        {item.type === 'p2h_submitted' && (
                          <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                            <Clock className="w-3.5 h-3.5" />
                          </div>
                        )}
                        {item.type === 'p2h_approved' && (
                          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                            <CheckCircle className="w-3.5 h-3.5" />
                          </div>
                        )}
                        {item.type === 'p2h_rejected' && (
                          <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </div>
                        )}
                        {item.type === 'maintenance_due' && (
                          <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center">
                            <Truck className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 block leading-tight">
                            {item.title}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {item.timestamp}
                          </span>
                        </div>

                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          {item.message}
                        </p>

                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                          {isPendingForm && item.formId && (
                            <>
                              {canApprove ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onQuickApprove(item.formId!, item.id);
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-xs transition-colors cursor-pointer"
                                >
                                  <Check className="w-3 h-3 stroke-[3]" />
                                  Approve Sekarang
                                </button>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                  <Lock className="w-3 h-3 text-amber-600" />
                                  Perlu Otorisasi Foreman/Pengawas/Admin
                                </span>
                              )}
                            </>
                          )}

                          {item.formId && (
                            <button
                              type="button"
                              onClick={() => {
                                onViewForm(item.formId!);
                                onMarkAsRead(item.id);
                                setIsOpen(false);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Lihat Form
                            </button>
                          )}

                          {!item.read && (
                            <button
                              type="button"
                              onClick={() => onMarkAsRead(item.id)}
                              className="text-[10px] text-slate-400 hover:text-slate-600 font-medium ml-auto cursor-pointer"
                            >
                              Tandai dibaca
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
