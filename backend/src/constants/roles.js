// backend/src/constants/roles.js
const ROLES = {
    USER: 'user',
    ADMIN: 'admin',
    SUPER_ADMIN: 'super-admin'
};

const ROLE_PERMISSIONS = {
    [ROLES.USER]: [
        'view_movies',
        'view_shows',
        'book_tickets',
        'view_bookings',
        'cancel_bookings',
        'add_reviews'
    ],
    [ROLES.ADMIN]: [
        'view_movies',
        'view_shows',
        'view_bookings',
        'view_users',
        'manage_movies',
        'manage_shows',
        'manage_theaters',
        'manage_screens',
        'view_reports'
    ],
    [ROLES.SUPER_ADMIN]: [
        'view_movies',
        'view_shows',
        'view_bookings',
        'view_users',
        'manage_movies',
        'manage_shows',
        'manage_theaters',
        'manage_screens',
        'view_reports',
        'manage_admins',
        'manage_system_settings'
    ]
};

module.exports = {
    ROLES,
    ROLE_PERMISSIONS
};