import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { 
  FaUsers, FaFilm, FaTheaterMasks, FaTicketAlt, 
  FaRupeeSign, FaCalendarWeek, FaChartLine, FaDownload 
} from 'react-icons/fa';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, 
  Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer 
} from 'recharts';
import { fetchDashboardStats, fetchRevenueAnalytics } from '../../store/slices/adminSlice';
import StatsCard from '../../components/admin/StatsCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { dashboardStats, revenueAnalytics, loading } = useSelector((state) => state.admin);
  const [dateRange, setDateRange] = useState('week');

  useEffect(() => {
    dispatch(fetchDashboardStats());
    const endDate = new Date();
    const startDate = new Date();
    if (dateRange === 'week') startDate.setDate(startDate.getDate() - 7);
    if (dateRange === 'month') startDate.setMonth(startDate.getMonth() - 1);
    if (dateRange === 'year') startDate.setFullYear(startDate.getFullYear() - 1);
    
    dispatch(fetchRevenueAnalytics({ startDate, endDate, groupBy: 'day' }));
  }, [dispatch, dateRange]);

  if (loading || !dashboardStats) {
    return <LoadingSpinner />;
  }

  const stats = [
    {
      title: 'Total Users',
      value: dashboardStats.overview?.totalUsers || 0,
      icon: <FaUsers className="text-3xl text-blue-500" />,
      color: 'bg-blue-500',
      change: '+12%',
    },
    {
      title: 'Total Movies',
      value: dashboardStats.overview?.totalMovies || 0,
      icon: <FaFilm className="text-3xl text-green-500" />,
      color: 'bg-green-500',
      change: '+5%',
    },
    {
      title: 'Total Theaters',
      value: dashboardStats.overview?.totalTheaters || 0,
      icon: <FaTheaterMasks className="text-3xl text-purple-500" />,
      color: 'bg-purple-500',
      change: '+2%',
    },
    {
      title: 'Total Bookings',
      value: dashboardStats.overview?.totalBookings || 0,
      icon: <FaTicketAlt className="text-3xl text-orange-500" />,
      color: 'bg-orange-500',
      change: dashboardStats.bookings?.today || 0,
      changeLabel: 'today',
    },
    {
      title: 'Total Revenue',
      value: `₹${(dashboardStats.overview?.totalRevenue || 0).toLocaleString()}`,
      icon: <FaRupeeSign className="text-3xl text-yellow-500" />,
      color: 'bg-yellow-500',
      change: `+${dashboardStats.bookings?.thisWeek || 0}`,
      changeLabel: 'this week',
    },
    {
      title: 'This Month',
      value: dashboardStats.bookings?.thisMonth || 0,
      icon: <FaCalendarWeek className="text-3xl text-red-500" />,
      color: 'bg-red-500',
      change: `${((dashboardStats.bookings?.thisMonth / (dashboardStats.overview?.totalBookings || 1)) * 100).toFixed(1)}%`,
      changeLabel: 'of total',
    },
  ];

  const bookingData = [
    { name: 'Mon', bookings: 45 },
    { name: 'Tue', bookings: 52 },
    { name: 'Wed', bookings: 48 },
    { name: 'Thu', bookings: 61 },
    { name: 'Fri', bookings: 89 },
    { name: 'Sat', bookings: 124 },
    { name: 'Sun', bookings: 98 },
  ];

  const revenueData = revenueAnalytics?.data || [];

  const pieData = dashboardStats.users?.map(stat => ({
    name: stat._id,
    value: stat.count,
  })) || [];

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome back! Here's what's happening with your business today.
          </p>
        </div>
        <div className="flex space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last Year</option>
          </select>
          <button className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition flex items-center space-x-2">
            <FaDownload />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Revenue Overview
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#6366f1" name="Revenue (₹)" />
              <Line type="monotone" dataKey="transactions" stroke="#10b981" name="Transactions" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Bookings Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Weekly Bookings
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={bookingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="bookings" fill="#6366f1" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            User Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h3>
          <div className="space-y-4">
            {dashboardStats.recentBookings?.slice(0, 5).map((booking, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Booking #{booking.bookingId}
                  </p>
                  <p className="text-sm text-gray-500">{new Date(booking.createdAt).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">₹{booking.finalAmount}</p>
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                    Confirmed
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* System Health */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          System Health
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">API Status</p>
              <p className="text-lg font-semibold text-green-600">Operational</p>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          </div>
          <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Database</p>
              <p className="text-lg font-semibold text-green-600">Connected</p>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          </div>
          <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Cache (Redis)</p>
              <p className="text-lg font-semibold text-green-600">Active</p>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;