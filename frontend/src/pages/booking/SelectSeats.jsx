import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FaCouch, FaWheelchair, FaInfoCircle, FaArrowLeft, FaTicketAlt } from 'react-icons/fa';
import { fetchShowAvailability } from '../../store/slices/showSlice';
import { setSelectedSeats } from '../../store/slices/bookingSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const SelectSeats = () => {
  const { showId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentShow, availability, loading } = useSelector((state) => state.shows);
  const [selectedSeats, setSelectedSeatsLocal] = useState([]);
  const [seatLayout, setSeatLayout] = useState([]);

  useEffect(() => {
    dispatch(fetchShowAvailability(showId));
  }, [dispatch, showId]);

  // Generate seat layout based on screen configuration
  useEffect(() => {
    if (availability?.totalSeats) {
      generateSeatLayout();
    }
  }, [availability]);

  const generateSeatLayout = () => {
    // Sample seat layout - in production, fetch from backend
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const columns = 12;
    const layout = [];

    rows.forEach((row, rowIndex) => {
      const seats = [];
      for (let col = 1; col <= columns; col++) {
        let type = 'normal';
        let priceMultiplier = 1;
        
        // VIP seats (first row middle seats)
        if (rowIndex === 0 && col >= 4 && col <= 9) {
          type = 'vip';
          priceMultiplier = 2;
        }
        // Premium seats (last 2 rows)
        else if (rowIndex >= rows.length - 2) {
          type = 'premium';
          priceMultiplier = 1.5;
        }
        
        seats.push({
          id: `${row}${col}`,
          row,
          number: col,
          type,
          priceMultiplier,
          isBooked: Math.random() > 0.8, // Mock - replace with real data
          isSelected: false,
        });
      }
      layout.push({ row, seats });
    });
    
    setSeatLayout(layout);
  };

  const handleSeatClick = (seat) => {
    if (seat.isBooked) {
      toast.error('This seat is already booked!');
      return;
    }

    const isSelected = selectedSeats.find(s => s.id === seat.id);
    
    if (isSelected) {
      setSelectedSeatsLocal(selectedSeats.filter(s => s.id !== seat.id));
    } else {
      if (selectedSeats.length >= 10) {
        toast.error('You can only select up to 10 seats per booking');
        return;
      }
      setSelectedSeatsLocal([...selectedSeats, seat]);
    }
  };

  const getSeatColor = (seat) => {
    if (seat.isBooked) return 'bg-gray-400 cursor-not-allowed';
    if (selectedSeats.find(s => s.id === seat.id)) return 'bg-primary-500 text-white scale-105';
    if (seat.type === 'vip') return 'bg-yellow-500 hover:bg-yellow-600';
    if (seat.type === 'premium') return 'bg-purple-500 hover:bg-purple-600';
    return 'bg-green-500 hover:bg-green-600';
  };

  const calculateTotal = () => {
    return selectedSeats.reduce((total, seat) => {
      const basePrice = currentShow?.price || 200;
      return total + (basePrice * seat.priceMultiplier);
    }, 0);
  };

  const handleProceed = () => {
    if (selectedSeats.length === 0) {
      toast.error('Please select at least one seat');
      return;
    }
    
    dispatch(setSelectedSeats(selectedSeats));
    navigate('/checkout', { 
      state: { 
        showId, 
        seats: selectedSeats,
        totalAmount: calculateTotal(),
        show: currentShow
      } 
    });
  };

  if (loading || !availability) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-primary-500 mb-6"
      >
        <FaArrowLeft />
        <span>Back to Shows</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Seat Map */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Select Your Seats
            </h2>
            
            {/* Screen */}
            <div className="mb-8">
              <div className="w-full bg-gray-300 dark:bg-gray-700 h-3 rounded-full mb-2" />
              <p className="text-center text-gray-500 text-sm">SCREEN</p>
            </div>

            {/* Seat Legend */}
            <div className="flex flex-wrap justify-center gap-4 mb-6">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-green-500 rounded" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Available</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-primary-500 rounded" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Selected</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gray-400 rounded" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Booked</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-yellow-500 rounded" />
                <span className="text-sm text-gray-600 dark:text-gray-400">VIP</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-purple-500 rounded" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Premium</span>
              </div>
            </div>

            {/* Seat Grid */}
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                {seatLayout.map((row) => (
                  <div key={row.row} className="flex justify-center mb-2">
                    <div className="w-8 flex items-center justify-center font-bold text-gray-600 dark:text-gray-400">
                      {row.row}
                    </div>
                    <div className="flex gap-2">
                      {row.seats.map((seat) => (
                        <motion.button
                          key={seat.id}
                          whileHover={{ scale: seat.isBooked ? 1 : 1.05 }}
                          whileTap={{ scale: seat.isBooked ? 1 : 0.95 }}
                          onClick={() => handleSeatClick(seat)}
                          disabled={seat.isBooked}
                          className={`w-10 h-10 rounded-t-lg ${getSeatColor(seat)} transition flex items-center justify-center text-sm font-semibold shadow-md`}
                        >
                          {seat.number}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-start space-x-3">
              <FaInfoCircle className="text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-semibold">Booking Tips:</p>
                <ul className="list-disc list-inside mt-1">
                  <li>You have 10 minutes to complete the payment after seat selection</li>
                  <li>VIP seats offer extra legroom and better view</li>
                  <li>Premium seats include complimentary snacks</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sticky top-24">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Booking Summary
            </h3>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Selected Seats:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {selectedSeats.length === 0 ? 'None' : selectedSeats.map(s => s.id).join(', ')}
                </span>
              </div>
              
              {selectedSeats.length > 0 && (
                <>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    {selectedSeats.map((seat) => (
                      <div key={seat.id} className="flex justify-between text-sm mb-2">
                        <span>Seat {seat.id} ({seat.type.toUpperCase()})</span>
                        <span>₹{Math.round((currentShow?.price || 200) * seat.priceMultiplier)}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total Amount:</span>
                      <span className="text-primary-500">₹{calculateTotal()}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      * Convenience fees will be added at checkout
                    </p>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handleProceed}
              disabled={selectedSeats.length === 0}
              className={`w-full py-3 rounded-lg font-semibold transition flex items-center justify-center space-x-2 ${
                selectedSeats.length > 0
                  ? 'bg-primary-500 text-white hover:bg-primary-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <FaTicketAlt />
              <span>Proceed to Checkout</span>
            </button>

            <p className="text-xs text-center text-gray-500 mt-4">
              Seats will be held for 10 minutes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectSeats;