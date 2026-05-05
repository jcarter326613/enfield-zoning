import $ from "jquery"

export function createPollCard(template: JQuery<HTMLElement>): JQuery<HTMLElement> {
    if (!template) {
        throw new Error("Poll card template was not found.")
    }

    const node = $("<div>").append(template.contents().clone())

    const link = node.find("#poll-link")
    const summary = node.find("#poll-summary")

    if (link) {
        link.html("Hello")
    }

    if (summary) {
        summary.html("World")
    }

    return node
}