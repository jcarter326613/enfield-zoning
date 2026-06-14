import $ from "jquery"

import type { Home } from "@enfield-zoning/website-api-dto"

export function createPollCard(template: JQuery<HTMLElement>, detail: Home.PollCard): JQuery<HTMLElement> {
    if (!template) {
        throw new Error("Poll card template was not found.")
    }

    const node = $("<div>").append(template.contents().clone())

    const link = node.find("#poll-link")
    const summary = node.find("#poll-summary")

    if (link) {
        link.html(detail.title)
        link.attr("href", `/active-poll/${detail.id}`)
    }

    if (summary) {
        summary.html(detail.summary)
    }

    return node
}