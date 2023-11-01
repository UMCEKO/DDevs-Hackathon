import myqsl from 'mysql2'
import {env} from './env'

export const database = myqsl.createConnection({
	host: env.DB_HOST,
	user: env.DB_USER,
	password: env.DB_PASS,
	database: env.DB_NAME,
	port: env.DB_PORT,
})
