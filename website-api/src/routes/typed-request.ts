import { Query } from "express-serve-static-core"
import express from "express"

/**
 * A strongly typed request object
 *  T - the type of the query
 *  U - the type of the body
 */
export interface TypedRequest<U> extends express.Request 
{
    body: U,
    query: Record<string, string>
}