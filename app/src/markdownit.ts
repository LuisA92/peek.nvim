import { hashCode, uniqueIdGen } from './util.ts';
import { parseArgs } from 'https://deno.land/std@0.217.0/cli/parse_args.ts';
import { default as highlight } from 'https://cdn.skypack.dev/highlight.js@11.9.0';
// @deno-types="https://esm.sh/v135/@types/markdown-it@13.0.7/index.d.ts";
import MarkdownIt from 'https://esm.sh/markdown-it@14.0.0';
import { full as MarkdownItEmoji } from 'https://esm.sh/markdown-it-emoji@3.0.0';
import { default as MarkdownItFootnote } from 'https://esm.sh/markdown-it-footnote@4.0.0';
import { default as MarkdownItTaskLists } from 'https://esm.sh/markdown-it-task-lists@2.1.1';
import { default as MarkdownItTexmath } from 'https://esm.sh/markdown-it-texmath@1.0.0';
import Katex from 'https://esm.sh/katex@0.16.9';
import { default as MarkdownItObsidianCallouts } from 'https://esm.sh/markdown-it-obsidian-callouts@0.3.3';
import { default as MarkdownItMark } from 'https://esm.sh/markdown-it-mark@4.0.0';
import { default as MarkdownItSub } from 'https://esm.sh/markdown-it-sub@2.0.0';
import { default as MarkdownItSup } from 'https://esm.sh/markdown-it-sup@2.0.0';
import yaml from 'https://esm.sh/js-yaml@4.1.0';


function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#039;';
      default: return char;
    }
  });
}


const __args = parseArgs(Deno.args);

