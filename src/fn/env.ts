import { cleanEnv, host, port, str, num, bool } from 'envalid'
import 'dotenv/config'

const env = cleanEnv(process.env, {
	GPT_API_KEY: str(),
	DC_TOKEN: str(),
	DB_HOST: host(),
	DB_USER: str(),
	DB_PASS: str(),
	DB_NAME: str(),
	DB_PORT: port(),
	DAILY_CREDITS: num(),
	CLIENT_ID: str(),
	REGISTER_COMMANDS: bool(),
	STRIPE_LIVE_SECRET_KEY: str(),
	STRIPE_DEV_SECRET_KEY: str(),
	TESTING: bool(),
})

export default env
