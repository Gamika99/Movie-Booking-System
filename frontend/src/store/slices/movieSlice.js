import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import movieAPI from '../../api/movieAPI';
import toast from 'react-hot-toast';

export const fetchMovies = createAsyncThunk(
    'movies/fetchMovies',
    async({ page = 1, limit = 10, status, genre, language, search }, { rejectWithValue }) => {
        try {
            const response = await movieAPI.getMovies({ page, limit, status, genre, language, search });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data);
        }
    }
);

export const fetchNowShowing = createAsyncThunk(
    'movies/fetchNowShowing',
    async(limit = 10, { rejectWithValue }) => {
        try {
            const response = await movieAPI.getNowShowing(limit);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data);
        }
    }
);

export const fetchUpcoming = createAsyncThunk(
    'movies/fetchUpcoming',
    async(limit = 10, { rejectWithValue }) => {
        try {
            const response = await movieAPI.getUpcoming(limit);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data);
        }
    }
);

export const fetchMovieById = createAsyncThunk(
    'movies/fetchMovieById',
    async(id, { rejectWithValue }) => {
        try {
            const response = await movieAPI.getMovieById(id);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data);
        }
    }
);

export const createMovie = createAsyncThunk(
    'movies/createMovie',
    async(movieData, { rejectWithValue }) => {
        try {
            const response = await movieAPI.createMovie(movieData);
            toast.success('Movie created successfully');
            return response.data.data;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create movie');
            return rejectWithValue(error.response?.data);
        }
    }
);

export const updateMovie = createAsyncThunk(
    'movies/updateMovie',
    async({ id, movieData }, { rejectWithValue }) => {
        try {
            const response = await movieAPI.updateMovie(id, movieData);
            toast.success('Movie updated successfully');
            return response.data.data;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update movie');
            return rejectWithValue(error.response?.data);
        }
    }
);

export const deleteMovie = createAsyncThunk(
    'movies/deleteMovie',
    async(id, { rejectWithValue }) => {
        try {
            await movieAPI.deleteMovie(id);
            toast.success('Movie deleted successfully');
            return id;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete movie');
            return rejectWithValue(error.response?.data);
        }
    }
);

const initialState = {
    movies: [],
    nowShowing: [],
    upcoming: [],
    currentMovie: null,
    totalPages: 0,
    currentPage: 1,
    totalMovies: 0,
    loading: false,
    error: null,
};

const movieSlice = createSlice({
    name: 'movies',
    initialState,
    reducers: {
        clearCurrentMovie: (state) => {
            state.currentMovie = null;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
        // Fetch Movies
            .addCase(fetchMovies.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchMovies.fulfilled, (state, action) => {
                state.loading = false;
                state.movies = action.payload.data;
                state.totalPages = action.payload.pagination.pages;
                state.currentPage = action.payload.pagination.page;
                state.totalMovies = action.payload.pagination.total;
            })
            .addCase(fetchMovies.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Fetch Now Showing
            .addCase(fetchNowShowing.fulfilled, (state, action) => {
                state.nowShowing = action.payload;
            })
            // Fetch Upcoming
            .addCase(fetchUpcoming.fulfilled, (state, action) => {
                state.upcoming = action.payload;
            })
            // Fetch Movie By ID
            .addCase(fetchMovieById.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchMovieById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentMovie = action.payload;
            })
            .addCase(fetchMovieById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Create Movie
            .addCase(createMovie.fulfilled, (state, action) => {
                state.movies.unshift(action.payload);
            })
            // Update Movie
            .addCase(updateMovie.fulfilled, (state, action) => {
                const index = state.movies.findIndex(m => m._id === action.payload._id);
                if (index !== -1) {
                    state.movies[index] = action.payload;
                }
                if (state.currentMovie?._id === action.payload._id) {
                    state.currentMovie = action.payload;
                }
            })
            // Delete Movie
            .addCase(deleteMovie.fulfilled, (state, action) => {
                state.movies = state.movies.filter(m => m._id !== action.payload);
                if (state.currentMovie?._id === action.payload) {
                    state.currentMovie = null;
                }
            });
    },
});

export const { clearCurrentMovie, clearError } = movieSlice.actions;
export default movieSlice.reducer;