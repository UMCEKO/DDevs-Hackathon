import { cleanEnv, host, port, str, num } from 'envalid'
import 'dotenv/config'

const env = cleanEnv(process.env, {
	GPT_API_KEY: str(),
	DC_TOKEN: str(),
	DB_HOST: host(),
	DB_USER: str(),
	DB_PASS: str(),
	DB_NAME: str(),
	DB_PORT: port(),
	DAILY_TOKENS: num(),
	CLIENT_ID: str(),
})

export default env
