const Payment = require('../models/payment.model');
const BaseRepository = require('./base.repository');

class PaymentRepository extends BaseRepository {
    constructor() {
        super(Payment);
    }

    async findPaymentByTransactionId(transactionId) {
        return await this.model.findOne({ transactionId });
    }

    async findPaymentsByBooking(bookingId) {
        return await this.model.find({ bookingId }).sort({ createdAt: -1 });
    }

    async updatePaymentStatus(paymentId, status, gatewayResponse) {
        const updateData = {
            paymentStatus: status,
            gatewayResponse
        };

        if (status === 'success') {
            updateData.transactionId = gatewayResponse.transactionId;
        }

        return await this.update(paymentId, updateData);
    }

    async getUserPaymentHistory(userId, pagination = {}) {
        const { page = 1, limit = 10 } = pagination;
        const skip = (page - 1) * limit;

        const payments = await this.model.find({ userId })
            .populate('bookingId')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await this.model.countDocuments({ userId });

        return { payments, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
    }

    async getRevenueStats(startDate, endDate) {
        const pipeline = [{
                $match: {
                    paymentStatus: 'success',
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' },
                        paymentMethod: '$paymentMethod'
                    },
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 }
            }
        ];

        return await this.model.aggregate(pipeline);
    }
}

module.exports = new PaymentRepository();