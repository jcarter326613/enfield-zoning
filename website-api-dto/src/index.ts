export type HomeModel = {
    cards: PollCard[]
}

export type PollCard = {
    title: string
    summary: string
}

export type ActivePollModel = {
    summaryMarkdown: string
    zoningText: string
}