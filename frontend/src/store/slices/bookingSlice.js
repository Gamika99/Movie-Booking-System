import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import bookingAPI from '../../api/bookingAPI';
import toast from 'react-hot-toast';

export const initiateBooking = createAsyncThunk(
    'bookings/initiateBooking',
    async(bookingData, { rejectWithValue }) => {
        try {
            const response = await bookingAPI.initiateBooking(bookingData);
            toast.success('Booking initiated! Please complete payment.');
            return response.data.data;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to initiate booking');
            return rejectWithValue(error.response?.data);
        }
    }
);

export const confirmBooking = createAsyncThunk(
    'bookings/confirmBooking',
    async({ bookingId, paymentDetails }, { rejectWithValue }) => {
        try {
            const response = await bookingAPI.confirmBooking(bookingId, paymentDetails);
            toast.success('Booking confirmed! Check your email for details.');
            return response.data.data;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Payment failed');
            return rejectWithValue(error.response?.data);
        }
    }
);

export const cancelBooking = createAsyncThunk(
    'bookings/cancelBooking',
    async({ bookingId, reason }, { rejectWithValue }) => {
        try {
            const response = await bookingAPI.cancelBooking(bookingId, reason);
            toast.success('Booking cancelled successfully');
            return response.data.data;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to cancel booking');
            return rejectWithValue(error.response?.data);
        }
    }
);

export const fetchMyBookings = createAsyncThunk(
    'bookings/fetchMyBookings',
    async({ page = 1, limit = 10, status }, { rejectWithValue }) => {
        try {
            const response = await bookingAPI.getMyBookings({ page, limit, status });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data);
        }
    }
);

export const fetchBookingDetails = createAsyncThunk(
    'bookings/fetchBookingDetails',
    async(bookingId, { rejectWithValue }) => {
        try {
            const response = await bookingAPI.getBookingDetails(bookingId);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data);
        }
    }
);

const initialState = {
    currentBooking: null,
    paymentIntent: null,
    bookings: [],
    totalPages: 0,
    currentPage: 1,
    totalBookings: 0,
    loading: false,
    error: null,
};

const bookingSlice = createSlice({
    name: 'bookings',
    initialState,
    reducers: {
        clearCurrentBooking: (state) => {
            state.currentBooking = null;
            state.paymentIntent = null;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
        // Initiate Booking
            .addCase(initiateBooking.pending, (state) => {
                state.loading = true;
            })
            .addCase(initiateBooking.fulfilled, (state, action) => {
                state.loading = false;
                state.currentBooking = action.payload.booking;
                state.paymentIntent = action.payload.paymentIntent;
            })
            .addCase(initiateBooking.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Confirm Booking
            .addCase(confirmBooking.pending, (state) => {
                state.loading = true;
            })
            .addCase(confirmBooking.fulfilled, (state, action) => {
                state.loading = false;
                state.currentBooking = action.payload.booking;
            })
            .addCase(confirmBooking.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Fetch My Bookings
            .addCase(fetchMyBookings.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchMyBookings.fulfilled, (state, action) => {
                state.loading = false;
                state.bookings = action.payload.bookings;
                state.totalPages = action.payload.pagination.pages;
                state.currentPage = action.payload.pagination.page;
                state.totalBookings = action.payload.pagination.total;
            })
            .addCase(fetchMyBookings.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Fetch Booking Details
            .addCase(fetchBookingDetails.fulfilled, (state, action) => {
                state.currentBooking = action.payload;
            });
    },
});

export const { clearCurrentBooking, clearError } = bookingSlice.actions;
export default bookingSlice.reducer;