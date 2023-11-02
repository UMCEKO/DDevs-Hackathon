import * as mysql from 'mysql2'
import {DatabaseParams} from './complexfn'
import env from "./env";

interface Queue {
	queueID: number
	prompt: Uint8Array
	chatID: string
	messageID: string
	author: string
	fromgroup: boolean
	groupid: string
	platform: 'discord' | 'whatsapp' | 'telegram'
	locale: string
}
export const database = mysql.createConnection({
	database: env.DB_NAME,
	user: env.DB_USER,
	password: env.DB_PASS,
	host: `${env.DB_HOST}`
})

class User {
	constructor(userid: string) {
		this.user_id = userid
	}
	id?: number
	user_id: string
	role_id: number = 0
	daily_token_payout: number = 0
	paid_tokens: number = 0
	daily_tokens: number = 0
	banned: boolean = false
}

interface Group {
	group_id: string
	group_tokens: number
	is_blacklisted: boolean
	auto_moderation: boolean
}

class SQLOrm {
	async getUser(targetUser: string): Promise<User> {
		let QRes = (await QueryDB(`SELECT * FROM users WHERE user_id = '${targetUser}'`)) as User[]
		if (QRes.length !== 0) return QRes[0]
		try {
			await ExecuteDB(
				`INSERT INTO users(user_id, daily_tokens) VALUES ('${targetUser}', ${env.DAILY_TOKENS});`,
			)
		} catch (e) {
			console.log(e)
			console.log(QRes)
			QRes = (await QueryDB(`SELECT * FROM users WHERE user_id = '${targetUser}'`)) as User[]
			console.log(QRes)
		}
		await this.calculateTokenPayouts()
		QRes = (await QueryDB(`SELECT * FROM users WHERE user_id = '${targetUser}'`)) as User[]
		if (QRes) return QRes[0]
		else throw 'Error whilst getting an user after creating it.'
	}
	async calculateTokenPayouts() {
		await ExecuteDB(`UPDATE users
    SET daily_token_payout = (
    SELECT daily_tokens
    FROM roles
    WHERE roles.role_id = users.role_id
    )`)
	}
	async banUser(userid: string) {
		await ExecuteDB(`UPDATE users SET users.banned = not users.banned WHERE user_id = '${userid}';`)
	}
	async getGroup(groupId: string): Promise<Group | null> {
		let dbRes = (await QueryDB(`SELECT * FROM servers WHERE group_id = '${groupId}';`)) as Group[]
		if (dbRes.length !== 0) {
			return dbRes[0]
		}
		await ExecuteDB(`INSERT INTO servers(group_id) VALUES ('${groupId}');`)
		dbRes = (await QueryDB(`SELECT * FROM servers WHERE group_id = '${groupId}';`)) as Group[]
		if (!dbRes) throw 'Error whilst creating a group in database.'
		return dbRes[0]
	}
	async banGroup(groupid: string) {
		await ExecuteDB(
			`UPDATE servers SET servers.is_blacklisted = not servers.is_blacklisted WHERE group_id = '${groupid}';`,
		)
	}
	totalTokens(user: User, dbgroup: Group | null) {
		return user.daily_tokens + user.paid_tokens + (dbgroup?.group_tokens ? dbgroup.group_tokens : 0)
	}
	async resetTokens() {
		await ExecuteDB(`
UPDATE users
SET daily_tokens = daily_token_payout;
`)
	}

	async useToken(user: User, tokenAmount: number, dbgroup: Group | null, force = true) {
		if (tokenAmount === 0) return true
		if (!force && user.daily_tokens + user.paid_tokens + (dbgroup?.group_tokens || 0) < tokenAmount)
			return false
		if (!Number.isInteger(tokenAmount)) return false
		let toBeSubbed = tokenAmount

		if (dbgroup && dbgroup.group_tokens !== 0) {
			if (dbgroup.group_tokens >= toBeSubbed) {
				await changeGroupCredits(dbgroup.group_id, -toBeSubbed)
				return true
			} else {
				toBeSubbed -= dbgroup.group_tokens
				await changeGroupCredits(dbgroup.group_id, -dbgroup.group_tokens)
			}
		}

		if (toBeSubbed && user.daily_tokens) {
			if (user.daily_tokens >= toBeSubbed) {
				user.daily_tokens -= toBeSubbed
				toBeSubbed = 0
			} else {
				toBeSubbed -= user.daily_tokens
				user.daily_tokens = 0
			}
		}
		if (toBeSubbed && user.paid_tokens) {
			if (user.paid_tokens >= toBeSubbed) {
				user.paid_tokens -= toBeSubbed
				toBeSubbed = 0
			} else {
				toBeSubbed -= user.paid_tokens
				user.paid_tokens = 0
			}
		}
		await ExecuteDB(`UPDATE users
SET paid_tokens = ${user.paid_tokens}, daily_tokens = ${user.daily_tokens}
WHERE user_id = '${user.user_id}';`)
		return toBeSubbed === 0

		// console.log({toBeSubbed: toBeSubbed, groupSubAmt: groupSubAmt, dailySubAmt: dailySubAmt, paidSubAmt: paidSubAmt})
	}
}

