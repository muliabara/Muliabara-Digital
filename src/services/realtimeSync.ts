// Realtime Cloud Synchronization Engine for Netlify <-> Google AI Studio <-> Mobile <-> PC
// Powered by Google Cloud Firebase Firestore + BroadcastChannel + LocalStorage Persistence

import { db, testConnection } from './firebase';
import { 
  collection,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  getDocs,
  Unsubscribe 
} from 'firebase/firestore';
import { INITIAL_VEHICLES, INITIAL_P2H_RECORDS } from '../data/initialData';
import { INITIAL_ACCOUNTS } from '../components/AccountProfileView';
import { AppSettings, P2HFormRecord, VehicleUnit, UserProfile, NotificationItem } from '../types/p2h';
import { getCompressed } from '../utils/storage';

export interface SyncPayload {
  action?: 'sync_full' | 'upsert_record' | 'delete_record' | 'delete_all_records' | 'delete_vehicle' | 'update_vehicles' | 'update_users' | 'update_notifications' | 'update_settings' | 'delete_notification' | 'delete_user';
  targetId?: string | string[];
  records?: any[];
  vehicles?: any[];
  notifications?: any[];
  users?: any[];
  settings?: any;
  permissions?: any;
  version?: number;
  originId?: string;
  sourceDevice?: string;
  timestamp?: string;
}

type SyncCallback = (payload: SyncPayload) => void;
type StatusCallback = (status: 'connected' | 'syncing' | 'offline', lastSyncTime?: string) => void;

