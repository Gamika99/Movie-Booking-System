import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    sidebarOpen: false,
    theme: localStorage.getItem('theme') || 'light',
    loading: false,
    modal: {
        isOpen: false,
        type: null,
        data: null,
    },
    notifications: [],
};

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        toggleSidebar: (state) => {
            state.sidebarOpen = !state.sidebarOpen;
        },
        setSidebarOpen: (state, action) => {
            state.sidebarOpen = action.payload;
        },
        toggleTheme: (state) => {
            state.theme = state.theme === 'light' ? 'dark' : 'light';
            localStorage.setItem('theme', state.theme);
            if (state.theme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        openModal: (state, action) => {
            state.modal.isOpen = true;
            state.modal.type = action.payload.type;
            state.modal.data = action.payload.data || null;
        },
        closeModal: (state) => {
            state.modal.isOpen = false;
            state.modal.type = null;
            state.modal.data = null;
        },
        addNotification: (state, action) => {
            state.notifications.unshift({
                id: Date.now(),
                ...action.payload,
                read: false,
                createdAt: new Date().toISOString(),
            });
        },
        markNotificationRead: (state, action) => {
            const notification = state.notifications.find(n => n.id === action.payload);
            if (notification) {
                notification.read = true;
            }
        },
        clearNotifications: (state) => {
            state.notifications = [];
        },
    },
});

export const {
    toggleSidebar,
    setSidebarOpen,
    toggleTheme,
    setLoading,
    openModal,
    closeModal,
    addNotification,
    markNotificationRead,
    clearNotifications,
} = uiSlice.actions;

export default uiSlice.reducer;