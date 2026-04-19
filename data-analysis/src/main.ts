import fs from "fs"
import path from "path"

const DATA_DIR = "./data"

type RecordType = {
    timestamp: number
    buttonClicked: string
    ip: string
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

    let fileList: (RecordType & {
        shouldSkip: boolean
    })[] = []

    for (const file of files) {
        const fullPath = path.join(DATA_DIR, file)

        if (!fs.statSync(fullPath).isFile()) continue
        if (!file.endsWith(".json")) continue

        totalFiles++

        // Read in the data
        try {
            const raw = fs.readFileSync(fullPath, "utf-8")
            const data: RecordType = JSON.parse(raw)

            parsedFiles++

            fileList.push({
                ...data,
                shouldSkip: false
            })
        } catch (err) {
            console.error(`Failed to parse ${file}:`, err)
        }
    }
    
    fileList = fileList.sort((a, b) => a.timestamp - b.timestamp)

    // Filter out duplicates
    const timeStampFilterDistance = 1000 * 60
    let numSkipped = 0
    for (let i = 0; i < fileList.length; i++) {
        const iObj = fileList[i]

        // If the record was already marked as skipped, go to the next one
        if (iObj.shouldSkip) {
            continue
        }

        // Check if there is a future record that should be filtered
        for (let j = i + 1; j < fileList.length; j++) {
            const jObj = fileList[j]

            // If the record is after the double count distance, stop processessing this object
            const timeStampDiff = jObj.timestamp - iObj.timestamp
            if (timeStampDiff > timeStampFilterDistance) {
                break
            }

            // If the record is the same buttonClick and the same ip, mark it as skipped
            if (
                jObj.buttonClicked == iObj.buttonClicked &&
                jObj.ip == iObj.ip
            ) {
                jObj.shouldSkip = true
                numSkipped++
            }
        }
    }

    // Go through the records
    for (let data of fileList) {
        if (data.shouldSkip) {
            continue
        }

        // Count buttonClicked
        if (data.buttonClicked && buttonCounts.hasOwnProperty(data.buttonClicked)) {
            buttonCounts[data.buttonClicked]++
        }

        // Count pollAnswer (only if defined)
        if (data.pollAnswer !== undefined && data.pollAnswer !== null) {
            const key = String(data.pollAnswer)
            pollAnswerCounts[key] = (pollAnswerCounts[key] || 0) + 1
        }
    }

    console.log("Total files:", totalFiles)
    console.log("Parsed files:", parsedFiles)
    console.log("Num skipped:", numSkipped)

    console.log("\nButton Click Counts:")
    console.log(buttonCounts)

    console.log("\nPoll Answer Counts:")
    console.log(pollAnswerCounts)
}

main()