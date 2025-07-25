import fs from "fs"
import path from "path"

const logFilePath = path.join(process.cwd(), "output-log.txt") // this will be in the project root

export function logToFile(message: string) {
    const timestamp = new Date().toISOString()
    const fullMessage = `[${timestamp}] ${message}\n`
    fs.appendFileSync(logFilePath, fullMessage)
}
