
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FaTicketAlt, FaFilm, FaTheaterMasks, FaStar, FaClock, FaCalendarAlt } from 'react-icons/fa';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

import { fetchNowShowing, fetchUpcoming } from '../../store/slices/movieSlice';
import MovieCard from '../../components/movies/MovieCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const Home = () => {
  const dispatch = useDispatch();
  const { nowShowing, upcoming, loading } = useSelector((state) => state.movies);
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchNowShowing(12));
    dispatch(fetchUpcoming(8));
  }, [dispatch]);

  const features = [
    {
      icon: <FaTicketAlt className="text-4xl text-primary-500" />,
      title: 'Easy Booking',
      description: 'Book your movie tickets in just a few clicks',
    },
    {
      icon: <FaFilm className="text-4xl text-primary-500" />,
      title: 'Latest Movies',
      description: 'Watch the newest releases in premium quality',
    },
    {
      icon: <FaTheaterMasks className="text-4xl text-primary-500" />,
      title: 'Best Theaters',
      description: 'Choose from top-rated theaters in your city',
    },
  ];

  const banners = [
    {
      image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200',
      title: 'Blockbuster Season',
      subtitle: 'Get 20% off on first booking',
      cta: 'Book Now',
    },
    {
      image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200',
      title: 'Premium Experience',
      subtitle: 'VIP seats at special prices',
      cta: 'Explore',
    },
  ];

  if (loading && nowShowing.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="animate-fade-in">
      {/* Hero Slider */}
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        navigation
        className="h-[500px] lg:h-[600px]"
      >
        {banners.map((banner, index) => (
          <SwiperSlide key={index}>
            <div 
              className="relative h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${banner.image})` }}
            >
              <div className="absolute inset-0 bg-black bg-opacity-50" />
              <div className="relative h-full flex flex-col items-center justify-center text-center text-white px-4">
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-4xl lg:text-6xl font-bold mb-4"
                >
                  {banner.title}
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-xl lg:text-2xl mb-8"
                >
                  {banner.subtitle}
                </motion.p>
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="px-8 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition transform hover:scale-105"
                >
                  {banner.cta}
                </motion.button>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Features Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose MovieBook?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              The best platform for movie enthusiasts
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6 rounded-lg hover:shadow-lg transition"
              >
                <div className="flex justify-center mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Now Showing Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Now Showing
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Currently playing in theaters
              </p>
            </div>
            <Link 
              to="/movies?status=now-showing"
              className="text-primary-500 hover:text-primary-600 font-semibold"
            >
              View All →
            </Link>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {nowShowing.slice(0, 12).map((movie) => (
                <MovieCard key={movie._id} movie={movie} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Upcoming Movies Section */}
      {upcoming.length > 0 && (
        <section className="py-16 bg-white dark:bg-gray-800">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Coming Soon
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Most anticipated movies
                </p>
              </div>
              <Link 
                to="/movies?status=upcoming"
                className="text-primary-500 hover:text-primary-600 font-semibold"
              >
                View All →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {upcoming.map((movie) => (
                <MovieCard key={movie._id} movie={movie} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section for Logged Out Users */}
      {!isAuthenticated && (
        <section className="py-16 bg-gradient-to-r from-primary-600 to-secondary-600">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Ready for a Movie Night?
            </h2>
            <p className="text-white text-lg mb-8 opacity-90">
              Sign up now and get exclusive offers on your first booking!
            </p>
            <Link
              to="/register"
              className="inline-block px-8 py-3 bg-white text-primary-600 rounded-lg font-semibold hover:bg-gray-100 transition transform hover:scale-105"
            >
              Create Account
            </Link>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;