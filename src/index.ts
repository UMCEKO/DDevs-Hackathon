import {Client as DiscordClient, Collection, IntentsBitField, Message, REST, Routes} from "discord.js"
import "dotenv/config"
import * as openai from "openai";
import path = require("path");
import {getAllFileAbsDirs, getAllFileRelDirs} from "./fn/basicFn";
import {IDiscordCommand} from "./fn/interfaces";
import* as express from "express";

class CDCClient extends DiscordClient {
    buttons: Collection<any, any> = new Collection<any, any>()
    commands: Collection<string, IDiscordCommand> = new Collection<any, any>()
}

export let YildizAI = new openai.OpenAI({
    apiKey: process.env["GPT_API_KEY"]
})
export let client = new CDCClient({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildVoiceStates
    ]
})
client.login(process.env["DC_TOKEN"]).catch(e => console.log(e))
//discord command handler
client.commands = new Collection()
const dccommandsPath = path.join(__dirname, "commands")
const dccommandFiles = getAllFileRelDirs(dccommandsPath).filter((file) => file.endsWith(".js") || file.endsWith(".ts"))
for (const file of dccommandFiles) {
    const filePath = path.join(dccommandsPath, file)
    let commandData: IDiscordCommand = require(filePath)
    console.log(commandData)
    if (!commandData.execute || !commandData.command?.name) {
        console.error(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`)
    } else {
        client.commands.set(commandData.command.name, commandData)
    }
}
let registerCommands = false
if (registerCommands){
    const rest = new REST().setToken(process.env["DC_TOKEN"] || "");
    (async () => {
        try {
            console.log(`Started refreshing ${client.commands.size} application (/) commands.`);
            // The put method is used to fully refresh all commands in the guild with the current set
            const data = await rest.put(
                Routes.applicationCommands("1124417243854422097"),
                { body: client.commands.map(value => value.command) },
            ) as any[]
            console.log(`Successfully reloaded ${data.length} application (/) commands.`);
        } catch (error) {
            // And of course, make sure you catch and log any errors!
            console.error(error);
        }
    })();
}

//discord event handler
const dceventsPath = path.join(__dirname, "events")
const dceventFiles = getAllFileAbsDirs(dceventsPath).filter((file) => file.endsWith(".js") || file.endsWith(".ts"))
for (const file  of dceventFiles) {
    const event = require(file)
    console.log(event.name, event)
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args))
    } else {
        client.on(event.name, (...args) => event.execute(...args))
    }
}
//discord button handler
client.buttons = new Collection()
const buttonsPath = path.join(__dirname, "buttons")
const buttonFiles = getAllFileRelDirs(buttonsPath).filter((file) => file.endsWith(".js") || file.endsWith(".ts"))
for (let file of buttonFiles) {
    let button = require(path.join(buttonsPath ,file))
    if ("name" in button && "execute" in button) {
        console.log(button.name, button)
        client.buttons.set(button.name, button)
    } else {
        console.log(`${file} is either missing name or execute property.`)
    }
}

export const imagesPath = path.join("D:\\generated-images")
//
// let app = express()
// app.use("/", express.static(imagesPath))
// app.listen(7836)