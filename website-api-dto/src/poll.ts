
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

export type SubmitIdentityRequest = {
    name: string,
    street: string,
}

export type VotingOption = {
    value: string,
    label: string,
}
