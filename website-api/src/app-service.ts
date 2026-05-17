import { Service } from "./service.js"

import { Account } from "./routes/account.js"
import { ActivePoll } from "./routes/active-poll.js"
import { Home } from "./routes/home.js"

export const service = new Service([
    Account,
    ActivePoll,
    Home,
])
