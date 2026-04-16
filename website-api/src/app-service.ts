import { Service } from "./service.js"

import { Traffic } from "./routes/traffic.js"

export const service = new Service([
    Traffic,
])
