export type HomeModel = {
    cards: PollCard[]
}

export type PollCard = {
    title: string
    summary: string
}

export type ActivePollModel = {
    type: "zoning-ammendment"
    summaryMarkdown: string
    zoningText: string
    poll: {
        loggedIn: true
        votingQuestion: string
        votingOptions: VotingOption[]
    } | {
        loggedIn: false
    }
}

export type VotingOption = {
    value: string,
    label: string,
}