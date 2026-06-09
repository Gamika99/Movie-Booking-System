const reportService = require('../services/report.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const fs = require('fs');

class ReportController {
    generateBookingReport = asyncHandler(async(req, res) => {
        const { startDate, endDate, format = 'excel' } = req.query;

        const filePath = await reportService.generateBookingReport(
            new Date(startDate),
            new Date(endDate),
            format
        );

        const fileName = `booking_report_${startDate}_to_${endDate}.${format === 'excel' ? 'xlsx' : format}`;

        res.download(filePath, fileName, (err) => {
            if (err) {
                console.error('Download error:', err);
            }
            // Clean up file after download
            setTimeout(() => {
                fs.unlinkSync(filePath);
            }, 5000);
        });
    });

    generateRevenueReport = asyncHandler(async(req, res) => {
        const { startDate, endDate } = req.query;

        const filePath = await reportService.generateRevenueReport(
            new Date(startDate),
            new Date(endDate)
        );

        res.download(filePath, `revenue_report_${startDate}_to_${endDate}.xlsx`, (err) => {
            if (err) console.error('Download error:', err);
            setTimeout(() => fs.unlinkSync(filePath), 5000);
        });
    });
}

module.exports = new ReportController();