
export type ActivePollResponse = {
    type: "zoning-ammendment"
    summaryMarkdown: string
    zoningText: string
    poll: Poll
}

export type CastVote = {
    selectedValue: string | null
}

export type Poll = {
    isExpired: true
} | {
    isExpired: false
    loggedIn: false
} | {
    isExpired: false
    loggedIn: true
    allowedToVote: false
} | {
    isExpired: false
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
    selected: boolean,
}
