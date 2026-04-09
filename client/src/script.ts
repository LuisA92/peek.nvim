import { debounce, findLast, getInjectConfig } from './util.ts';
import { slidingWindows } from 'https://deno.land/std@0.217.0/collections/sliding_windows.ts';
// @deno-types="https://raw.githubusercontent.com/patrick-steele-idem/morphdom/master/index.d.ts"
import morphdom from 'https://esm.sh/morphdom@2.7.2?no-dts';
import mermaid from './mermaid.ts';

const window = globalThis;
// const _log = Reflect.get(window, '_log');

addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const markdownBody = document.getElementById('peek-markdown-body') as HTMLDivElement;
  const base = document.getElementById('peek-base') as HTMLBaseElement;
  const peek = getInjectConfig();
  let source: { lcount: number } | undefined;
  let blocks: HTMLElement[][] | undefined;
  let scroll: { line: number } | undefined;

  const zoom = {
    level: 100,
    zoomMin: 50,
    zoomMax: 250,
    zoomStep: 10,
    zoomLabel: document.getElementById('peek-zoom-label') as HTMLDivElement,
    init() {
      this.level = Number(localStorage.getItem('zoom-level')) || this.level;
      this.update(this.level === 100);
    },
    up() {
      this.level = Math.min(this.level + this.zoomStep, this.zoomMax);
      this.update();
    },
    down() {
      this.level = Math.max(this.level - this.zoomStep, this.zoomMin);
      this.update();
    },
    reset() {
      this.level = 100;
      this.update();
    },
    update(silent?: boolean) {
      localStorage.setItem('zoom-level', String(this.level));
      markdownBody.style.setProperty('font-size', `${this.level}%`);
      if (silent) return;
      this.zoomLabel.textContent = `${this.level}%`;
      this.zoomLabel.animate([
        { opacity: 1 },
        { opacity: 1, offset: 0.75 },
        { opacity: 0 },
      ], { duration: 1000 });
    },
  };

  if (peek.theme) body.setAttribute('data-theme', peek.theme);
  if (peek.fontFamily) markdownBody.style.fontFamily = peek.fontFamily;
  if (peek.ctx === 'webview') zoom.init();

  document.addEventListener('keydown', (event: KeyboardEvent) => {
    const ctrl: Record<string, () => void> = {
      '=': zoom.up.bind(zoom),
      '-': zoom.down.bind(zoom),
      '0': zoom.reset.bind(zoom),
      'w': () => { const _close = Reflect.get(window, '_close'); if (_close) _close(); else close(); },
    };
    const plain: Record<string, () => void> = {
      'j': () => {
        window.scrollBy({ top: 50 });
      },
      'k': () => {
        window.scrollBy({ top: -50 });
      },
      'd': () => {
        window.scrollBy({ top: window.innerHeight / 2 });
      },
      'u': () => {
        window.scrollBy({ top: -window.innerHeight / 2 });
      },
      'g': () => {
        window.scrollTo({ top: 0 });
      },
      'G': () => {
        window.scrollTo({ top: document.body.scrollHeight });
      },
    };
    const action = (event.ctrlKey || event.metaKey) && peek.ctx === 'webview' ? ctrl[event.key] : plain[event.key];
    if (action) {
      event.preventDefault();
      action();
    }
  });

  onload = () => {
    const item = sessionStorage.getItem('session');
    if (item) {
      const session = JSON.parse(item);
      base.href = session.base;
      onPreview({ html: session.html, lcount: session.lcount });
      onScroll({ line: session.line });
    }
  };

  onbeforeunload = () => {
    sessionStorage.setItem(
      'session',
      JSON.stringify({
        base: base.href,
        html: markdownBody.innerHTML,
        lcount: source?.lcount,
        line: scroll?.line,
      }),
    );
  };

  const decoder = new TextDecoder();
  const socket = new WebSocket(`ws://${peek.serverUrl}/`);

  socket.binaryType = 'arraybuffer';

  socket.onclose = (event) => {
    if (!event.wasClean) {
      close();
      location.reload();
    }
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(decoder.decode(event.data));

    switch (data.action) {
      case 'show':
        onPreview(data);
        break;
      case 'scroll':
        onScroll(data);
        break;
      case 'base':
        base.href = data.base;
        break;
      case 'theme':
        body.setAttribute('data-theme', data.theme);
        reRenderMermaid(data.theme);
        break;
      default:
        break;
    }
  };

  const mermaidParser = new DOMParser();

  async function renderMermaidEl(el: Element) {
    const svg = await mermaid.render(
      `${el.id}-svg`,
      el.getAttribute('data-graph-definition')!,
      el,
    );

    if (svg) {
      const svgElement = mermaidParser.parseFromString(svg, 'text/html').body;
      el.appendChild(svgElement);
      el.parentElement?.style.setProperty(
        'height',
        window.getComputedStyle(svgElement).getPropertyValue('height'),
      );
    }
  }

  const renderMermaid = debounce(() => {
    Array.from(markdownBody.querySelectorAll('div[data-graph="mermaid"]'))
      .filter((el) => !el.querySelector('svg'))
      .forEach(renderMermaidEl);
  }, 200);

  function reRenderMermaid(theme: string) {
    mermaid.init(theme);
    markdownBody.querySelectorAll('div[data-graph="mermaid"]').forEach((el) => {
      const svg = el.querySelector('svg');
      if (svg) svg.parentElement?.remove();
    });
    renderMermaid();
  }

  const onPreview = (() => {
    mermaid.init();

    const morphdomOptions: Parameters<typeof morphdom>[2] = {
      childrenOnly: true,
      getNodeKey: (node) => {
        if (node instanceof HTMLElement && node.getAttribute('data-graph') === 'mermaid') {
          return node.id;
        }
        return null;
      },
      onNodeAdded: (node) => {
        if (node instanceof HTMLElement && node.getAttribute('data-graph') === 'mermaid') {
          renderMermaid();
        }
        return node;
      },
      onBeforeElUpdated: (fromEl: HTMLElement, toEl: HTMLElement) => {
        if (fromEl.hasAttribute('open')) {
          toEl.setAttribute('open', 'true');
        } else if (
          fromEl.classList.contains('peek-mermaid-container') &&
          toEl.classList.contains('peek-mermaid-container')
        ) {
          toEl.style.height = fromEl.style.height;
        }
        return !fromEl.isEqualNode(toEl);
      },
      onBeforeElChildrenUpdated(_, toEl) {
        return toEl.getAttribute('data-graph') !== 'mermaid';
      },
    };

    const mutationObserver = new MutationObserver(() => {
      blocks = slidingWindows(Array.from(document.querySelectorAll('[data-line-begin]')), 2, {
        step: 1,
        partial: true,
      });
    });

    const resizeObserver = new ResizeObserver(() => {
      if (scroll) onScroll(scroll);
    });

    mutationObserver.observe(markdownBody, { childList: true });
    resizeObserver.observe(markdownBody);

    return (data: { html: string; lcount: number }) => {
      source = { lcount: data.lcount };
      morphdom(markdownBody, `<main>${data.html}</main>`, morphdomOptions);
    };
  })();

  // Find bar (Cmd+F / Ctrl+F)
  const findBar = (() => {
    const bar = document.createElement('div');
    bar.id = 'peek-find-bar';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Find...';

    const count = document.createElement('span');
    count.className = 'peek-find-count';

    const prevBtn = document.createElement('button');
    prevBtn.textContent = '\u2191';
    prevBtn.title = 'Previous';

    const nextBtn = document.createElement('button');
    nextBtn.textContent = '\u2193';
    nextBtn.title = 'Next';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '\u00d7';
    closeBtn.title = 'Close';

    bar.append(input, count, prevBtn, nextBtn, closeBtn);
    document.body.appendChild(bar);

    let marks: HTMLElement[] = [];
    let currentIdx = -1;

    function clearHighlights() {
      marks.forEach((m) => {
        const parent = m.parentNode;
        if (parent) {
          parent.replaceChild(document.createTextNode(m.textContent || ''), m);
          parent.normalize();
        }
      });
      marks = [];
      currentIdx = -1;
      count.textContent = '';
    }

    function highlightMatches(query: string) {
      clearHighlights();
      if (!query) return;

      const walker = document.createTreeWalker(markdownBody, NodeFilter.SHOW_TEXT);
      const textNodes: Text[] = [];
      let node: Text | null;
      while ((node = walker.nextNode() as Text | null)) {
        if (node.parentElement?.closest('#peek-find-bar, script, style')) continue;
        textNodes.push(node);
      }

      const lowerQuery = query.toLowerCase();
      textNodes.forEach((tn) => {
        const text = tn.textContent || '';
        const lower = text.toLowerCase();
        let idx = lower.indexOf(lowerQuery);
        if (idx === -1) return;

        const frag = document.createDocumentFragment();
        let lastIdx = 0;
        while (idx !== -1) {
          frag.appendChild(document.createTextNode(text.slice(lastIdx, idx)));
          const mark = document.createElement('mark');
          mark.className = 'peek-find-highlight';
          mark.textContent = text.slice(idx, idx + query.length);
          frag.appendChild(mark);
          marks.push(mark);
          lastIdx = idx + query.length;
          idx = lower.indexOf(lowerQuery, lastIdx);
        }
        frag.appendChild(document.createTextNode(text.slice(lastIdx)));
        tn.parentNode!.replaceChild(frag, tn);
      });

      count.textContent = marks.length ? `${marks.length} found` : 'No results';
      if (marks.length) goTo(0);
    }

    function goTo(idx: number) {
      if (!marks.length) return;
      if (currentIdx >= 0 && marks[currentIdx]) marks[currentIdx].classList.remove('current');
      currentIdx = ((idx % marks.length) + marks.length) % marks.length;
      const m = marks[currentIdx];
      m.classList.add('current');
      m.scrollIntoView({ block: 'center', behavior: 'smooth' });
      count.textContent = `${currentIdx + 1}/${marks.length}`;
    }

    let searchTimeout: number;
    input.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => highlightMatches(input.value), 150) as unknown as number;
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.shiftKey ? goTo(currentIdx - 1) : goTo(currentIdx + 1);
      } else if (e.key === 'Escape') {
        close();
      }
    });
    prevBtn.addEventListener('click', () => goTo(currentIdx - 1));
    nextBtn.addEventListener('click', () => goTo(currentIdx + 1));
    closeBtn.addEventListener('click', close);

    function open() {
      bar.classList.add('active');
      input.focus();
      input.select();
    }

    function close() {
      bar.classList.remove('active');
      clearHighlights();
      input.value = '';
    }

    function isOpen() {
      return bar.classList.contains('active');
    }

    return { open, close, isOpen };
  })();

  // Table of contents
  const toc = (() => {
    const panel = document.createElement('div');
    panel.id = 'peek-toc-panel';
    document.body.appendChild(panel);

    const toggle = document.createElement('button');
    toggle.id = 'peek-toc-toggle';
    toggle.textContent = '\u2630';
    toggle.title = 'Table of Contents (t)';
    document.body.appendChild(toggle);

    let isOpen = false;

    function rebuild() {
      const headings = markdownBody.querySelectorAll('h1, h2, h3, h4, h5, h6');
      if (!headings.length) {
        panel.innerHTML = '<div style="opacity:0.5;font-size:13px;padding:8px">No headings</div>';
        return;
      }
      const ul = document.createElement('ul');
      headings.forEach((h) => {
        const level = parseInt(h.tagName[1]);
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.className = `peek-toc-h${level}`;
        a.textContent = h.textContent || '';
        a.href = 'javascript:void(0)';
        a.addEventListener('click', () => {
          h.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        li.appendChild(a);
        ul.appendChild(li);
      });
      panel.innerHTML = '';
      panel.appendChild(ul);
    }

    function show() {
      rebuild();
      panel.classList.add('active');
      isOpen = true;
    }

    function hide() {
      panel.classList.remove('active');
      isOpen = false;
    }

    function toggleToc() {
      isOpen ? hide() : show();
    }

    toggle.addEventListener('click', toggleToc);

    document.addEventListener('click', (e) => {
      if (!isOpen) return;
      const target = e.target as HTMLElement;
      if (!panel.contains(target) && target !== toggle) hide();
    });

    return { toggle: toggleToc, isOpen: () => isOpen };
  })();

  // Wire up Cmd+F and 't' key
  document.addEventListener('keydown', (event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
      event.preventDefault();
      findBar.open();
      return;
    }
    if (event.key === 't' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const tag = (event.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (findBar.isOpen()) return;
      event.preventDefault();
      toc.toggle();
    }
  });

  // Copy button click handler (buttons are rendered by markdown-it)
  markdownBody.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('.peek-copy-btn') as HTMLButtonElement | null;
    if (!btn) return;
    const wrapper = btn.closest('.peek-code-wrapper');
    const pre = wrapper?.querySelector('pre');
    if (!pre) return;
    const code = pre.querySelector('code');
    const text = code ? code.textContent || '' : pre.textContent || '';
    navigator.clipboard.writeText(text).then(() => {
      btn.textContent = 'Copied!';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.classList.remove('copied');
        btn.textContent = 'Copy';
      }, 1500);
    });
  });

  // Image lightbox with gallery navigation
  const lightbox = (() => {
    const overlay = document.createElement('div');
    overlay.id = 'peek-lightbox';

    const closeBtn = document.createElement('span');
    closeBtn.className = 'peek-lightbox-close';
    closeBtn.textContent = '\u00d7';
    overlay.appendChild(closeBtn);

    const prevBtn = document.createElement('button');
    prevBtn.className = 'peek-lightbox-nav peek-lightbox-prev';
    prevBtn.textContent = '\u2039';
    overlay.appendChild(prevBtn);

    const nextBtn = document.createElement('button');
    nextBtn.className = 'peek-lightbox-nav peek-lightbox-next';
    nextBtn.textContent = '\u203a';
    overlay.appendChild(nextBtn);

    const counter = document.createElement('span');
    counter.className = 'peek-lightbox-counter';
    overlay.appendChild(counter);

    const strip = document.createElement('div');
    strip.className = 'peek-lightbox-strip';
    overlay.appendChild(strip);

    const img = document.createElement('img');
    overlay.appendChild(img);
    document.body.appendChild(overlay);

    let images: string[] = [];
    let currentIdx = 0;
    let scale = 1;
    let tx = 0;
    let ty = 0;
    let dragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragStartTx = 0;
    let dragStartTy = 0;

    function updateTransform() {
      img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    }

    function resetZoom() {
      scale = 1; tx = 0; ty = 0;
      updateTransform();
    }

    function buildStrip() {
      strip.innerHTML = '';
      if (images.length <= 1) { strip.style.display = 'none'; return; }
      strip.style.display = '';
      images.forEach((src, i) => {
        const thumb = document.createElement('img');
        thumb.className = 'peek-lightbox-thumb';
        thumb.src = src;
        thumb.addEventListener('click', (e) => { e.stopPropagation(); showImage(i); });
        strip.appendChild(thumb);
      });
    }

    function updateStrip() {
      const thumbs = strip.querySelectorAll('.peek-lightbox-thumb');
      thumbs.forEach((t, i) => {
        t.classList.toggle('active', i === currentIdx);
      });
      const active = thumbs[currentIdx] as HTMLElement | undefined;
      if (active) {
        active.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
      }
    }

    function showImage(idx: number) {
      currentIdx = ((idx % images.length) + images.length) % images.length;
      img.src = images[currentIdx];
      resetZoom();
      const hasMultiple = images.length > 1;
      prevBtn.style.display = hasMultiple ? '' : 'none';
      nextBtn.style.display = hasMultiple ? '' : 'none';
      counter.style.display = hasMultiple ? '' : 'none';
      counter.textContent = `${currentIdx + 1} / ${images.length}`;
      updateStrip();
    }

    function open(src: string) {
      images = Array.from(markdownBody.querySelectorAll('img'))
        .map((i) => (i as HTMLImageElement).src)
        .filter((s) => s);
      currentIdx = Math.max(0, images.indexOf(src));
      overlay.style.display = 'flex';
      buildStrip();
      showImage(currentIdx);
      requestAnimationFrame(() => overlay.classList.add('active'));
    }

    function close() {
      overlay.classList.remove('active');
      setTimeout(() => {
        overlay.style.display = 'none';
        img.src = '';
      }, 150);
    }

    prevBtn.addEventListener('click', (e) => { e.stopPropagation(); showImage(currentIdx - 1); });
    nextBtn.addEventListener('click', (e) => { e.stopPropagation(); showImage(currentIdx + 1); });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target === closeBtn) close();
    });

    overlay.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.15 : 0.15;
      scale = Math.max(0.2, Math.min(scale + delta, 10));
      if (scale <= 1) { tx = 0; ty = 0; }
      updateTransform();
    }, { passive: false });

    img.addEventListener('mousedown', (e) => {
      if (scale <= 1) return;
      e.preventDefault();
      dragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      dragStartTx = tx;
      dragStartTy = ty;
      img.classList.add('dragging');
    });

    window.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      tx = dragStartTx + (e.clientX - dragStartX);
      ty = dragStartTy + (e.clientY - dragStartY);
      updateTransform();
    });

    window.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;
      img.classList.remove('dragging');
    });

    img.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      if (scale !== 1) {
        resetZoom();
      } else {
        scale = 2;
        updateTransform();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (overlay.style.display !== 'flex') return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft' || e.key === 'h') showImage(currentIdx - 1);
      else if (e.key === 'ArrowRight' || e.key === 'l') showImage(currentIdx + 1);
    });

    overlay.style.display = 'none';
    return { open };
  })();

  markdownBody.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG' && target.closest('.markdown-body')) {
      lightbox.open((target as HTMLImageElement).src);
    }
  });

  const onScroll = (() => {
    function getBlockOnLine(line: number) {
      return findLast(blocks, (block) => line >= Number(block[0].dataset.lineBegin));
    }

    function getOffset(elem: HTMLElement): number {
      let current: HTMLElement | null = elem;
      let top = 0;

      while (top === 0 && current) {
        top = current.getBoundingClientRect().top;
        current = current.parentElement;
      }

      return top + window.scrollY;
    }

    return (data: { line: number }) => {
      scroll = data;

      if (!blocks || !blocks[0] || !source) return;

      const block = getBlockOnLine(data.line) || blocks[0];
      const target = block[0];
      const next = target ? block[1] : blocks[0][0];

      const offsetBegin = target ? getOffset(target) : 0;
      const offsetEnd = next
        ? getOffset(next)
        : offsetBegin + target.getBoundingClientRect().height;

      const lineBegin = target ? Number(target.dataset.lineBegin) : 1;
      const lineEnd = next ? Number(next.dataset.lineBegin) : source.lcount + 1;

      const pixPerLine = (offsetEnd - offsetBegin) / (lineEnd - lineBegin);
      const scrollPix = (data.line - lineBegin) * pixPerLine;

      window.scroll({ top: offsetBegin + scrollPix - window.innerHeight / 2 + pixPerLine / 2 });
    };
  })();
});
