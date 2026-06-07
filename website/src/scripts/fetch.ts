const TRAFFIC_URL = "http://localhost:8080/"

export async function fetchGet<T>(url: string): Promise<T | null> {
    const response = await fetch(`${TRAFFIC_URL}${url}/`, {
        method: "GET",
        credentials: "include",
    })

    if (!response.ok) {
        return null
    }

    try {
        return (await response.json()) as T
    } catch (e: any) {
        return null
    }
}

export async function fetchPost<T, U>(url: string, body: T): Promise<U | null> {
    try {
        const response = await fetch(`${TRAFFIC_URL}${url}/`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body),
        })

        if (!response.ok) {
            return null
        }

        return (await response.json()) as U
    } catch(e: any) {
        return null
    }
}
