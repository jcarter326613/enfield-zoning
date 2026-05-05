import $ from "jquery"

import type { PollCard } from "@enfield-zoning/website-api-dto"

export function createPollCard(template: JQuery<HTMLElement>, detail: PollCard): JQuery<HTMLElement> {
    if (!template) {
        throw new Error("Poll card template was not found.")
    }

    const node = $("<div>").append(template.contents().clone())

    const link = node.find("#poll-link")
    const summary = node.find("#poll-summary")

    if (link) {
        link.html(detail.title)
    }

    if (summary) {
        summary.html(detail.summary)
    }

    return node
}