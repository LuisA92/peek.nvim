function debounce(fn, millis) {
    let timer;
    return ()=>{
        clearTimeout(timer);
        timer = setTimeout(fn, millis);
    };
}
function findLast(array, predicate) {
    return array?.slice().reverse().find(predicate);
}
function getInjectConfig() {
    const peek = Reflect.get(window, 'peek');
    if (peek) return {
        ctx: 'webview',
        ...peek
    };
    const params = {};
    new URLSearchParams(location.search).forEach((value, key)=>{
        params[key] = value;
    });
    params.serverUrl = params.serverUrl || location.host;
    params.ctx = 'browser';
    return params;
}
function slidingWindows(array, size, { step = 1, partial = false } = {}) {
    if (!Number.isInteger(size) || !Number.isInteger(step) || size <= 0 || step <= 0) {
        throw new RangeError("Both size and step must be positive integer.");
    }
    const length = Math.floor((array.length - (partial ? 1 : size)) / step + 1);
    const result = [];
    for(let i = 0; i < length; i++){
        result.push(array.slice(i * step, i * step + size));
    }
    return result;
}
var $ = 11;
function re(e, f) {
    var a = f.attributes, t, n, u, s, g;
    if (!(f.nodeType === $ || e.nodeType === $)) {
        for(var y = a.length - 1; y >= 0; y--)t = a[y], n = t.name, u = t.namespaceURI, s = t.value, u ? (n = t.localName || n, g = e.getAttributeNS(u, n), g !== s && (t.prefix === "xmlns" && (n = t.name), e.setAttributeNS(u, n, s))) : (g = e.getAttribute(n), g !== s && e.setAttribute(n, s));
        for(var w = e.attributes, U = w.length - 1; U >= 0; U--)t = w[U], n = t.name, u = t.namespaceURI, u ? (n = t.localName || n, f.hasAttributeNS(u, n) || e.removeAttributeNS(u, n)) : f.hasAttribute(n) || e.removeAttribute(n);
    }
}
var L, ie = "http://www.w3.org/1999/xhtml", h = typeof document > "u" ? void 0 : document, fe = !!h && "content" in h.createElement("template"), le = !!h && h.createRange && "createContextualFragment" in h.createRange();
function de(e) {
    var f = h.createElement("template");
    return f.innerHTML = e, f.content.childNodes[0];
}
function ve(e) {
    L || (L = h.createRange(), L.selectNode(h.body));
    var f = L.createContextualFragment(e);
    return f.childNodes[0];
}
function ue(e) {
    var f = h.createElement("body");
    return f.innerHTML = e, f.childNodes[0];
}
function se(e) {
    return e = e.trim(), fe ? de(e) : le ? ve(e) : ue(e);
}
function B(e, f) {
    var a = e.nodeName, t = f.nodeName, n, u;
    return a === t ? !0 : (n = a.charCodeAt(0), u = t.charCodeAt(0), n <= 90 && u >= 97 ? a === t.toUpperCase() : u <= 90 && n >= 97 ? t === a.toUpperCase() : !1);
}
function ce(e, f) {
    return !f || f === ie ? h.createElement(e) : h.createElementNS(f, e);
}
function he(e, f) {
    for(var a = e.firstChild; a;){
        var t = a.nextSibling;
        f.appendChild(a), a = t;
    }
    return f;
}
function X(e, f, a) {
    e[a] !== f[a] && (e[a] = f[a], e[a] ? e.setAttribute(a, "") : e.removeAttribute(a));
}
var q = {
    OPTION: function(e, f) {
        var a = e.parentNode;
        if (a) {
            var t = a.nodeName.toUpperCase();
            t === "OPTGROUP" && (a = a.parentNode, t = a && a.nodeName.toUpperCase()), t === "SELECT" && !a.hasAttribute("multiple") && (e.hasAttribute("selected") && !f.selected && (e.setAttribute("selected", "selected"), e.removeAttribute("selected")), a.selectedIndex = -1);
        }
        X(e, f, "selected");
    },
    INPUT: function(e, f) {
        X(e, f, "checked"), X(e, f, "disabled"), e.value !== f.value && (e.value = f.value), f.hasAttribute("value") || e.removeAttribute("value");
    },
    TEXTAREA: function(e, f) {
        var a = f.value;
        e.value !== a && (e.value = a);
        var t = e.firstChild;
        if (t) {
            var n = t.nodeValue;
            if (n == a || !a && n == e.placeholder) return;
            t.nodeValue = a;
        }
    },
    SELECT: function(e, f) {
        if (!f.hasAttribute("multiple")) {
            for(var a = -1, t = 0, n = e.firstChild, u, s; n;)if (s = n.nodeName && n.nodeName.toUpperCase(), s === "OPTGROUP") u = n, n = u.firstChild;
            else {
                if (s === "OPTION") {
                    if (n.hasAttribute("selected")) {
                        a = t;
                        break;
                    }
                    t++;
                }
                n = n.nextSibling, !n && u && (n = u.nextSibling, u = null);
            }
            e.selectedIndex = a;
        }
    }
}, x = 1, J = 11, Q = 3, Z = 8;
function b() {}
function pe(e) {
    if (e) return e.getAttribute && e.getAttribute("id") || e.id;
}
function Ae(e) {
    return function(a, t, n) {
        if (n || (n = {}), typeof t == "string") if (a.nodeName === "#document" || a.nodeName === "HTML" || a.nodeName === "BODY") {
            var u = t;
            t = h.createElement("html"), t.innerHTML = u;
        } else t = se(t);
        else t.nodeType === J && (t = t.firstElementChild);
        var s = n.getNodeKey || pe, g = n.onBeforeNodeAdded || b, y = n.onNodeAdded || b, w = n.onBeforeElUpdated || b, U = n.onElUpdated || b, o = n.onBeforeNodeDiscarded || b, C = n.onNodeDiscarded || b, E = n.onBeforeElChildrenUpdated || b, ee = n.skipFromChildren || b, k = n.addChild || function(i, r) {
            return i.appendChild(r);
        }, H = n.childrenOnly === !0, S = Object.create(null), D = [];
        function R(i) {
            D.push(i);
        }
        function z(i, r) {
            if (i.nodeType === x) for(var v = i.firstChild; v;){
                var l = void 0;
                r && (l = s(v)) ? R(l) : (C(v), v.firstChild && z(v, r)), v = v.nextSibling;
            }
        }
        function M(i, r, v) {
            o(i) !== !1 && (r && r.removeChild(i), C(i), z(i, v));
        }
        function j(i) {
            if (i.nodeType === x || i.nodeType === J) for(var r = i.firstChild; r;){
                var v = s(r);
                v && (S[v] = r), j(r), r = r.nextSibling;
            }
        }
        j(a);
        function F(i) {
            y(i);
            for(var r = i.firstChild; r;){
                var v = r.nextSibling, l = s(r);
                if (l) {
                    var d = S[l];
                    d && B(r, d) ? (r.parentNode.replaceChild(d, r), P(d, r)) : F(r);
                } else F(r);
                r = v;
            }
        }
        function ae(i, r, v) {
            for(; r;){
                var l = r.nextSibling;
                (v = s(r)) ? R(v) : M(r, i, !0), r = l;
            }
        }
        function P(i, r, v) {
            var l = s(r);
            l && delete S[l], !(!v && (w(i, r) === !1 || (e(i, r), U(i), E(i, r) === !1))) && (i.nodeName !== "TEXTAREA" ? te(i, r) : q.TEXTAREA(i, r));
        }
        function te(i, r) {
            var v = ee(i, r), l = r.firstChild, d = i.firstChild, N, p, O, _, A;
            e: for(; l;){
                for(_ = l.nextSibling, N = s(l); !v && d;){
                    if (O = d.nextSibling, l.isSameNode && l.isSameNode(d)) {
                        l = _, d = O;
                        continue e;
                    }
                    p = s(d);
                    var m = d.nodeType, T = void 0;
                    if (m === l.nodeType && (m === x ? (N ? N !== p && ((A = S[N]) ? O === A ? T = !1 : (i.insertBefore(A, d), p ? R(p) : M(d, i, !0), d = A, p = s(d)) : T = !1) : p && (T = !1), T = T !== !1 && B(d, l), T && P(d, l)) : (m === Q || m == Z) && (T = !0, d.nodeValue !== l.nodeValue && (d.nodeValue = l.nodeValue))), T) {
                        l = _, d = O;
                        continue e;
                    }
                    p ? R(p) : M(d, i, !0), d = O;
                }
                if (N && (A = S[N]) && B(A, l)) v || k(i, A), P(A, l);
                else {
                    var K = g(l);
                    K !== !1 && (K && (l = K), l.actualize && (l = l.actualize(i.ownerDocument || h)), k(i, l), F(l));
                }
                l = _, d = O;
            }
            ae(i, d, p);
            var Y = q[i.nodeName];
            Y && Y(i, r);
        }
        var c = a, V = c.nodeType, W = t.nodeType;
        if (!H) {
            if (V === x) W === x ? B(a, t) || (C(a), c = he(a, ce(t.nodeName, t.namespaceURI))) : c = t;
            else if (V === Q || V === Z) {
                if (W === V) return c.nodeValue !== t.nodeValue && (c.nodeValue = t.nodeValue), c;
                c = t;
            }
        }
        if (c === t) C(a);
        else {
            if (t.isSameNode && t.isSameNode(c)) return;
            if (P(c, t, H), D) for(var G = 0, ne = D.length; G < ne; G++){
                var I = S[D[G]];
                I && M(I, I.parentNode, !1);
            }
        }
        return !H && c !== a && a.parentNode && (c.actualize && (c = c.actualize(a.ownerDocument || h)), a.parentNode.replaceChild(c, a)), c;
    };
}
var Te = Ae(re), be = Te;
function init(theme) {
    const peek = getInjectConfig();
    const t = theme || peek?.theme;
    mermaid.initialize({
        startOnLoad: false,
        theme: t === 'light' ? 'neutral' : 'dark',
        flowchart: {
            htmlLabels: false
        }
    });
}
async function render(id, definition, container) {
    try {
        return (await mermaid.render(id, definition, container)).svg;
    } catch  {}
}
const __default = {
    init,
    render
};
const window1 = globalThis;
addEventListener('DOMContentLoaded', ()=>{
    const body = document.body;
    const markdownBody = document.getElementById('peek-markdown-body');
    const base = document.getElementById('peek-base');
    const peek = getInjectConfig();
    let source;
    let blocks;
    let scroll;
    const zoom = {
        level: 100,
        zoomMin: 50,
        zoomMax: 250,
        zoomStep: 10,
        zoomLabel: document.getElementById('peek-zoom-label'),
        init () {
            this.level = Number(localStorage.getItem('zoom-level')) || this.level;
            this.update(this.level === 100);
        },
        up () {
            this.level = Math.min(this.level + this.zoomStep, this.zoomMax);
            this.update();
        },
        down () {
            this.level = Math.max(this.level - this.zoomStep, this.zoomMin);
            this.update();
        },
        reset () {
            this.level = 100;
            this.update();
        },
        update (silent) {
            localStorage.setItem('zoom-level', String(this.level));
            markdownBody.style.setProperty('font-size', `${this.level}%`);
            if (silent) return;
            this.zoomLabel.textContent = `${this.level}%`;
            this.zoomLabel.animate([
                {
                    opacity: 1
                },
                {
                    opacity: 1,
                    offset: 0.75
                },
                {
                    opacity: 0
                }
            ], {
                duration: 1000
            });
        }
    };
    if (peek.theme) body.setAttribute('data-theme', peek.theme);
    if (peek.ctx === 'webview') zoom.init();
    document.addEventListener('keydown', (event)=>{
        const ctrl = {
            '=': zoom.up.bind(zoom),
            '-': zoom.down.bind(zoom),
            '0': zoom.reset.bind(zoom)
        };
        const plain = {
            'j': ()=>{
                window1.scrollBy({
                    top: 50
                });
            },
            'k': ()=>{
                window1.scrollBy({
                    top: -50
                });
            },
            'd': ()=>{
                window1.scrollBy({
                    top: window1.innerHeight / 2
                });
            },
            'u': ()=>{
                window1.scrollBy({
                    top: -window1.innerHeight / 2
                });
            },
            'g': ()=>{
                window1.scrollTo({
                    top: 0
                });
            },
            'G': ()=>{
                window1.scrollTo({
                    top: document.body.scrollHeight
                });
            }
        };
        const action = event.ctrlKey && peek.ctx === 'webview' ? ctrl[event.key] : plain[event.key];
        if (action) {
            event.preventDefault();
            action();
        }
    });
    onload = ()=>{
        const item = sessionStorage.getItem('session');
        if (item) {
            const session = JSON.parse(item);
            base.href = session.base;
            onPreview({
                html: session.html,
                lcount: session.lcount
            });
            onScroll({
                line: session.line
            });
        }
    };
    onbeforeunload = ()=>{
        sessionStorage.setItem('session', JSON.stringify({
            base: base.href,
            html: markdownBody.innerHTML,
            lcount: source?.lcount,
            line: scroll?.line
        }));
    };
    const decoder = new TextDecoder();
    const socket = new WebSocket(`ws://${peek.serverUrl}/`);
    socket.binaryType = 'arraybuffer';
    socket.onclose = (event)=>{
        if (!event.wasClean) {
            close();
            location.reload();
        }
    };
    socket.onmessage = (event)=>{
        const data = JSON.parse(decoder.decode(event.data));
        switch(data.action){
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
    async function renderMermaidEl(el) {
        const svg = await __default.render(`${el.id}-svg`, el.getAttribute('data-graph-definition'), el);
        if (svg) {
            const svgElement = mermaidParser.parseFromString(svg, 'text/html').body;
            el.appendChild(svgElement);
            el.parentElement?.style.setProperty('height', window1.getComputedStyle(svgElement).getPropertyValue('height'));
        }
    }
    const renderMermaid = debounce(()=>{
        Array.from(markdownBody.querySelectorAll('div[data-graph="mermaid"]')).filter((el)=>!el.querySelector('svg')).forEach(renderMermaidEl);
    }, 200);
    function reRenderMermaid(theme) {
        __default.init(theme);
        markdownBody.querySelectorAll('div[data-graph="mermaid"]').forEach((el)=>{
            const svg = el.querySelector('svg');
            if (svg) svg.parentElement?.remove();
        });
        renderMermaid();
    }
    const onPreview = (()=>{
        __default.init();
        const morphdomOptions = {
            childrenOnly: true,
            getNodeKey: (node)=>{
                if (node instanceof HTMLElement && node.getAttribute('data-graph') === 'mermaid') {
                    return node.id;
                }
                return null;
            },
            onNodeAdded: (node)=>{
                if (node instanceof HTMLElement && node.getAttribute('data-graph') === 'mermaid') {
                    renderMermaid();
                }
                return node;
            },
            onBeforeElUpdated: (fromEl, toEl)=>{
                if (fromEl.hasAttribute('open')) {
                    toEl.setAttribute('open', 'true');
                } else if (fromEl.classList.contains('peek-mermaid-container') && toEl.classList.contains('peek-mermaid-container')) {
                    toEl.style.height = fromEl.style.height;
                }
                return !fromEl.isEqualNode(toEl);
            },
            onBeforeElChildrenUpdated (_, toEl) {
                return toEl.getAttribute('data-graph') !== 'mermaid';
            }
        };
        const mutationObserver = new MutationObserver(()=>{
            blocks = slidingWindows(Array.from(document.querySelectorAll('[data-line-begin]')), 2, {
                step: 1,
                partial: true
            });
        });
        const resizeObserver = new ResizeObserver(()=>{
            if (scroll) onScroll(scroll);
        });
        mutationObserver.observe(markdownBody, {
            childList: true
        });
        resizeObserver.observe(markdownBody);
        return (data)=>{
            source = {
                lcount: data.lcount
            };
            be(markdownBody, `<main>${data.html}</main>`, morphdomOptions);
        };
    })();
    const onScroll = (()=>{
        function getBlockOnLine(line) {
            return findLast(blocks, (block)=>line >= Number(block[0].dataset.lineBegin));
        }
        function getOffset(elem) {
            let current = elem;
            let top = 0;
            while(top === 0 && current){
                top = current.getBoundingClientRect().top;
                current = current.parentElement;
            }
            return top + window1.scrollY;
        }
        return (data)=>{
            scroll = data;
            if (!blocks || !blocks[0] || !source) return;
            const block = getBlockOnLine(data.line) || blocks[0];
            const target = block[0];
            const next = target ? block[1] : blocks[0][0];
            const offsetBegin = target ? getOffset(target) : 0;
            const offsetEnd = next ? getOffset(next) : offsetBegin + target.getBoundingClientRect().height;
            const lineBegin = target ? Number(target.dataset.lineBegin) : 1;
            const lineEnd = next ? Number(next.dataset.lineBegin) : source.lcount + 1;
            const pixPerLine = (offsetEnd - offsetBegin) / (lineEnd - lineBegin);
            const scrollPix = (data.line - lineBegin) * pixPerLine;
            window1.scroll({
                top: offsetBegin + scrollPix - window1.innerHeight / 2 + pixPerLine / 2
            });
        };
    })();
});
