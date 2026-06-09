const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const bookingRepository = require('../repositories/booking.repository');
const paymentRepository = require('../repositories/payment.repository');
const userRepository = require('../repositories/user.repository');
const movieRepository = require('../repositories/movie.repository');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

class ReportService {
    async generateBookingReport(startDate, endDate, format = 'excel') {
        const bookings = await bookingRepository.findAll({
            createdAt: { $gte: startDate, $lte: endDate },
            status: 'confirmed'
        }, { limit: 10000 });

        if (format === 'excel') {
            return await this.generateExcelReport(bookings.data, startDate, endDate);
        } else if (format === 'pdf') {
            return await this.generatePDFReport(bookings.data, startDate, endDate);
        } else if (format === 'csv') {
            return await this.generateCSVReport(bookings.data, startDate, endDate);
        }

        throw new ApiError(400, 'Invalid format specified');
    }

    async generateExcelReport(bookings, startDate, endDate) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Booking Report');

        // Add title
        worksheet.mergeCells('A1:H1');
        worksheet.getCell('A1').value = `Booking Report (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`;
        worksheet.getCell('A1').font = { size: 16, bold: true };
        worksheet.getCell('A1').alignment = { horizontal: 'center' };

        // Add headers
        const headers = ['Booking ID', 'User Name', 'Movie', 'Theater', 'Seats', 'Amount', 'Booking Date', 'Status'];
        worksheet.addRow(headers);

        // Style headers
        const headerRow = worksheet.getRow(2);
        headerRow.font = { bold: true };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF6366F1' }
        };

        // Add data
        for (const booking of bookings) {
            const populated = await booking.populate('userId showId');
            worksheet.addRow([
                booking.bookingId,
                populated.userId?.name || 'N/A',
                populated.showId?.movieId?.title || 'N/A',
                populated.showId?.theaterId?.name || 'N/A',
                booking.seats.map(s => s.seatNumber).join(', '),
                booking.finalAmount,
                new Date(booking.createdAt).toLocaleString(),
                booking.status
            ]);
        }

        // Auto-fit columns
        worksheet.columns.forEach(column => {
            let maxLength = 0;
            column.eachCell({ includeEmpty: true }, cell => {
                maxLength = Math.max(maxLength, cell.value ? cell.value.toString().length : 0);
            });
            column.width = Math.min(maxLength + 2, 30);
        });

        // Generate file
        const filePath = path.join(__dirname, '../uploads/temp', `booking_report_${Date.now()}.xlsx`);
        await workbook.xlsx.writeFile(filePath);

        return filePath;
    }

    async generatePDFReport(bookings, startDate, endDate) {
        const filePath = path.join(__dirname, '../uploads/temp', `booking_report_${Date.now()}.pdf`);
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        // Header
        doc.fontSize(20).text('Movie Booking System', { align: 'center' });
        doc.moveDown();
        doc.fontSize(16).text(`Booking Report (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`, { align: 'center' });
        doc.moveDown();

        // Summary
        const totalRevenue = bookings.reduce((sum, b) => sum + b.finalAmount, 0);
        doc.fontSize(12).text(`Total Bookings: ${bookings.length}`);
        doc.text(`Total Revenue: ₹${totalRevenue.toLocaleString()}`);
        doc.text(`Average Ticket Value: ₹${(totalRevenue / bookings.length).toFixed(2)}`);
        doc.moveDown();

        // Bookings table
        bookings.forEach((booking, index) => {
            doc.fontSize(10);
            doc.text(`Booking ${index + 1}: ${booking.bookingId}`, { underline: true });
            doc.text(`Amount: ₹${booking.finalAmount}`);
            doc.text(`Date: ${new Date(booking.createdAt).toLocaleString()}`);
            doc.text(`Seats: ${booking.seats.map(s => s.seatNumber).join(', ')}`);
            doc.moveDown(0.5);
        });

        doc.end();

        return new Promise((resolve) => {
            stream.on('finish', () => resolve(filePath));
        });
    }

    async generateCSVReport(bookings, startDate, endDate) {
        const filePath = path.join(__dirname, '../uploads/temp', `booking_report_${Date.now()}.csv`);
        const writeStream = fs.createWriteStream(filePath);

        // Write headers
        writeStream.write('Booking ID,User Name,Movie,Theater,Seats,Amount,Booking Date,Status\n');

        // Write data
        for (const booking of bookings) {
            const populated = await booking.populate('userId showId');
            const row = [
                booking.bookingId,
                populated.userId?.name || 'N/A',
                populated.showId?.movieId?.title || 'N/A',
                populated.showId?.theaterId?.name || 'N/A',
                `"${booking.seats.map(s => s.seatNumber).join(', ')}"`,
                booking.finalAmount,
                new Date(booking.createdAt).toLocaleString(),
                booking.status
            ];
            writeStream.write(row.join(',') + '\n');
        }

        writeStream.end();

        return new Promise((resolve) => {
            writeStream.on('finish', () => resolve(filePath));
        });
    }

    async generateRevenueReport(startDate, endDate) {
        const payments = await paymentRepository.findAll({
            createdAt: { $gte: startDate, $lte: endDate },
            paymentStatus: 'success'
        }, { limit: 10000 });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Revenue Report');

        // Summary section
        worksheet.mergeCells('A1:D1');
        worksheet.getCell('A1').value = `Revenue Report (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`;

        const totalRevenue = payments.data.reduce((sum, p) => sum + p.amount, 0);
        worksheet.addRow(['Total Revenue', `₹${totalRevenue.toLocaleString()}`]);
        worksheet.addRow(['Total Transactions', payments.data.length]);
        worksheet.addRow(['Average Transaction', `₹${(totalRevenue / payments.data.length).toFixed(2)}`]);

        worksheet.addRow([]);
        worksheet.addRow(['Payment Method', 'Count', 'Total Amount', 'Percentage']);

        // Group by payment method
        const methodStats = {};
        payments.data.forEach(payment => {
            if (!methodStats[payment.paymentMethod]) {
                methodStats[payment.paymentMethod] = { count: 0, amount: 0 };
            }
            methodStats[payment.paymentMethod].count++;
            methodStats[payment.paymentMethod].amount += payment.amount;
        });

        Object.entries(methodStats).forEach(([method, stats]) => {
            worksheet.addRow([
                method,
                stats.count,
                `₹${stats.amount.toLocaleString()}`,
                `${((stats.amount / totalRevenue) * 100).toFixed(1)}%`
            ]);
        });

        const filePath = path.join(__dirname, '../uploads/temp', `revenue_report_${Date.now()}.xlsx`);
        await workbook.xlsx.writeFile(filePath);

        return filePath;
    }

    async cleanupOldReports() {
        const tempDir = path.join(__dirname, '../uploads/temp');
        const files = fs.readdirSync(tempDir);
        const now = Date.now();

        for (const file of files) {
            const filePath = path.join(tempDir, file);
            const stats = fs.statSync(filePath);
            const ageInHours = (now - stats.ctimeMs) / (1000 * 60 * 60);

            if (ageInHours > 24) {
                fs.unlinkSync(filePath);
                logger.info(`Deleted old report: ${file}`);
            }
        }
    }
}

module.exports = new ReportService();