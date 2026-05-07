import dotenv from 'dotenv'
import mysql from 'mysql2/promise'

dotenv.config()

let pool = null
let dbMode = 'demo'
let dbMessage = 'Using demo data because MySQL is not configured.'

export async function initDatabase() {
  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env

  if (!DB_HOST || !DB_USER || !DB_NAME) {
    dbMode = 'demo'
    dbMessage = 'MySQL credentials not found. Falling back to demo data.'
    return { mode: dbMode, message: dbMessage }
  }

  try {
    pool = mysql.createPool({
      host: DB_HOST,
      port: Number(DB_PORT || 3306),
      user: DB_USER,
      password: DB_PASSWORD || '',
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      multipleStatements: true,
    })

    await pool.query('SELECT 1')
    dbMode = 'mysql'
    dbMessage = `Connected to MySQL database "${DB_NAME}".`
  } catch (error) {
    pool = null
    dbMode = 'demo'
    dbMessage = `MySQL unavailable. Falling back to demo data. ${error.message}`
  }

  return { mode: dbMode, message: dbMessage }
}

export function getPool() {
  return pool
}

export function isMysqlReady() {
  return Boolean(pool)
}

export function getDatabaseStatus() {
  return { mode: dbMode, message: dbMessage }
}
