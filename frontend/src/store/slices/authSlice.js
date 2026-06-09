import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authAPI from '../../api/authAPI';
import toast from 'react-hot-toast';

// Async Thunks
export const login = createAsyncThunk(
    'auth/login',
    async(credentials, { rejectWithValue }) => {
        try {
            const response = await authAPI.login(credentials);
            localStorage.setItem('token', response.data.data.accessToken);
            localStorage.setItem('refreshToken', response.data.data.refreshToken);
            localStorage.setItem('user', JSON.stringify(response.data.data.user));
            toast.success('Login successful!');
            return response.data.data;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Login failed');
            return rejectWithValue(error.response?.data);
        }
    }
);

export const register = createAsyncThunk(
    'auth/register',
    async(userData, { rejectWithValue }) => {
        try {
            const response = await authAPI.register(userData);
            toast.success('Registration successful! Please verify your email.');
            return response.data.data;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed');
            return rejectWithValue(error.response?.data);
        }
    }
);

export const logout = createAsyncThunk(
    'auth/logout',
    async(_, { rejectWithValue }) => {
        try {
            await authAPI.logout();
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            toast.success('Logged out successfully');
            return true;
        } catch (error) {
            return rejectWithValue(error.response?.data);
        }
    }
);

export const getCurrentUser = createAsyncThunk(
    'auth/getCurrentUser',
    async(_, { rejectWithValue }) => {
        try {
            const response = await authAPI.getCurrentUser();
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data);
        }
    }
);

export const forgotPassword = createAsyncThunk(
    'auth/forgotPassword',
    async(email, { rejectWithValue }) => {
        try {
            const response = await authAPI.forgotPassword(email);
            toast.success('Password reset link sent to your email');
            return response.data.data;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send reset link');
            return rejectWithValue(error.response?.data);
        }
    }
);

export const resetPassword = createAsyncThunk(
    'auth/resetPassword',
    async({ token, password, confirmPassword }, { rejectWithValue }) => {
        try {
            const response = await authAPI.resetPassword({ token, password, confirmPassword });
            toast.success('Password reset successful! Please login.');
            return response.data.data;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Password reset failed');
            return rejectWithValue(error.response?.data);
        }
    }
);

const initialState = {
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: !!localStorage.getItem('token'),
    loading: false,
    error: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        updateUser: (state, action) => {
            state.user = {...state.user, ...action.payload };
            localStorage.setItem('user', JSON.stringify(state.user));
        },
    },
    extraReducers: (builder) => {
        builder
        // Login
            .addCase(login.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.loading = false;
                state.isAuthenticated = true;
                state.user = action.payload.user;
                state.token = action.payload.accessToken;
            })
            .addCase(login.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Register
            .addCase(register.pending, (state) => {
                state.loading = true;
            })
            .addCase(register.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(register.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Logout
            .addCase(logout.fulfilled, (state) => {
                state.user = null;
                state.token = null;
                state.isAuthenticated = false;
            })
            // Get Current User
            .addCase(getCurrentUser.fulfilled, (state, action) => {
                state.user = action.payload;
                localStorage.setItem('user', JSON.stringify(action.payload));
            });
    },
});

export const { clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;