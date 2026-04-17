const TRAFFIC_URL =
    "https://td3754jiuvfsencok4whrksvh40smacm.lambda-url.us-east-1.on.aws/traffic/"

export async function postTraffic(eventName: string, pollAnswer?: string): Promise<boolean> {
    const bodyObj = {
        pollAnswer: pollAnswer
    }

    try {
        const response = await fetch(`${TRAFFIC_URL}${eventName}/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(bodyObj)
        })

        if (!response.ok) {
            console.error("Traffic POST failed", response.status, response.statusText)
            return false
        }

        return true
    } catch (error) {
        console.error("Traffic POST error", error)
        return false
    }
}