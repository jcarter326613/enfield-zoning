import { Service } from "./service.js"

import { Home } from "./routes/home.js"
import { Traffic } from "./routes/traffic.js"

export const service = new Service([
    Home,
    Traffic,
])
