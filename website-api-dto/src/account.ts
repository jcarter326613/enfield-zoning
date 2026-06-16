export type AccountCreateRequest = {
    email: string,
    legalName: string | undefined,
    domicileStreet: string | undefined,
}

export type AccountCreateResponse = {
    success: boolean
    isDuplicate: boolean
}

export type AuthStatus = {
    isLoggedIn: boolean
}

export type CompleteLoginRequest = {
    userId: string,
    token: string,
}

export type CompleteLoginResponse = {
    redirectUrl: string,
}

export type LoginRequest = {
    email: string
    redirectUrl?: string
}

export type LoginResponse = {
    emailSent: boolean
    throttled: boolean
    notFound: boolean
}

export type SubmitIdentity = {
    legalName: string
    legalStreet: string
}