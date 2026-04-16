import { Service } from "./service.js"

import { Health } from "./routes/health.js"

export const service = new Service([
    Health,
])
