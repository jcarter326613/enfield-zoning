export type AccountCreateModel = {
    email: string,
    legalName: string | undefined,
    domicileStreet: string | undefined,
}

export type AuthStatus = {
    isLoggedIn: boolean
}

export type LoginRequest = {
    email: string
}

export type LoginResponse = {
    emailSent: boolean
    throttled: boolean
    notFound: boolean
}