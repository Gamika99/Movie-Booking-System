const Screen = require('../models/screen.model');
const BaseRepository = require('./base.repository');

class ScreenRepository extends BaseRepository {
    constructor() {
        super(Screen);
    }

    async findByTheater(theaterId) {
        return await this.model.find({ theaterId, isActive: true })
            .sort({ name: 1 });
    }

    async getScreenWithSeats(screenId) {
        const screen = await this.model.findById(screenId)
            .populate('seats');
        return screen;
    }

    async createScreenWithSeats(screenData, seatLayout) {
        const session = await this.model.startSession();
        session.startTransaction();

        try {
            // Create screen
            const screen = await this.model.create([screenData], { session });

            // Create seats based on layout
            const Seat = require('../models/seat.model');
            const seats = [];

            for (let row = 0; row < seatLayout.rows; row++) {
                const rowChar = String.fromCharCode(65 + row); // A, B, C, etc.
                for (let seatNum = 1; seatNum <= seatLayout.columns; seatNum++) {
                    let seatType = 'Normal';
                    let priceMultiplier = 1.0;

                    // Define premium rows (e.g., last 2 rows are premium)
                    if (row >= seatLayout.rows - 2) {
                        seatType = 'Premium';
                        priceMultiplier = 1.5;
                    }

                    // Define VIP seats (e.g., first row middle seats)
                    if (row === 0 && seatNum >= Math.floor(seatLayout.columns / 2) - 1 &&
                        seatNum <= Math.floor(seatLayout.columns / 2) + 1) {
                        seatType = 'VIP';
                        priceMultiplier = 2.0;
                    }

                    seats.push({
                        screenId: screen[0]._id,
                        row: rowChar,
                        number: seatNum,
                        seatType,
                        priceMultiplier,
                        isActive: true
                    });
                }
            }

            await Seat.insertMany(seats, { session });
            await session.commitTransaction();

            return screen[0];
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }
}

module.exports = new ScreenRepository();