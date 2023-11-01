import { cleanEnv, str } from 'envalid'

export const env = cleanEnv(process.env, {
	GPT_API_KEY: str(),
	DC_TOKEN: str(),
})
