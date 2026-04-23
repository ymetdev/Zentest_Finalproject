import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db, appId } from '../firebase';
import { TestCase, APITestCase, Module, Comment } from '../types';
import { TestCaseService, APITestCaseService, UserReadStatusService, ModuleService } from '../services/db';

export const useProjectData = (user: any, activeProjectId: string | null) => {
    const [modules, setModules] = useState<Module[]>([]);
    const [testCases, setTestCases] = useState<TestCase[]>([]);
    const [apiTestCases, setApiTestCases] = useState<APITestCase[]>([]);
    const [readStatus, setReadStatus] = useState<Record<string, number>>({});

    useEffect(() => {
        if (!user || !activeProjectId) {
            setTestCases([]);
            setModules([]);
            setApiTestCases([]);
            return;
        }

        const modulesQuery = query(collection(db, 'artifacts', appId, 'public', 'data', 'modules'), where('projectId', '==', activeProjectId));
        const casesQuery = query(collection(db, 'artifacts', appId, 'public', 'data', 'testCases'), where('projectId', '==', activeProjectId));
        const apiQuery = query(collection(db, 'artifacts', appId, 'public', 'data', 'apiTestCases'), where('projectId', '==', activeProjectId));

        const opts = { includeMetadataChanges: true };
        const unsubModules = onSnapshot(modulesQuery, opts, (s: any) => setModules(s.docs.map((d: any) => ({ id: d.id, ...d.data() } as Module))));
        const unsubCases = onSnapshot(casesQuery, opts, (s: any) => setTestCases(s.docs.map((d: any) => ({ id: d.id, ...d.data() } as TestCase))));
        const unsubAPI = onSnapshot(apiQuery, opts, (s: any) => setApiTestCases(s.docs.map((d: any) => ({ id: d.id, ...d.data() } as APITestCase))));

        return () => { unsubModules(); unsubCases(); unsubAPI(); };
    }, [user, activeProjectId]);

    useEffect(() => {
        if (!activeProjectId || !user) return;
        const unsub = UserReadStatusService.subscribe(activeProjectId, user.uid, setReadStatus);
        return () => unsub();
    }, [activeProjectId, user]);

    // Actions
    const handleTestCaseSave = async (data: Partial<TestCase>, isNew: boolean) => {
        const audit = {
            lastUpdatedBy: user?.uid,
            lastUpdatedByName: user?.displayName || 'Unknown',
            lastUpdatedByPhoto: user?.photoURL || null,
            timestamp: Date.now()
        };
        const payload = { ...data, ...audit };

        // auto-create module if it doesn't exist
        if (data.module && data.module.trim() !== '' && !modules.some(m => m.name.toLowerCase() === data.module!.toLowerCase())) {
            await handleAddModule(data.module);
        }

        // Optimistic Update
        if (!isNew && data.id) {
            setTestCases((prev: TestCase[]) => prev.map(c => c.id === data.id ? { ...c, ...payload } as TestCase : c));
        }

        await TestCaseService.save(payload, isNew, user);
    };

    const handleAPICaseSave = async (data: Partial<APITestCase>, isNew: boolean) => {
        const audit = {
            lastUpdatedBy: user?.uid,
            lastUpdatedByName: user?.displayName || 'Unknown',
            lastUpdatedByPhoto: user?.photoURL || null,
            timestamp: Date.now()
        };
        const payload = { ...data, ...audit };

        // auto-create module if it doesn't exist
        if (data.module && data.module.trim() !== '' && !modules.some(m => m.name.toLowerCase() === data.module!.toLowerCase())) {
            await handleAddModule(data.module);
        }

        // Optimistic Update
        if (!isNew && data.id) {
            setApiTestCases((prev: APITestCase[]) => prev.map(c => c.id === data.id ? { ...c, ...payload } as APITestCase : c));
        }

        await APITestCaseService.save(payload, isNew, user);
    };

    const deleteItems = async (ids: Set<string>, viewMode: 'functional' | 'api') => {
        const idsToDelete = Array.from(ids);
        if (viewMode === 'functional') await Promise.all(idsToDelete.map(id => TestCaseService.delete(id)));
        else await Promise.all(idsToDelete.map(id => APITestCaseService.delete(id)));
    };

    const updateStatus = async (id: string, status: 'Passed' | 'Failed', type: 'functional' | 'api', extraData: any = {}) => {
        // Optimistic Update
        const update = { status, ...extraData, timestamp: Date.now(), lastUpdatedBy: user?.uid, lastUpdatedByName: user?.displayName || 'Guest' };
        if (type === 'functional') {
            setTestCases((prev: TestCase[]) => prev.map(c => c.id === id ? { ...c, ...update } as TestCase : c));
        } else {
            setApiTestCases((prev: APITestCase[]) => prev.map(c => c.id === id ? { ...c, ...update } : c));
        }

        if (type === 'functional') await TestCaseService.updateStatus(id, status, user);
        else await APITestCaseService.updateStatus(id, status, user, extraData);
    };

    const handleAddModule = async (name: string) => {
        if (!activeProjectId) return;
        await ModuleService.add(name, activeProjectId);
    };

    const handleUpdateModule = async (id: string, name: string) => {
        await ModuleService.update(id, name);
    };

    const handleDeleteModule = async (id: string) => {
        await ModuleService.delete(id);
    };

    const allModules = useMemo(() => {
        const list = [...modules];
        const existingNames = new Set(modules.map(m => m.name.toLowerCase()));

        const discoveredNames = new Set<string>();
        // Always suggest 'General' as it's the system default fallback
        discoveredNames.add('General');

        [...testCases, ...apiTestCases].forEach(tc => {
            if (tc.module && tc.module.trim() !== '') {
                discoveredNames.add(tc.module.trim());
            }
        });

        discoveredNames.forEach(name => {
            if (!existingNames.has(name.toLowerCase())) {
                const isGeneral = name.toLowerCase() === 'general';
                list.push({
                    id: isGeneral ? 'default-general' : `discovered-${name}`,
                    name,
                    projectId: activeProjectId || ''
                } as Module);
            }
        });

        return list.sort((a, b) => a.name.localeCompare(b.name));
    }, [modules, testCases, apiTestCases, activeProjectId]);


    return {
        modules,
        allModules,
        testCases,
        setTestCases, // Exposed for automation / bulk run updates
        apiTestCases,
        setApiTestCases, // Exposed
        readStatus,
        handleTestCaseSave,
        handleAPICaseSave,
        deleteItems,
        updateStatus,
        handleAddModule,
        handleUpdateModule,
        handleDeleteModule
    };
};
