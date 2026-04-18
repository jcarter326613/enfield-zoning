import fs from "fs"
import path from "path"

const DATA_DIR = "./data"

type RecordType = {
    buttonClicked?: string
    pollAnswer?: string
}

function main() {
    const files = fs.readdirSync(DATA_DIR)

    const buttonCounts: Record<string, number> = {
        displayPurpose: 0,
        startPoll: 0,
        completePoll: 0,
    }

    const pollAnswerCounts: Record<string, number> = {}

    let totalFiles = 0
    let parsedFiles = 0

    for (const file of files) {
        const fullPath = path.join(DATA_DIR, file)

        if (!fs.statSync(fullPath).isFile()) continue
        if (!file.endsWith(".json")) continue

        totalFiles++

        try {
            const raw = fs.readFileSync(fullPath, "utf-8")
            const data: RecordType = JSON.parse(raw)

            parsedFiles++

            // Count buttonClicked
            if (data.buttonClicked && buttonCounts.hasOwnProperty(data.buttonClicked)) {
                buttonCounts[data.buttonClicked]++
            }

            // Count pollAnswer (only if defined)
            if (data.pollAnswer !== undefined && data.pollAnswer !== null) {
                const key = String(data.pollAnswer)
                pollAnswerCounts[key] = (pollAnswerCounts[key] || 0) + 1
            }
        } catch (err) {
            console.error(`Failed to parse ${file}:`, err)
        }
    }

    console.log("Total files:", totalFiles)
    console.log("Parsed files:", parsedFiles)

    console.log("\nButton Click Counts:")
    console.log(buttonCounts)

    console.log("\nPoll Answer Counts:")
    console.log(pollAnswerCounts)
}

main()