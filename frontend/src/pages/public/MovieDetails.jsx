
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { 
  FaStar, FaClock, FaCalendarAlt, FaLanguage, 
  FaTicketAlt, FaTheaterMasks, FaUsers, FaThumbsUp,
  FaShare, FaBookmark, FaFilm, FaUserFriends
} from 'react-icons/fa';
import { fetchMovieById } from '../../store/slices/movieSlice';
import { fetchShowsByMovieCity } from '../../store/slices/showSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ReviewSection from '../../components/movies/ReviewSection';
import DateSelector from '../../components/booking/DateSelector';
import TheaterList from '../../components/movies/TheaterList';

const MovieDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentMovie, loading } = useSelector((state) => state.movies);
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCity, setSelectedCity] = useState('Mumbai');
  const [activeTab, setActiveTab] = useState('shows');

  useEffect(() => {
    dispatch(fetchMovieById(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (currentMovie && selectedDate && selectedCity) {
      dispatch(fetchShowsByMovieCity({ 
        movieId: id, 
        city: selectedCity, 
        date: selectedDate 
      }));
    }
  }, [dispatch, id, selectedDate, selectedCity, currentMovie]);

  if (loading || !currentMovie) {
    return <LoadingSpinner />;
  }

  const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad'];

  return (
    <div className="animate-fade-in">
      {/* Hero Section with Backdrop */}
      <div 
        className="relative h-[500px] bg-cover bg-center"
        style={{ 
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.8)), url(${currentMovie.poster})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 20%'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
        
        <div className="relative container mx-auto px-4 h-full flex items-end pb-12">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Poster */}
            <motion.img
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              src={currentMovie.poster}
              alt={currentMovie.title}
              className="w-48 lg:w-64 rounded-lg shadow-2xl border-4 border-white"
            />
            
            {/* Details */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 text-white"
            >
              <h1 className="text-3xl lg:text-5xl font-bold mb-4">{currentMovie.title}</h1>
              
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex items-center space-x-1">
                  <FaStar className="text-yellow-400" />
                  <span className="font-semibold">{currentMovie.rating?.toFixed(1) || 'N/A'}</span>
                  <span className="text-gray-300">({currentMovie.totalRatings} ratings)</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FaClock />
                  <span>{currentMovie.duration} mins</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FaCalendarAlt />
                  <span>{new Date(currentMovie.releaseDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FaLanguage />
                  <span>{currentMovie.language?.join(', ')}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {currentMovie.genre?.map((g, i) => (
                  <span key={i} className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">
                    {g}
                  </span>
                ))}
              </div>

              <p className="text-gray-200 mb-6 max-w-2xl">
                {currentMovie.description}
              </p>

              <div className="flex gap-4">
                <button 
                  onClick={() => setActiveTab('shows')}
                  className="px-6 py-2 bg-primary-500 rounded-lg hover:bg-primary-600 transition flex items-center space-x-2"
                >
                  <FaTicketAlt />
                  <span>Book Tickets</span>
                </button>
                <button className="px-6 py-2 border border-white rounded-lg hover:bg-white hover:text-gray-900 transition flex items-center space-x-2">
                  <FaShare />
                  <span>Share</span>
                </button>
                <button className="px-6 py-2 border border-white rounded-lg hover:bg-white hover:text-gray-900 transition flex items-center space-x-2">
                  <FaBookmark />
                  <span>Watchlist</span>
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="container mx-auto px-4 py-8">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('shows')}
              className={`pb-3 px-1 font-semibold transition ${
                activeTab === 'shows'
                  ? 'text-primary-500 border-b-2 border-primary-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Showtimes & Booking
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`pb-3 px-1 font-semibold transition ${
                activeTab === 'reviews'
                  ? 'text-primary-500 border-b-2 border-primary-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Reviews & Ratings
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-3 px-1 font-semibold transition ${
                activeTab === 'details'
                  ? 'text-primary-500 border-b-2 border-primary-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Movie Details
            </button>
          </div>
        </div>

        {/* Showtimes Tab */}
        {activeTab === 'shows' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8"
          >
            {/* City Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select City
              </label>
              <div className="flex flex-wrap gap-2">
                {cities.map((city) => (
                  <button
                    key={city}
                    onClick={() => setSelectedCity(city)}
                    className={`px-4 py-2 rounded-lg transition ${
                      selectedCity === city
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Selector */}
            <DateSelector 
              selectedDate={selectedDate} 
              onDateChange={setSelectedDate}
            />

            {/* Theater List */}
            <TheaterList 
              movieId={id}
              city={selectedCity}
              date={selectedDate}
            />
          </motion.div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8"
          >
            <ReviewSection movieId={id} movie={currentMovie} />
          </motion.div>
        )}

        {/* Details Tab */}
        {activeTab === 'details' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-2">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Synopsis</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {currentMovie.description}
              </p>

              {currentMovie.cast?.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Cast</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {currentMovie.cast.map((actor, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        {actor.image ? (
                          <img src={actor.image} alt={actor.name} className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                            <FaUserFriends className="text-primary-500" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{actor.name}</p>
                          <p className="text-sm text-gray-500">{actor.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Movie Info</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Director</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {currentMovie.crew?.find(c => c.role === 'Director')?.name || 'TBA'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="font-medium text-gray-900 dark:text-white">{currentMovie.duration} minutes</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Languages</p>
                    <p className="font-medium text-gray-900 dark:text-white">{currentMovie.language?.join(', ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Genres</p>
                    <p className="font-medium text-gray-900 dark:text-white">{currentMovie.genre?.join(', ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Release Date</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(currentMovie.releaseDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MovieDetails;