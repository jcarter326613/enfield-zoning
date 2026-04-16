
export enum HttpStatusCode {
    // Success Codes
    OK = 200,
    CREATED = 201,
    ACCEPTED = 202,
    OK_NO_CONTENT = 204,

    // Client Errors
    BAD_REQUEST = 400,
    INVALID_INPUT = 400,
    UNAUTHORIZED = 401, // User needs to authenticate
    FORBIDDEN = 403,    // Authenticated user doesn't have permission
    NOT_FOUND = 404,
    DUPLICATE = 409,
    CONFLICT = 409,
    SERVER_ERROR = 500
}