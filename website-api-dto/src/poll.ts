
export type ActivePollResponse = {
    type: "zoning-ammendment"
    summaryMarkdown: string
    detailMarkdown: string
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

export type VotingOption = {
    value: string,
    label: string,
    selected: boolean,
}

// Discussion
export type DiscussionComment = {
    id: string
    text: string
    createdAtEpoch: number
}

export type GetDiscussionCommentsResponse = {
    loggedIn: boolean
    comments: DiscussionComment[]
}

export type CreateDiscussionCommentRequest = {
    text: string
}

export type CreateDiscussionCommentResponse = {
    success: boolean
}