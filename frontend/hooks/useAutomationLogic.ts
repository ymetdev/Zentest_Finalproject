import { useState } from 'react';
import { TestCase, APITestCase, LogEntry, Status } from '../types';
import { TestCaseService, ExecutionHistoryService } from '../services/db';

export const useAutomationLogic = (user: any, activeProjectId: string | null, updateStatus: any) => {
    const [executingId, setExecutingId] = useState<string | null>(null);
    const [lastApiResponse, setLastApiResponse] = useState<any>(null);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isTerminalOpen, setIsTerminalOpen] = useState(false);
    const [isHeadless, setIsHeadless] = useState(false);

    const log = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
        setLogs(prev => [...prev, { msg: `[${new Date().toLocaleTimeString()}] ${msg}`, type }]);
    };

    const handleRunAutomation = async (testCase: TestCase, isBulk = false) => {
        setExecutingId(testCase.id);
        if (!isBulk) {
            setLogs([]);
            setIsTerminalOpen(true);
        }
        log(`Initializing Compass Automation Engine...`);
        log(`Connecting to automation server at ${import.meta.env.VITE_AUTOMATION_SERVER_URL || 'http://localhost:3002'}...`);

        try {
            const steps = testCase.automationSteps || [];
            if (steps.length === 0) {
                log(`Error: No automation steps found. Please import JSON in Automation Hub.`, 'error');
                setExecutingId(null);
                return false;
            }

            log(`Transmitting ${steps.length} execution nodes to headed browser context...`);

            const automationUrl = import.meta.env.VITE_AUTOMATION_SERVER_URL || 'http://localhost:3002';
            const response = await fetch(`${automationUrl}/run`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ steps, headless: isHeadless })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || `Server returned ${response.status}`);
            }

            if (result.logs) {
                result.logs.forEach((l: string) => {
                    if (l.includes('Success')) log(l, 'success');
                    else if (l.includes('Failed')) log(l, 'error');
                    else log(l);
                });
            }

            if (result.status === 'success') {
                log(`>>> AUTOMATION FLOW COMPLETED SUCCESSFULLY`, 'success');
                const isTemp = testCase.id.startsWith('TEMP-');
                const nextRound = (testCase.round || 1) + 1;
                const finalData = {
                    ...testCase,
                    status: 'Passed' as Status,
                    round: nextRound,
                    screenshots: result.screenshots || [],
                    actualResult: 'ระบบทำงานได้ถูกต้องตามขั้นตอนที่กำหนด'
                };

                // Skip Firestore save for demo users or temporary cases
                if (user?.uid === 'demo-user' || isTemp) {
                    updateStatus(testCase.id, 'Passed', 'functional');
                } else {
                    await TestCaseService.save(finalData, false, user);
                    await ExecutionHistoryService.add({
                        testCaseId: testCase.id,
                        projectId: activeProjectId || '',
                        type: 'functional',
                        status: 'Passed',
                        duration: 0,
                        timestamp: Date.now(),
                        executedBy: user.uid,
                        executedByName: user.displayName || 'Unknown',
                        logs: result.logs || []
                    });
                }
                if (!isBulk) setExecutingId(null);
                return result;
            } else {
                log(`>>> AUTOMATION FLOW FAILED: ${result.message}`, 'error');
                const nextRound = (testCase.round || 1) + 1;
                const failedData = {
                    ...testCase,
                    status: 'Failed' as Status,
                    round: nextRound,
                    screenshots: result.screenshots || [],
                    actualResult: `เกิดข้อผิดพลาด: ${result.message || 'ไม่สามารถดำเนินการตามขั้นตอนได้'}`
                };

                // Skip Firestore save for demo users
                if (user?.uid === 'demo-user') {
                    updateStatus(testCase.id, 'Failed', 'functional');
                } else {
                    await TestCaseService.save(failedData, false, user);
                    await ExecutionHistoryService.add({
                        testCaseId: testCase.id,
                        projectId: activeProjectId || '',
                        type: 'functional',
                        status: 'Failed',
                        duration: 0,
                        timestamp: Date.now(),
                        executedBy: user.uid,
                        executedByName: user.displayName || 'Unknown',
                        logs: result.logs || [result.message]
                    });
                }
                if (!isBulk) setExecutingId(null);
                return result;
            }
        } catch (error: any) {
            log(`CRITICAL ERROR: ${error.message}`, 'error');
            if (!isBulk) setExecutingId(null);
            return { status: 'failed', message: error.message };
        }
    };

    const handleRunApiTestCase = async (testCase: APITestCase, isBulk = false) => {
        setExecutingId(testCase.id);
        if (!isBulk) {
            setLogs([]);
            setIsTerminalOpen(true);
        }

        log(`Initializing API Execution for: ${testCase.title}...`);

        try {
            const automationUrl = import.meta.env.VITE_AUTOMATION_SERVER_URL || 'http://localhost:3002';
            const response = await fetch(`${automationUrl}/run-api`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    method: testCase.method,
                    url: testCase.url,
                    headers: testCase.headers?.reduce((acc: any, h: any) => ({ ...acc, [h.key]: h.value }), {}),
                    body: testCase.body
                })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || result.message || 'Unknown Server Error');

            const isSuccess = result.status >= 200 && result.status < 300;
            const expected = parseInt(String(testCase.expectedStatus)) || 200;
            const passed = result.status === expected;
            const status = passed ? 'Passed' : 'Failed';
            const nextRound = (testCase.round || 1) + 1;

            await updateStatus(testCase.id, status, 'api', { actualStatus: result.status, round: nextRound });

            // Skip history save for demo users
            if (user?.uid !== 'demo-user') {
                await ExecutionHistoryService.add({
                    testCaseId: testCase.id,
                    projectId: activeProjectId || '',
                    type: 'api',
                    status: status,
                    duration: result.duration || 0,
                    timestamp: Date.now(),
                    executedBy: user.uid,
                    executedByName: user.displayName || 'Unknown',
                    logs: [`Status: ${result.status}`, `Time: ${result.duration}ms`]
                });
            }

            setLastApiResponse(result);
            if (!isBulk) setExecutingId(null);
            return true;
        } catch (error: any) {
            log(`Execution Error: ${error.message}`, 'error');
            if (!isBulk) setExecutingId(null);
            return false;
        }
    };

    return {
        executingId, setExecutingId,
        lastApiResponse, setLastApiResponse,
        logs, setLogs,
        isTerminalOpen, setIsTerminalOpen,
        isHeadless, setIsHeadless,
        log,
        handleRunAutomation,
        handleRunApiTestCase
    };
};
