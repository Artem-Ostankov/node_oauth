// In-memory storage
module.exports = {
    users: [
        {
            id:             'user1.id',
            username:       'user1.username',
            password:       'user1.password'
        },
        {
            id:             'arieel',
            username:       'artem',
            password:       'pass'
        }
    ],
    clients: [
        {
            id:             'client1.id',
            name:           'client1.name',
            secret:         'client1.secret',
            redirectUri:    'http://example.org/oauth2'
        },
        {
            id:             'client2.id',
            name:           'client2.name',
            secret:         'client2.Secret',
            redirectUri:    'http://example.org/oauth2'
        },
        {
            id:             'lazy1',
            name:           'lazy_site',
            secret:         'lazy_secret',
            redirectUri:    'http://localhost:3000/client.html'
        }
    ],
    codes: [],
    accessTokens: [],
    refreshTokens: []
};