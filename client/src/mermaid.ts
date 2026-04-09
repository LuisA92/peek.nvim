import Mermaid from 'https://cdn.skypack.dev/@types/mermaid?dts';
import { getInjectConfig } from './util.ts';

declare const mermaid: typeof Mermaid;

function init(theme?: string) {
  const peek = getInjectConfig();
  const t = theme || peek?.theme;

  mermaid.initialize({
    startOnLoad: false,
    theme: t === 'light' ? 'neutral' : 'dark',
    flowchart: {
      htmlLabels: false,
    },
  });
}

async function render(id: string, definition: string, container: Element) {
  try {
    return (await mermaid.render(id, definition, container)).svg;
  } catch { /**/ }
}

export default { init, render };
