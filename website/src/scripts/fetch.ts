const TRAFFIC_URL = "http://localhost:8080/"

export async function fetchGet<T>(url: string): Promise<T | null> {
    const response = await fetch(`${TRAFFIC_URL}${url}/`, {
        method: "GET",
    })

    if (!response.ok) {
        return null
    }

    return (await response.json()) as T
}

export async function fetchPost<T, U>(url: string, body: T): Promise<U | null> {
    const response = await fetch(`${TRAFFIC_URL}${url}/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    })

    if (!response.ok) {
        return null
    }

    return (await response.json()) as U
}
