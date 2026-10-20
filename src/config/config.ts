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
      },
      "driver-school": {
        "username": process.env.DB_USERNAME,
        "password": process.env.DB_PASSWORD,
        "database": process.env.DRIVER_SCHOOL_DB_DATABASE,
        "host": process.env.DRIVER_SCHOOL_DB_HOST,
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
      },
      "driver-school": {
        "username": process.env.DB_USERNAME,
        "password": process.env.DB_PASSWORD,
        "database": process.env.DRIVER_SCHOOL_DB_DATABASE,
        "host": process.env.DRIVER_SCHOOL_DB_HOST,
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