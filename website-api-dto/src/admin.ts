export type ApproveCommentRequest = {
    pollId: string
    commentId: string
}

export type RejectCommentRequest = {
    pollId: string
    commentId: string
    message: string | undefined
}

export type GetCommentsResponse = {
    polls: Poll[]
}

export type Poll = {
    id: string
    title: string
    comments: Comment[]
}

export type Comment = {
    id: string
    text: string
    createdAtEpoch: number
}
