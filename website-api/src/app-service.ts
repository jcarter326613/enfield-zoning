import { Service } from "./service.js"

import { ActivePoll } from "./routes/active-poll.js"
import { Home } from "./routes/home.js"
import { Traffic } from "./routes/traffic.js"

export const service = new Service([
    ActivePoll,
    Home,
    Traffic,
])
