export type ActivePollModel = {
    type: "zoning-ammendment"
    summaryMarkdown: string
    zoningText: string
    poll: Poll
}

export type Poll = {
    loggedIn: false
} | {
    loggedIn: true
    allowedToVote: false
} | {
    loggedIn: true
    allowedToVote: true
    votingQuestion: string
    votingOptions: VotingOption[]
}

export type SubmitIdentityRequest = {
    name: string,
    street: string,
}

export type VotingOption = {
    value: string,
    label: string,
}
