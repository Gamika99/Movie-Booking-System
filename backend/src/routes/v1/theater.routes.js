const express = require('express');
const router = express.Router();
const theaterController = require('../../controllers/theater.controller');
const { protect } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');
const { uploadMultiple } = require('../../middleware/upload.middleware');

// Public routes
router.get('/city/:city', theaterController.getTheatersByCity);
router.get('/:id', theaterController.getTheaterDetails);

// Admin only routes
router.use(protect);
router.use(authorize('admin', 'super-admin'));

router.post('/',
    uploadMultiple('images', 5),
    theaterController.createTheater
);

router.put('/:id',
    uploadMultiple('images', 5),
    theaterController.updateTheater
);

router.delete('/:id', theaterController.deleteTheater);

module.exports = router;