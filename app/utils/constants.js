
module.exports = {
    USER_NEAR_BY_DISTANCE: 5000, // 5km
    PARTNER_NEAR_BY_DISTANCE: 50000, // 50km
    PASSWORD_SALT_ROUNDS: 10,
    TWENTY_FOUR_HOURS: 86400, // in seconds
    USER_DEFAULT_NAME: 'Still Anonymous',
    USER_ROLES: {
        FOUNDER: {
            name: 'FOUNDER',
            rank: 0
        },
        SUPER_ADMIN:  {
            name: 'SUPER_ADMIN',
            rank: 1
        },
        ADMIN: {
            name: 'ADMIN',
            rank: 2
        },
        GOD_USER: {
            name: 'GOD_USER',
            rank: 3
        },
        LOCATION_GOD_USER: {
            name: 'LOCATION_GOD_USER',
            rank: 4
        },
        USER: {
            name: 'USER',
            rank: 5
        },
        ANON_USER: {
            name: 'ANON_USER',
            rank: 6
        }
    }
}