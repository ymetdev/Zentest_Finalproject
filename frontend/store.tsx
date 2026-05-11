import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Project, ModalMode } from './types';

interface ProjectContextType {
    activeProjectId: string | null;
    setActiveProjectId: (id: string | null) => void;
    activeProject: Project | null;
    setActiveProject: (project: Project | null) => void;
    viewMode: 'functional' | 'api' | 'dashboard';
    setViewMode: (mode: 'functional' | 'api' | 'dashboard') => void;
    modalMode: ModalMode;
    setModalMode: (mode: ModalMode) => void;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
    const [activeProject, setActiveProject] = useState<Project | null>(null);
    const [viewMode, setViewMode] = useState<'functional' | 'api' | 'dashboard'>('functional');
    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        <ProjectContext.Provider value={{
            activeProjectId, setActiveProjectId,
            activeProject, setActiveProject,
            viewMode, setViewMode,
            modalMode, setModalMode,
            isSidebarOpen, setIsSidebarOpen
        }}>
            {children}
        </ProjectContext.Provider>
    );
};

export const useProject = () => {
    const context = useContext(ProjectContext);
    if (!context) {
        throw new Error('useProject must be used within a ProjectProvider');
    }
    return context;
};