export const db: SQLOrm = new SQLOrm()
async function QueryDB(sql: string, values: string[] = []): Promise<any[] > {
	return new Promise<any[]>((resolve, reject) => {
		database.query(sql, values, (err, results: any[]) => {
			if (err) {
				reject(err)
			}
			resolve(results)
		})
	})
}

async function changeUserCredits(author: string, tokenAmt: number, paid = false) {
	if (paid) {
		await ExecuteDB(
			`UPDATE users SET paid_tokens = users.paid_tokens + ${tokenAmt} WHERE user_id = '${author}';`,
		)
	} else {
		await ExecuteDB(
			`UPDATE users SET daily_tokens = users.daily_tokens + ${tokenAmt} WHERE user_id = '${author}';`,
		)
	}
}

async function changeGroupCredits(groupid: string, tokenDelta: number) {
	await ExecuteDB(
		`UPDATE servers SET servers.group_tokens = servers.group_tokens + ${tokenDelta} WHERE group_id = '${groupid}';`,
	)
}

async function setGroupCredits(groupid: string, tokenCnt: number) {
	await ExecuteDB(
		`UPDATE servers SET servers.group_tokens = ${tokenCnt} WHERE group_id = '${groupid}';`,
	)
}

async function ExecuteDB(sql: string) {
	return new Promise((resolve, reject) => {
		database.query(sql, (err: undefined) => {
			if (err) {
				reject(err)
			}
			resolve(true)
		})
	})
}
function sanitizeInput(str: string) {
	str = str.replaceAll('\\', '\\\\')
	str = str.replaceAll(`'`, `''`)
	return str
}
async function addQueue(
	requestParams: DatabaseParams,
	chatID: string,
	messageID: string,
	author: string,
	groupid: string | null,
	platform: 'whatsapp' | 'discord' | 'telegram',
	locale: string | undefined,
) {
	await ExecuteDB(
		`INSERT INTO queue (prompt, chatID, messageID, author, fromgroup, groupid, platform, locale) VALUES ( '${sanitizeInput(
			JSON.stringify(requestParams),
		)}', '${chatID}', '${messageID}', '${author}', ${Boolean(
			groupid,
		)}, '${groupid}', '${platform}', '${locale}')`,
	)
}

async function clearExpiredCooldowns(cooldown: number) {
	const currDateSeconds = Math.floor(Date.now() / 1000)
	const sql = `DELETE FROM cooldownQueue WHERE sentDate < ${currDateSeconds - cooldown};`
	await ExecuteDB(sql)
}

async function getQueue(): Promise<Queue[]> {
	const sql = `SELECT * FROM queue ORDER BY queueID;`
	return await QueryDB(sql)
}

async function setAutoMod(groupid: string) {
	await ExecuteDB(
		`UPDATE servers SET servers.auto_moderation = not servers.auto_moderation WHERE group_id = '${groupid}';`,
	)
}

async function setRole(userId: string, targetRole: number) {
	await ExecuteDB(`UPDATE users SET role_id = ${targetRole} WHERE user_id = '${userId}';`)
	await db.calculateTokenPayouts()
}
async function removeQueue(queueID: number) {
	await ExecuteDB(`DELETE FROM queue WHERE queueID=${queueID};`)
}

async function getNextPrompt(): Promise<Queue> {
	return (await QueryDB(`SELECT * FROM queue ORDER BY queueID LIMIT 1;`))[0]
}

export {
	SQLOrm,
	ExecuteDB,
	Group,
	QueryDB,
	Queue,
	User,
	addQueue,
	changeGroupCredits,
	changeUserCredits,
	clearExpiredCooldowns,
	getNextPrompt,
	getQueue,
	removeQueue,
	setAutoMod,
	setGroupCredits,
	setRole,
}
