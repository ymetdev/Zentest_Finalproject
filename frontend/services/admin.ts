import { db } from '../firebase';
import {
    collection, doc, getDocs, getDoc, setDoc, updateDoc, writeBatch,
    query, where, orderBy, Timestamp, runTransaction
} from 'firebase/firestore';
import { LicenseKey, User } from '../types';

export const ADMIN_EMAIL = 'zentest48@gmail.com';

export const AdminService = {
    // --- License Management ---

    async generateKey(durationDays: number, count: number = 1): Promise<void> {
        const batch = writeBatch(db);

        for (let i = 0; i < count; i++) {
            const key = 'KEY-' + Math.random().toString(36).substring(2, 6).toUpperCase() +
                '-' + Math.random().toString(36).substring(2, 6).toUpperCase() +
                '-' + Math.random().toString(36).substring(2, 6).toUpperCase();

            const keyRef = doc(db, 'licenseKeys', key);
            batch.set(keyRef, {
                key,
                durationDays,
                isUsed: false,
                createdAt: Date.now()
            });
        }

        await batch.commit();
    },

    async getAllKeys(): Promise<LicenseKey[]> {
        try {
            const q = query(collection(db, 'licenseKeys'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(d => d.data() as LicenseKey);
        } catch (e: any) {
            // Fallback without ordering if composite index doesn't exist yet
            console.warn('[AdminService] orderBy index missing, fetching unordered:', e.message);
            const snapshot = await getDocs(collection(db, 'licenseKeys'));
            const keys = snapshot.docs.map(d => d.data() as LicenseKey);
            return keys.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        }
    },

    // --- User Management ---

    async getAllUsers(): Promise<User[]> {
        const q = query(collection(db, 'users'), orderBy('lastLogin', 'desc')); // Order by last login if available
        // Note: lastLogin was just added, so some users might not have it. orderBy might exclude them?
        // Let's just getAll first without strict order if indexes are tricky, or order by something else.
        // Actually, let's just use simple getDocs for now to be safe.
        const snapshot = await getDocs(collection(db, 'users'));
        return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
    },

    async searchUser(emailOrUid: string): Promise<any | null> {
        // Strategy 1: Try by UID (fast — direct doc lookup)
        const docRef = doc(db, 'users', emailOrUid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { uid: docSnap.id, ...docSnap.data() };
        }

        // Strategy 2: Try by email via query (requires 'email' field to be indexed)
        try {
            const q = query(
                collection(db, 'users'),
                where('email', '==', emailOrUid.toLowerCase().trim())
            );
            const snap = await getDocs(q);
            if (!snap.empty) {
                const d = snap.docs[0];
                return { uid: d.id, ...d.data() };
            }
        } catch (e: any) {
            console.warn('[AdminService] Email search failed (index may be missing):', e.message);
        }

        return null;
    },

    async updateUserTier(uid: string, newTier: 'free' | 'pro'): Promise<void> {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
            tier: newTier,
            // If setting to free, we should probably clear validity? Or just let it expire?
            // If setting to Pro manually, we might want to give a default duration or just rely on manual extension.
            // For now, let's just toggle the flag. If setting to free, validUntil should realistically be now.
            ...(newTier === 'free' ? { validUntil: Timestamp.now() } : {})
        });
    },

    async extendUserSubscription(uid: string, daysToAdd: number): Promise<void> {
        const userRef = doc(db, 'users', uid);

        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userRef);
            const userData = userDoc.exists() ? userDoc.data() : {};

            const currentValidUntil = userData.validUntil?.toMillis() || 0;
            const now = Date.now();
            const baseTime = currentValidUntil > now ? currentValidUntil : now;

            const addedMillis = daysToAdd * 24 * 60 * 60 * 1000;
            const newValidUntil = Timestamp.fromMillis(baseTime + addedMillis);

            transaction.set(userRef, {
                validUntil: newValidUntil,
                tier: 'pro'
            }, { merge: true });
        });
    },

    async revokeKey(key: string): Promise<void> {
        const keyRef = doc(db, 'licenseKeys', key);
        await updateDoc(keyRef, {
            isUsed: false,
            usedBy: null,
            usedByName: null,
            usedByEmail: null,
            usedAt: null
        });
    }
};
