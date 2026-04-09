import { Webview } from 'https://deno.land/x/webview@0.7.6/mod.ts';
import { parseArgs } from 'https://deno.land/std@0.217.0/cli/parse_args.ts';

const { url, theme, serverUrl, 'font-family': fontFamily } = parseArgs(Deno.args);

const webview = new Webview();

webview.title = 'Peek preview';
webview.bind('_log', console.log);
webview.bind('_close', () => { webview.destroy(); });
webview.init(`
  window.peek = {};
  window.peek.theme = "${theme}"
  window.peek.serverUrl = "${serverUrl}"
  window.peek.fontFamily = "${(fontFamily || '').replace(/"/g, '\\"')}"
`);

webview.navigate(url);
webview.run();

Deno.exit();
