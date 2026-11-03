// Realtime Cloud Synchronization Engine for Netlify <-> Google AI Studio <-> Mobile <-> PC
// Powered by Google Cloud Firebase Firestore + BroadcastChannel + LocalStorage Persistence

import { db, testConnection } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  getDocs,
  Unsubscribe 
} from 'firebase/firestore';

export interface SyncPayload {
  action?: 'sync_full' | 'upsert_record' | 'delete_record' | 'update_vehicles' | 'update_users' | 'update_notifications' | 'update_settings';
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
  private knownRecordIds: Set<string> = new Set();
  private knownVehicleIds: Set<string> = new Set();
  private knownUserIds: Set<string> = new Set();
  private isPushing = false;
  private isInitialized = false;

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
          const records: any[] = [];
          const currentIds = new Set<string>();

          snapshot.forEach(docSnap => {
            const data = docSnap.data();
            if (data && data.id) {
              records.push(data);
              currentIds.add(data.id);
            }
          });

          this.knownRecordIds = currentIds;

          // Sort records descending by date & updatedAt
          records.sort((a, b) => {
            const dateA = a.date || a.createdAt || '';
            const dateB = b.date || b.createdAt || '';
            return dateB.localeCompare(dateA);
          });

          if (this.isInitialized || records.length > 0) {
            this.lastSyncTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            this.updateStatus('connected');
            this.notifyListeners({ records });
          }
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
        (snapshot) => {
          this.isConnected = true;
          const vehicles: any[] = [];
          const currentIds = new Set<string>();

          snapshot.forEach(docSnap => {
            const data = docSnap.data();
            if (data && data.id) {
              vehicles.push(data);
              currentIds.add(data.id);
            }
          });

          this.knownVehicleIds = currentIds;

          // Sort vehicles by unitNumber (e.g. LV-EV-01, LV-EV-02)
          vehicles.sort((a, b) => (a.unitNumber || '').localeCompare(b.unitNumber || ''));

          if (vehicles.length > 0) {
            this.lastSyncTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            this.updateStatus('connected');
            this.notifyListeners({ vehicles });
          }
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
          const users: any[] = [];
          const currentIds = new Set<string>();

          snapshot.forEach(docSnap => {
            const data = docSnap.data();
            if (data && data.id) {
              users.push(data);
              currentIds.add(data.id);
            }
          });

          this.knownUserIds = currentIds;

          if (users.length > 0) {
            this.lastSyncTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            this.updateStatus('connected');
            this.notifyListeners({ users });
          }
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
            const settings = docSnap.data();
            this.lastSyncTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            this.updateStatus('connected');
            this.notifyListeners({ settings });
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
          const notifications: any[] = [];
          snapshot.forEach(docSnap => {
            const data = docSnap.data();
            if (data && data.id) {
              notifications.push(data);
            }
          });

          notifications.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));

          if (this.isInitialized || notifications.length > 0) {
            this.notifyListeners({ notifications });
          }
        },
        (error) => {
          console.warn('Firestore notifications stream error:', error);
        }
      );
      this.unsubscribers.push(unsubNotifs);

      this.isInitialized = true;
    } catch (err) {
      console.warn('Failed to initialize Firestore sync:', err);
      this.updateStatus('offline');
    }
  }

  private handleLocalBroadcast(payload: SyncPayload) {
    if (!payload || payload.originId === this.clientId) return;
    this.notifyListeners(payload);
  }

  public subscribe(callback: SyncCallback) {
    this.listeners.add(callback);
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

  // Push transaction updates to Cloud Firestore so ALL devices (Netlify, Mobile, AI Studio, PC) update in real-time
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

    // 2. Persist to Cloud Firestore
    try {
      const batch = writeBatch(db);
      let batchCount = 0;

      // A. Sync Records
      if (Array.isArray(payload.records)) {
        const incomingRecordIds = new Set<string>();

        for (const record of payload.records) {
          if (record && record.id) {
            incomingRecordIds.add(record.id);
            const recordRef = doc(db, 'p2h_records', String(record.id));
            batch.set(recordRef, record, { merge: true });
            batchCount++;
          }
        }

        // Delete records that were removed from the array
        for (const oldId of this.knownRecordIds) {
          if (!incomingRecordIds.has(oldId)) {
            const delRef = doc(db, 'p2h_records', oldId);
            batch.delete(delRef);
            batchCount++;
          }
        }
        this.knownRecordIds = incomingRecordIds;
      }

      // B. Sync Vehicles
      if (Array.isArray(payload.vehicles) && payload.vehicles.length > 0) {
        const incomingVehicleIds = new Set<string>();

        for (const vehicle of payload.vehicles) {
          if (vehicle && vehicle.id) {
            incomingVehicleIds.add(vehicle.id);
            const vehRef = doc(db, 'vehicles', String(vehicle.id));
            batch.set(vehRef, vehicle, { merge: true });
            batchCount++;
          }
        }

        for (const oldId of this.knownVehicleIds) {
          if (!incomingVehicleIds.has(oldId)) {
            const delRef = doc(db, 'vehicles', oldId);
            batch.delete(delRef);
            batchCount++;
          }
        }
        this.knownVehicleIds = incomingVehicleIds;
      }

      // C. Sync Users
      if (Array.isArray(payload.users) && payload.users.length > 0) {
        const incomingUserIds = new Set<string>();

        for (const user of payload.users) {
          if (user && user.id) {
            incomingUserIds.add(user.id);
            const userRef = doc(db, 'users', String(user.id));
            batch.set(userRef, user, { merge: true });
            batchCount++;
          }
        }

        for (const oldId of this.knownUserIds) {
          if (!incomingUserIds.has(oldId)) {
            const delRef = doc(db, 'users', oldId);
            batch.delete(delRef);
            batchCount++;
          }
        }
        this.knownUserIds = incomingUserIds;
      }

      // D. Sync Settings
      if (payload.settings && typeof payload.settings === 'object') {
        const settingsRef = doc(db, 'settings', 'app_settings');
        batch.set(settingsRef, payload.settings, { merge: true });
        batchCount++;
      }

      // E. Sync Notifications
      if (Array.isArray(payload.notifications)) {
        for (const notif of payload.notifications) {
          if (notif && notif.id) {
            const notifRef = doc(db, 'notifications', String(notif.id));
            batch.set(notifRef, notif, { merge: true });
            batchCount++;
          }
        }
      }

      // Metadata heartbeat doc
      const metaRef = doc(db, 'sync_meta', 'heartbeat');
      batch.set(metaRef, {
        version: enriched.version,
        originId: this.clientId,
        sourceDevice: enriched.sourceDevice,
        updatedAt: enriched.timestamp
      }, { merge: true });
      batchCount++;

      if (batchCount > 0) {
        await batch.commit();
      }

      this.isConnected = true;
      this.updateStatus('connected');
    } catch (err) {
      console.warn('Firestore batch write error:', err);
      // Fallback individual write for resilience
      try {
        if (payload.settings) {
          await setDoc(doc(db, 'settings', 'app_settings'), payload.settings, { merge: true });
        }
      } catch {}
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
      // Re-check Firestore connection
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
