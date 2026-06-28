import MarkdownIt from "markdown-it"

const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true
})

const defaultImage =
    md.renderer.rules.image ??
    ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options))

md.renderer.rules.image = (tokens, idx, options, env, self) => {
    const token = tokens[idx]

    token.attrSet("loading", "lazy")
    token.attrSet("style", "max-width:100%;height:auto;display:block;margin:1rem auto;")

    return defaultImage(tokens, idx, options, env, self)
}

export function markdownToHtml(markdown: string): string {
    return md.render(markdown)
}