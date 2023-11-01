import {EmbedBuilder} from "discord.js";

class quickEmbedBuilder extends EmbedBuilder{
    constructor(title: string, content: string, type: "warning"|"success"|"error") {
        super();
        if (type === "warning"){
            this.setColor("#f5260f")
        }
        else if (type === "error"){
            this.setColor("#b57007")
        }
        else if (type === "success"){
            this.setColor("#63f50f")
        }
        this.setTitle(title)
        this.setDescription(content)
    }
}
export {
    quickEmbedBuilder
}