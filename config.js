module.exports = {
  server: {
    port: 9000,
  },

  db: {
    client: 'mysql2',
    connection: {
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: '',
      //  database : 'activity_62',
      database: 'member',
    },
  },

  jwt: {
    secret: '123456',
    options: {
      algorithm: 'HS256',
      expiresIn: 3600000,
    },
  },
}
