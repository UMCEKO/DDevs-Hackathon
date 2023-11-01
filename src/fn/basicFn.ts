import * as fs from "fs"
import * as path from "path"
import {ImagineRequest} from "./complexfn";
import axios from "axios";
export async function censorImage(base64Img: string): Promise<string>{
  let data = await axios.post("http://127.0.0.1:8189/nsfwFilter",{image: base64Img})
  return data.data.image
}

async function generateImage(settings: ImagineRequest){
  console.log(settings.height)
  console.log(settings.width)
  let response: Response
  let perf = performance.now()
  response = await fetch("http://127.0.0.1:8189/generate",{
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(settings)
  })
  let out = await response.json()
  return {
    "time_took": performance.now()-perf,
    "image": Buffer.from(out.image, "base64"),
    "params": {
      "seed": out.params.seed,
      "width": out.params.width,
      "height": out.params.height,
      "cfg": out.params.cfg,
      "anime_mode": out.params.anime_mode,
      "base_steps": out.params.base_steps,
      "total_steps": out.params.total_steps,
      "batch_size": out.params.batch_size
    },
  }
}

function formatTime(timeInSeconds: number){
  let seconds = timeInSeconds%60
  let minutes = Math.floor(((timeInSeconds-seconds)%(60*60))/60)
  let hours = (timeInSeconds - seconds - (minutes*60)) / (60*60)
  return {
    seconds: seconds,
    minutes: minutes,
    hours: hours
  }
}


function formatTimeString(timeInSeconds: number){
  let formattedTime = formatTime(timeInSeconds)
  let formattedString = ""
  if (formattedTime.hours !== 0){
    formattedString += formattedTime.hours + " Hours "
  }
  if (formattedTime.minutes !== 0){
    formattedString += formattedTime.minutes + " Minutes "
  }
  if (formattedTime.seconds !== 0){
    formattedString += formattedTime.seconds + " Seconds"
  }
  return formattedString
}

function getAllFileAbsDirs(folderPath: string) {
  let folder = fs.readdirSync(folderPath)
  let fileDirs: string[] = []
  for (let file of folder){
    let filePath = path.join(folderPath, file)
    if (fs.lstatSync(filePath).isDirectory()){
      fileDirs.push(...getAllFileAbsDirs(filePath))
    }
    else {
      fileDirs.push(filePath)
    }
  }
  return fileDirs
}

function getAllFileRelDirs(folderPath: string){
  const fileDirs = getAllFileAbsDirs(folderPath)
  for (let i in fileDirs)
    fileDirs[i] = path.relative(__dirname, fileDirs[i])
  return fileDirs
}



export {getAllFileRelDirs, getAllFileAbsDirs, generateImage, formatTime, formatTimeString}
