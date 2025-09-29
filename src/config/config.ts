const dotenv = require('dotenv')

dotenv.config({ path: 'config/config.env' })

export default {
  "development": {
    "databases": {
      "city-law": {
        "username": process.env.DB_USERNAME,
        "password": process.env.DB_PASSWORD,
        "database": process.env.CITY_LAW_DB_DATABASE,
        "host": process.env.CITY_LAW_DB_HOST,
        "dialect": "mssql",
        "dialectOptions": {
          useUTC: true
        },
        "timezone": "US/Chicago",
        "logging": false
      }
    }
  },
  "production": {
    "databases": {
      "city-law": {
        "username": process.env.DB_USERNAME,
        "password": process.env.DB_PASSWORD,
        "database": process.env.CITY_LAW_DB_DATABASE,
        "host": process.env.CITY_LAW_DB_HOST,
        "dialect": "mssql",
        "dialectOptions": {
          useUTC: true
        },
        "timezone": "US/Chicago",
        "logging": false
      }
    }
  }
}