export type AccountCreateModel = {
    email: string,
    legalName: string | undefined,
    domicileStreet: string | undefined,
}

export type AuthStatus = {
    isLoggedIn: boolean
}