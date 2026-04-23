import { useState, useEffect } from 'react';
import { ProjectMember } from '../types';
import { ProjectService } from '../services/db';

export const useProjectMembership = (user: any, activeProjectId: string | null) => {
    const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);

    useEffect(() => {
        if (!activeProjectId || !user) {
            setProjectMembers([]);
            return;
        }

        // 1. Subscribe to members
        const unsubscribe = ProjectService.getMembers(activeProjectId, (members: ProjectMember[]) => {
            setProjectMembers(members);
        });

        // 2. Initial presence update
        const updatePresence = () => {
            ProjectService.updatePresence(activeProjectId, user.uid);
        };
        updatePresence();

        // 3. Heartbeat every 20s
        const interval = setInterval(updatePresence, 20000);

        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, [activeProjectId, user]);

    return { projectMembers };
};
