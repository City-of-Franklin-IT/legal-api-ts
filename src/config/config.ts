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
      "traffic-citation": {
        "username": process.env.DB_USERNAME,
        "password": process.env.DB_PASSWORD,
        "database": process.env.TRAFFIC_CITATION_DB_DATABASE,
        "host": process.env.TRAFFIC_CITATION_DB_HOST,
        "dialect": "mssql",
        "dialectOptions": {
          useUTC: true
        },
        "timezone": "+00:00",
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
      "traffic-citation": {
        "username": process.env.DB_USERNAME,
        "password": process.env.DB_PASSWORD,
        "database": process.env.TRAFFIC_CITATION_DB_DATABASE,
        "host": process.env.TRAFFIC_CITATION_DB_HOST,
        "dialect": "mssql",
        "dialectOptions": {
          useUTC: true
        },
        "timezone": "+00:00",
        "logging": false
      }
    }
  }
}