import * as mysql from 'mysql2'
import { DatabaseParams } from './complexfn'
import env from './env'

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
	host: `${env.DB_HOST}`,
})

class User {
	constructor(userid: string) {
		this.user_id = userid
	}
	id?: number
	user_id: string
	daily_credit_payout: number = 0
	paid_credits: number = 0
	daily_credits: number = 0
	banned: boolean = false
}

interface Group {
	group_id: string
	group_credits: number
	is_blacklisted: boolean
	auto_moderation: boolean
}

class SQLOrm {
	async getUser(targetUser: string): Promise<User> {
		let QRes = (await QueryDB(`SELECT * FROM users WHERE user_id = '${targetUser}'`)) as User[]
		if (QRes.length !== 0) return QRes[0]
		try {
			await ExecuteDB(
				`INSERT INTO users(user_id, daily_credits, daily_credit_payout) VALUES ('${targetUser}', ${env.DAILY_CREDITS}, ${env.DAILY_CREDITS});`,
			)
		} catch (e) {
			console.log(e)
			console.log(QRes)
			QRes = (await QueryDB(`SELECT * FROM users WHERE user_id = '${targetUser}'`)) as User[]
			console.log(QRes)
		}
		QRes = (await QueryDB(`SELECT * FROM users WHERE user_id = '${targetUser}'`)) as User[]
		if (QRes) return QRes[0]
		else throw 'Error whilst getting an user after creating it.'
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
	totalCredits(user: User, dbgroup: Group | null) {
		return (
			user.daily_credits + user.paid_credits + (dbgroup?.group_credits ? dbgroup.group_credits : 0)
		)
	}
	async resetCredits() {
		await ExecuteDB(`
UPDATE users
SET daily_credits = daily_credit_payout;
`)
	}

	async useCredits(user: User, creditAmount: number, dbgroup: Group | null, force = true) {
		if (creditAmount === 0) return true
		if (
			!force &&
			user.daily_credits + user.paid_credits + (dbgroup?.group_credits || 0) < creditAmount
		)
			return false
		if (!Number.isInteger(creditAmount)) return false
		let toBeSubbed = creditAmount

		if (dbgroup && dbgroup.group_credits !== 0) {
			if (dbgroup.group_credits >= toBeSubbed) {
				await changeGroupCredits(dbgroup.group_id, -toBeSubbed)
				return true
			} else {
				toBeSubbed -= dbgroup.group_credits
				await changeGroupCredits(dbgroup.group_id, -dbgroup.group_credits)
			}
		}

		if (toBeSubbed && user.daily_credits) {
			if (user.daily_credits >= toBeSubbed) {
				user.daily_credits -= toBeSubbed
				toBeSubbed = 0
			} else {
				toBeSubbed -= user.daily_credits
				user.daily_credits = 0
			}
		}
		if (toBeSubbed && user.paid_credits) {
			if (user.paid_credits >= toBeSubbed) {
				user.paid_credits -= toBeSubbed
				toBeSubbed = 0
			} else {
				toBeSubbed -= user.paid_credits
				user.paid_credits = 0
			}
		}
		await ExecuteDB(`UPDATE users
SET paid_credits = ${user.paid_credits}, daily_credits = ${user.daily_credits}
WHERE user_id = '${user.user_id}';`)
		return toBeSubbed === 0

		// console.log({toBeSubbed: toBeSubbed, groupSubAmt: groupSubAmt, dailySubAmt: dailySubAmt, paidSubAmt: paidSubAmt})
	}
}

export const db: SQLOrm = new SQLOrm()
async function QueryDB(sql: string, values: string[] = []): Promise<any[]> {
	return new Promise<any[]>((resolve, reject) => {
		database.query(sql, values, (err, results: any[]) => {
			if (err) {
				reject(err)
			}
			resolve(results)
		})
	})
}

async function changeUserCredits(author: string, creditAmount: number, paid = false) {
	if (paid) {
		await ExecuteDB(
			`UPDATE users SET paid_credits = users.paid_credits + ${creditAmount} WHERE user_id = '${author}';`,
		)
	} else {
		await ExecuteDB(
			`UPDATE users SET daily_credits = users.daily_credits + ${creditAmount} WHERE user_id = '${author}';`,
		)
	}
}

async function changeGroupCredits(groupid: string, creditDifference: number) {
	await ExecuteDB(
		`UPDATE servers SET servers.group_credits = servers.group_credits + ${creditDifference} WHERE group_id = '${groupid}';`,
	)
}

async function setGroupCredits(groupid: string, creditAmount: number) {
	await ExecuteDB(
		`UPDATE servers SET servers.group_credits = ${creditAmount} WHERE group_id = '${groupid}';`,
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
	locale: string | undefined,
) {
	const sql = `INSERT INTO queue (prompt, chatID, messageID, author, fromgroup, groupid, platform, locale) VALUES ( '${sanitizeInput(
		JSON.stringify(requestParams),
	)}', '${chatID}', '${messageID}', '${author}', ${Boolean(
		groupid,
	)}, '${groupid}', 'discord', '${locale}')`
	await ExecuteDB(sql)
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
}