/**
 * Deep sanitization for Firestore:
 * Strips all `undefined` values and converts NaN/functions to safe JSON representations.
 * Crucial to prevent "Unsupported field value: undefined" runtime errors.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (typeof data !== 'object') {
    if (typeof data === 'number' && isNaN(data)) return 0 as any;
    return data;
  }
  if (Array.isArray(data)) {
    return data
      .filter(item => item !== undefined)
      .map(item => sanitizeForFirestore(item)) as any;
  }

  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(data as Record<string, any>)) {
    if (value !== undefined) {
      result[key] = sanitizeForFirestore(value);
    }
  }
  return result as T;
}

class RealtimeSyncManager {
  private broadcastChannel: BroadcastChannel | null = null;
  private listeners: Set<SyncCallback> = new Set();
  private statusListeners: Set<StatusCallback> = new Set();
  
  public isConnected = false;
  public connectionStatus: 'connected' | 'syncing' | 'offline' = 'syncing';
  public lastSyncTime: string = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  public clientId = typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID() 
    : `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  private unsubscribers: Unsubscribe[] = [];
  
  // In-memory latest state cache to immediately hydrate any component or newly mounted tab
  public cachedRecords: P2HFormRecord[] = [];
  public cachedVehicles: VehicleUnit[] = [];
  public cachedUsers: UserProfile[] = [];
  public cachedSettings: AppSettings | null = null;
  public cachedNotifications: NotificationItem[] = [];
  public hasReceivedInitialData = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // 1. Setup multi-tab BroadcastChannel on same device for instant zero-latency sync
      try {
        this.broadcastChannel = new BroadcastChannel('jac_t9_ev_sync');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data?.state) {
            this.handleLocalBroadcast(event.data.state as SyncPayload);
          }
        };
      } catch {
        // BroadcastChannel fallback
      }

      // 2. Initialize Firestore Real-Time Listeners (Netlify <-> Google AI Studio <-> Mobile <-> PC)
      this.initFirestoreSync();
    }
  }

  // Initialize Firestore listeners for real-time bidirectional synchronization
  private async initFirestoreSync() {
    try {
      this.updateStatus('syncing');

      // Test connection
      const ok = await testConnection();
      if (ok) {
        this.isConnected = true;
        this.updateStatus('connected');
      }

      // Cleanup existing listeners if any
      this.unsubscribers.forEach(unsub => {
        try { unsub(); } catch {}
      });
      this.unsubscribers = [];

      // A. Listen to P2H Form Records collection
      const unsubRecords = onSnapshot(
        collection(db, 'p2h_records'),
        (snapshot) => {
          this.isConnected = true;
          const records: P2HFormRecord[] = [];

          snapshot.forEach(docSnap => {
            const data = docSnap.data() as P2HFormRecord;
            if (data && data.id) {
              records.push(data);
            }
          });

          // Auto-seed only once if Firestore p2h_records collection is completely empty
          if (snapshot.empty && !this.hasReceivedInitialData) {
            console.log('Seeding initial P2H records to Firestore...');
            let recordsToSeed = INITIAL_P2H_RECORDS;
            try {
              const localSaved = getCompressed('jac_t9_p2h_records_v6');
              if (Array.isArray(localSaved) && localSaved.length > 0) {
                recordsToSeed = localSaved;
              }
            } catch {
              // fallback
            }
            if (recordsToSeed.length > 0) {
              this.seedInitialRecords(recordsToSeed);
            }
            this.cachedRecords = recordsToSeed;
            this.hasReceivedInitialData = true;
            this.lastSyncTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            this.updateStatus('connected');
            this.notifyListeners({ records: recordsToSeed });
            return;
          }

          // Sort records descending by date & updatedAt
          records.sort((a, b) => {
            const dateA = a.date || a.createdAt || '';
            const dateB = b.date || b.createdAt || '';
            return dateB.localeCompare(dateA);
          });

          this.cachedRecords = records;
          this.hasReceivedInitialData = true;
          this.lastSyncTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          this.updateStatus('connected');
          this.notifyListeners({ records });
        },
        (error) => {
          console.warn('Firestore p2h_records stream error:', error);
          this.updateStatus('offline');
        }
      );
      this.unsubscribers.push(unsubRecords);

      // B. Listen to Vehicles collection
      const unsubVehicles = onSnapshot(
        collection(db, 'vehicles'),
        async (snapshot) => {
          this.isConnected = true;
          const vehicles: VehicleUnit[] = [];

          snapshot.forEach(docSnap => {
            const data = docSnap.data() as VehicleUnit;
            if (data && data.id) {
              vehicles.push(data);
            }
          });

          // Auto-seed only once if Firestore vehicles collection is completely empty
          if (snapshot.empty && !this.hasReceivedInitialData) {
            console.log('Seeding initial vehicles to Firestore...');
            this.seedInitialVehicles();
            this.cachedVehicles = INITIAL_VEHICLES;
            this.notifyListeners({ vehicles: INITIAL_VEHICLES });
            return;
          }

          // Sort vehicles by unitNumber (e.g. LV-EV-01, LV-EV-02)
          vehicles.sort((a, b) => (a.unitNumber || '').localeCompare(b.unitNumber || ''));

          this.cachedVehicles = vehicles;
          this.hasReceivedInitialData = true;
          this.lastSyncTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          this.updateStatus('connected');
          this.notifyListeners({ vehicles });
        },
        (error) => {
          console.warn('Firestore vehicles stream error:', error);
        }
      );
      this.unsubscribers.push(unsubVehicles);

      // C. Listen to User Accounts collection
      const unsubUsers = onSnapshot(
        collection(db, 'users'),
        (snapshot) => {
          this.isConnected = true;
          const users: UserProfile[] = [];

          const isDummy = (u: UserProfile) => {
            if (!u) return false;
            const name = String(u.name || '');
            const nik = String(u.nik || '');
            const email = String(u.email || '');
            return (
              name.includes('Bambang Wijaya') ||
              name.includes('Budi Santoso') ||
              name.includes('Suryadi Pratama') ||
              ['MGR-1002', 'OP-7821', 'FRM-2045'].includes(nik) ||
              email.includes('sunmobility.com')
            );
          };

          snapshot.forEach(docSnap => {
            const data = docSnap.data() as UserProfile;
            if (data && data.id && !isDummy(data)) {
              users.push(data);
            }
          });

          if (users.length === 0) {
            this.seedInitialUsers();
            this.cachedUsers = INITIAL_ACCOUNTS;
            this.notifyListeners({ users: INITIAL_ACCOUNTS });
            return;
          }

          this.cachedUsers = users;
          this.hasReceivedInitialData = true;
          this.lastSyncTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          this.updateStatus('connected');
          this.notifyListeners({ users });
        },
        (error) => {
          console.warn('Firestore users stream error:', error);
        }
      );
      this.unsubscribers.push(unsubUsers);

      // D. Listen to Settings document
      const unsubSettings = onSnapshot(
        doc(db, 'settings', 'app_settings'),
        (docSnap) => {
          this.isConnected = true;
          if (docSnap.exists()) {
            const settingsData = docSnap.data() as AppSettings;
            this.cachedSettings = settingsData;
            this.hasReceivedInitialData = true;
            this.lastSyncTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            this.updateStatus('connected');
            this.notifyListeners({ settings: settingsData });
          }
        },
        (error) => {
          console.warn('Firestore settings stream error:', error);
        }
      );
      this.unsubscribers.push(unsubSettings);

      // E. Listen to Notifications collection
      const unsubNotifs = onSnapshot(
        collection(db, 'notifications'),
        (snapshot) => {
          this.isConnected = true;
          const notifications: NotificationItem[] = [];
          snapshot.forEach(docSnap => {
            const data = docSnap.data() as NotificationItem;
            if (data && data.id) {
              notifications.push(data);
            }
          });

          notifications.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));

          this.cachedNotifications = notifications;
          this.notifyListeners({ notifications });
        },
        (error) => {
          console.warn('Firestore notifications stream error:', error);
        }
      );
      this.unsubscribers.push(unsubNotifs);

    } catch (err) {
      console.warn('Failed to initialize Firestore sync:', err);
      this.updateStatus('offline');
    }
  }

  // Seed default P2H records if Firestore has none
  private async seedInitialRecords(recordsToSeed: P2HFormRecord[]) {
    try {
      for (const rec of recordsToSeed) {
        if (rec && rec.id) {
          await setDoc(doc(db, 'p2h_records', String(rec.id)), sanitizeForFirestore(rec), { merge: true });
        }
      }
    } catch (err) {
      console.warn('Error seeding P2H records:', err);
    }
  }

  // Seed default vehicles if Firestore has none
  private async seedInitialVehicles() {
    try {
      for (const veh of INITIAL_VEHICLES) {
        await setDoc(doc(db, 'vehicles', veh.id), sanitizeForFirestore(veh), { merge: true });
      }
    } catch (err) {
      console.warn('Error seeding vehicles:', err);
    }
  }

  // Seed default user accounts if Firestore has none
  private async seedInitialUsers() {
    try {
      for (const user of INITIAL_ACCOUNTS) {
        await setDoc(doc(db, 'users', user.id), sanitizeForFirestore(user), { merge: true });
      }
    } catch (err) {
      console.warn('Error seeding users:', err);
    }
  }

  private handleLocalBroadcast(payload: SyncPayload) {
    if (!payload || payload.originId === this.clientId) return;
    this.notifyListeners(payload);
  }

  public subscribe(callback: SyncCallback) {
    this.listeners.add(callback);

    // Immediately replay cached data to newly subscribed components
    if (this.hasReceivedInitialData || this.cachedRecords.length > 0 || this.cachedVehicles.length > 0 || this.cachedSettings) {
      queueMicrotask(() => {
        try {
          callback({
            records: this.cachedRecords.length > 0 ? this.cachedRecords : undefined,
            vehicles: this.cachedVehicles.length > 0 ? this.cachedVehicles : undefined,
            users: this.cachedUsers.length > 0 ? this.cachedUsers : undefined,
            settings: this.cachedSettings || undefined,
            notifications: this.cachedNotifications
          });
        } catch (e) {
          console.warn('Error in initial subscriber replay:', e);
        }
      });
    }

    return () => {
      this.listeners.delete(callback);
    };
  }

  public subscribeStatus(callback: StatusCallback) {
    this.statusListeners.add(callback);
    callback(this.connectionStatus, this.lastSyncTime);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  private updateStatus(status: 'connected' | 'syncing' | 'offline') {
    this.connectionStatus = status;
    this.statusListeners.forEach(cb => {
      try {
        cb(status, this.lastSyncTime);
      } catch {
        // ignore
      }
    });
  }

  private notifyListeners(payload: SyncPayload) {
    this.listeners.forEach(cb => {
      try {
        cb(payload);
      } catch (err) {
        console.error('Error in sync callback:', err);
      }
    });
  }

  /**
   * Push transaction updates to Cloud Firestore so ALL devices (Netlify, Mobile, AI Studio, PC)
   * update in real-time.
   */
  public async pushUpdate(payload: SyncPayload) {
    this.lastSyncTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.updateStatus('syncing');

    const enriched: SyncPayload = {
      ...payload,
      version: Date.now(),
      originId: this.clientId,
      sourceDevice: typeof navigator !== 'undefined' ? (navigator.userAgent.includes('Mobile') ? 'Mobile' : 'PC') : 'Unknown',
      timestamp: new Date().toISOString()
    };

    // 1. Broadcast locally to all open browser tabs on same machine
    try {
      this.broadcastChannel?.postMessage({ state: enriched });
    } catch {
      // ignore
    }

    // 2. Persist to Cloud Firestore via direct resilient writes
    try {
      const batch = writeBatch(db);
      let ops = 0;

      // A. Explicit Record Deletion
      if (payload.action === 'delete_record' && payload.targetId) {
        batch.delete(doc(db, 'p2h_records', String(payload.targetId)));
        ops++;
        this.cachedRecords = this.cachedRecords.filter(r => r.id !== payload.targetId);
        // Also delete any notification associated with this record
        const relatedNotifs = this.cachedNotifications.filter(n => n.formId === payload.targetId);
        for (const rn of relatedNotifs) {
          batch.delete(doc(db, 'notifications', String(rn.id)));
          ops++;
        }
        this.cachedNotifications = this.cachedNotifications.filter(n => n.formId !== payload.targetId);
      } else if (payload.action === 'delete_all_records') {
        const snap = await getDocs(collection(db, 'p2h_records'));
        for (const d of snap.docs) {
          batch.delete(d.ref);
          ops++;
        }
        this.cachedRecords = [];
        // Also delete all notifications from Firestore
        const notifSnap = await getDocs(collection(db, 'notifications'));
        for (const d of notifSnap.docs) {
          batch.delete(d.ref);
          ops++;
        }
        this.cachedNotifications = [];
      } else if (Array.isArray(payload.records)) {
        for (const record of payload.records) {
          if (record && record.id) {
            const clean = sanitizeForFirestore(record);
            batch.set(doc(db, 'p2h_records', String(record.id)), clean, { merge: true });
            ops++;
            
            // Relational Cleanup: If record is approved, auto-delete any linked notifications
            if (record.overallStatus === 'approved') {
              const relatedNotifs = this.cachedNotifications.filter(n => n.formId === record.id);
              for (const rn of relatedNotifs) {
                batch.delete(doc(db, 'notifications', String(rn.id)));
                ops++;
              }
              this.cachedNotifications = this.cachedNotifications.filter(n => n.formId !== record.id);
            }
          }
        }
      }

      // B. Explicit Vehicle Deletion or Upsert
      if (payload.action === 'delete_vehicle' && payload.targetId) {
        batch.delete(doc(db, 'vehicles', String(payload.targetId)));
        ops++;
        this.cachedVehicles = this.cachedVehicles.filter(v => v.id !== payload.targetId);
      } else if (Array.isArray(payload.vehicles) && payload.vehicles.length > 0) {
        for (const vehicle of payload.vehicles) {
          if (vehicle && vehicle.id) {
            const clean = sanitizeForFirestore(vehicle);
            batch.set(doc(db, 'vehicles', String(vehicle.id)), clean, { merge: true });
            ops++;
          }
        }
      }

      // C. Sync Users or Explicit Deletion
      if (payload.action === 'delete_user' && payload.targetId) {
        const ids = Array.isArray(payload.targetId) ? payload.targetId : [payload.targetId];
        for (const id of ids) {
          batch.delete(doc(db, 'users', String(id)));
          ops++;
        }
        this.cachedUsers = this.cachedUsers.filter(u => !ids.includes(u.id));
      } else if (Array.isArray(payload.users) && payload.users.length > 0) {
        for (const user of payload.users) {
          if (user && user.id) {
            const clean = sanitizeForFirestore(user);
            batch.set(doc(db, 'users', String(user.id)), clean, { merge: true });
            ops++;
          }
        }
      }

      // D. Sync Settings
      if (payload.settings && typeof payload.settings === 'object') {
        const cleanSettings = sanitizeForFirestore(payload.settings);
        batch.set(doc(db, 'settings', 'app_settings'), cleanSettings, { merge: true });
        ops++;
        this.cachedSettings = cleanSettings;
      }

      // E. Sync Notifications or Explicit Deletion
      if (payload.action === 'delete_notification' && payload.targetId) {
        const ids = Array.isArray(payload.targetId) ? payload.targetId : [payload.targetId];
        for (const id of ids) {
          batch.delete(doc(db, 'notifications', String(id)));
          ops++;
        }
        this.cachedNotifications = this.cachedNotifications.filter(n => !ids.includes(n.id));
      } else if (Array.isArray(payload.notifications)) {
        for (const notif of payload.notifications) {
          if (notif && notif.id) {
            const clean = sanitizeForFirestore(notif);
            batch.set(doc(db, 'notifications', String(notif.id)), clean, { merge: true });
            ops++;
          }
        }
      }

      // Heartbeat metadata
      batch.set(doc(db, 'sync_meta', 'heartbeat'), {
        version: enriched.version,
        originId: this.clientId,
        sourceDevice: enriched.sourceDevice,
        updatedAt: enriched.timestamp
      }, { merge: true });
      ops++;

      if (ops > 0) {
        await batch.commit();
      }

      this.isConnected = true;
      this.updateStatus('connected');
      
      // Notify listeners after successful write
      this.notifyListeners(enriched);

    } catch (err) {
      console.error('Firestore real-time write error:', err);
      this.updateStatus('connected');
    }

    // 3. Optional local dev proxy sync if running in AI Studio dev environment
    try {
      if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname.includes('run.app'))) {
        fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(enriched)
        }).catch(() => {});
      }
    } catch {
      // ignore
    }
  }

  // Force trigger full synchronization now across all collections
  public async forceSyncNow(currentState?: SyncPayload) {
    this.updateStatus('syncing');

    if (currentState) {
      await this.pushUpdate(currentState);
    }

    try {
      await testConnection();
      this.lastSyncTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      this.updateStatus('connected');
    } catch {
      this.updateStatus('offline');
    }
  }
}

export const realtimeSync = new RealtimeSyncManager();
export const API_BASE_URL = '';