function parseStyMacros(content: string): Record<string, string> {
  const macros: Record<string, string> = {};

  // Strip comments
  const lines = content.replace(/%.*$/gm, '').replace(/\r\n/g, '\n');

  // Skip \makeatletter...\makeatother blocks
  const cleaned = lines.replace(
    /\\makeatletter[\s\S]*?\\makeatother/g,
    '',
  );

  // \newcommand{\cmd}{expansion} or \newcommand{\cmd}[n]{expansion}
  // \renewcommand{\cmd}{expansion} or \renewcommand{\cmd}[n]{expansion}
  const newcmdRegex = /\\(?:re)?newcommand\{?(\\[a-zA-Z]+)\}?\s*(?:\[(\d+)\])?\s*\{((?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*)\}/g;
  let m;
  while ((m = newcmdRegex.exec(cleaned)) !== null) {
    const [, name, nargs, body] = m;
    if (nargs) {
      // KaTeX supports #1..#9 args in macro expansion
      macros[name] = body;
    } else {
      macros[name] = body;
    }
  }

  // \DeclareMathOperator{\cmd}{text}
  const opRegex = /\\DeclareMathOperator\{?(\\[a-zA-Z]+)\}?\s*\{((?:[^{}]|\{[^{}]*\})*)\}/g;
  while ((m = opRegex.exec(cleaned)) !== null) {
    const [, name, body] = m;
    macros[name] = `\\operatorname{${body}}`;
  }

  // \def\cmd{expansion}
  const defRegex = /\\def\s*(\\[a-zA-Z]+)\s*\{((?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*)\}/g;
  while ((m = defRegex.exec(cleaned)) !== null) {
    const [, name, body] = m;
    macros[name] = body;
  }

  return macros;
}

function loadPreambleMacros(): Record<string, string> {
  const preamblePath = __args['preamble'];
  if (!preamblePath) return {};

  try {
    const content = Deno.readTextFileSync(preamblePath);
    const macros = parseStyMacros(content);
    console.log(`Loaded ${Object.keys(macros).length} macros from ${preamblePath}`);
    return macros;
  } catch (e) {
    console.error(`Failed to load preamble from ${preamblePath}: ${e.message}`);
    return {};
  }
}

const preambleMacros = loadPreambleMacros();

const md = new MarkdownIt('default', {
  html: true,
  typographer: true,
  linkify: true,
  langPrefix: 'language-',
  highlight: __args['syntax'] && ((code, language) => {
    if (language && highlight.getLanguage(language)) {
      try {
        return highlight.highlight(code, { language }).value;
      } catch {
        return code;
      }
    }

    return '';
  }),
}).use(MarkdownItEmoji)
  .use(MarkdownItFootnote)
  .use(MarkdownItTaskLists, { enabled: false, label: true })
  .use(MarkdownItTexmath, {
    engine: Katex,
    delimiters: ['gitlab', 'dollars'],
    katexOptions: {
      macros: { ...preambleMacros },
      strict: false,
      throwOnError: false,
    },
  })
  .use(MarkdownItObsidianCallouts)
  .use(MarkdownItMark)
  .use(MarkdownItSub)
  .use(MarkdownItSup);

md.renderer.rules.link_open = (tokens, idx, options) => {
  const token = tokens[idx];
  const href = token.attrGet('href');

  if (href && href.startsWith('#')) {
    token.attrSet('onclick', `location.hash='${href}'`);
  }

  token.attrSet('href', 'javascript:return');

  return md.renderer.renderToken(tokens, idx, options);
};

md.renderer.rules.heading_open = (tokens, idx, options) => {
  tokens[idx].attrSet(
    'id',
    tokens[idx + 1].content
      .trim()
      .split(' ')
      .filter((a) => a)
      .join('-')
      .replace(/[^a-z0-9-]/gi, '')
      .toLowerCase(),
  );

  return md.renderer.renderToken(tokens, idx, options);
};

md.renderer.rules.math_block = (() => {
  const math_block = md.renderer.rules.math_block!;

  return (tokens, idx, options, env, self) => {
    return `
      <div
        data-line-begin="${tokens[idx].attrGet('data-line-begin')}"
      >
        ${math_block(tokens, idx, options, env, self)}
      </div>
    `;
  };
})();

md.renderer.rules.math_block_eqno = (() => {
  const math_block_eqno = md.renderer.rules.math_block_eqno!;

  return (tokens, idx, options, env, self) => {
    return `
      <div
        data-line-begin="${tokens[idx].attrGet('data-line-begin')}"
      >
        ${math_block_eqno(tokens, idx, options, env, self)}
      </div>
    `;
  };
})();

md.renderer.rules.fence = (() => {
  const fence = md.renderer.rules.fence!;
  const escapeHtml = md.utils.escapeHtml;
  const regex = new RegExp(
    /^(?<frontmatter>---[\s\S]+---)?\s*(?<content>(?<charttype>flowchart|sequenceDiagram|gantt|classDiagram|stateDiagram|pie|journey|C4Context|erDiagram|requirementDiagram|gitGraph)[\s\S]+)/,
  );

  return (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const content = token.content.trim();

    if (regex.test(content)) {
      const match = regex.exec(content);
      return `
        <div
          class="peek-mermaid-container"
          data-line-begin="${token.attrGet('data-line-begin')}"
        >
          <div
            id="graph-mermaid-${env.genId(hashCode(content))}"
            data-graph="mermaid"
            data-graph-definition="${escapeHtml(match?.groups?.content || '')}"
          >
            <div class="peek-loader"></div>
          </div>
        </div>
      `;
    }

    return fence(tokens, idx, options, env, self);
  };
})();

export function render(markdown: string) {
  let metadataHTML = '';
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/;

  const match = markdown.match(frontmatterRegex);
  if (match) {
    const yamlContent = match[1]; // This is the string we'll escape
    try {
      const metadata = yaml.load(yamlContent); // still useful for validation
      metadataHTML = `<section class="yaml-metadata"><pre><code>${escapeHtml(yamlContent)}</code></pre></section>`;
    } catch (err) {
      console.error("YAML parsing error:", err);
    }

    // Remove the frontmatter from markdown before parsing
    markdown = markdown.slice(match[0].length).trimStart();
  }

  const tokens = md.parse(markdown, {});
  tokens.forEach((token) => {
    if (token.map && token.level === 0) {
      token.attrSet('data-line-begin', String(token.map[0] + 1));
    }
  });

  const contentHTML = md.renderer.render(tokens, md.options, { genId: uniqueIdGen() });

  return metadataHTML + contentHTML;
}function renderMetadataHTML(metadata: Record<string, any>): string {
  const escapeHtml = md.utils.escapeHtml;

  return `
    <dl>
      ${Object.entries(metadata).map(([key, value]) => `
        <dt>${escapeHtml(key)}</dt>
        <dd>${Array.isArray(value) ? escapeHtml(value.join(', ')) : escapeHtml(String(value))}</dd>
      `).join('')}
    </dl>
  `;
}
