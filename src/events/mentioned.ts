import {Events, Message} from "discord.js";
import env from "../fn/env";

module.exports = {
    name: Events.MessageCreate,
    async execute(message: Message<boolean>) {
        message.mentions.users.has(env.CLIENT_ID)
    },
}