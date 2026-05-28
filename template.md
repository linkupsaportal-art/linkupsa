<body>
    <div id="root"><script type="application/ld+json">{"@context":"https://schema.org","@type":"SoftwareSourceCode","name":"Photography Portfolio Landing Page Template","description":"A refined, black-and-white photography portfolio template for showcasing editorial work, fine art prints, studio process, awards, and journal entries.","programmingLanguage":{"@type":"ComputerLanguage","name":"html"},"author":{"@type":"Person","name":"Aksonvady Phomhome"},"dateCreated":"2026-01-22T03:06:56.718+00:00","codeRepository":"https://lumen-portfolio.aura.build","keywords":"Landing Page, Portfolio, Art & Design, Photography, Brand, Minimal, Black & White, Large Type, Clean"}</script><div class="min-h-screen bg-background relative" style=""><div class="relative h-screen w-full"><div dir="ltr" data-orientation="horizontal" class="w-full h-full"><div role="tablist" aria-orientation="horizontal" class="h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground hidden" tabindex="0" data-orientation="horizontal" style="outline: none;"><button type="button" role="tab" aria-selected="true" aria-controls="radix-:r0:-content-preview" data-state="active" id="radix-:r0:-trigger-preview" class="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm" tabindex="-1" data-orientation="horizontal" data-radix-collection-item="">Preview</button><button type="button" role="tab" aria-selected="false" aria-controls="radix-:r0:-content-code" data-state="inactive" id="radix-:r0:-trigger-code" class="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm" tabindex="-1" data-orientation="horizontal" data-radix-collection-item="">Code</button></div><div data-state="inactive" data-orientation="horizontal" role="tabpanel" aria-labelledby="radix-:r0:-trigger-code" hidden="" id="radix-:r0:-content-code" tabindex="0" class="ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 m-0 p-0 h-full"></div><div data-state="active" data-orientation="horizontal" role="tabpanel" aria-labelledby="radix-:r0:-trigger-preview" id="radix-:r0:-content-preview" tabindex="0" class="ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 m-0 p-0 h-full" style=""><div class="h-full w-full"><iframe title="HTML Preview" class="w-full h-screen border-0" sandbox="allow-scripts allow-forms allow-popups allow-modals allow-same-origin" srcdoc="<html lang="en"><head>
<script id="aura-supabase-token-firewall">(function () {
  if (window.__AURA_SUPABASE_FIREWALL__) return;
  window.__AURA_SUPABASE_FIREWALL__ = true;

  var SUPABASE_HOST = &quot;hoirqrkdgbmvpwutwuwj.supabase.co&quot;;
  var BLOCKED_KEY_PATTERNS = [
    /^sb-[a-z0-9-]+-auth-token$/i,
    /^supabase\.auth\.token$/i
  ];

  function isBlockedStorageKey(key) {
    if (typeof key !== &quot;string&quot;) return false;
    for (var i = 0; i &lt; BLOCKED_KEY_PATTERNS.length; i++) {
      if (BLOCKED_KEY_PATTERNS[i].test(key)) return true;
    }
    return false;
  }

  function toAbsoluteUrl(input) {
    try {
      return new URL(input, window.location.href);
    } catch {
      return null;
    }
  }

  function isSupabaseDestination(input) {
    var parsed = toAbsoluteUrl(input);
    if (!parsed) return false;
    if (SUPABASE_HOST &amp;&amp; parsed.host === SUPABASE_HOST) return true;
    return parsed.host.endsWith(&quot;.supabase.co&quot;);
  }

  function pathLooksSensitive(input) {
    var parsed = toAbsoluteUrl(input);
    if (!parsed) return false;
    return /^\/(auth|rest|functions)\/v1\//.test(parsed.pathname || &quot;&quot;);
  }

  function headersContainAuth(headersLike) {
    if (!headersLike) return false;

    try {
      if (typeof Headers !==&quot;undefined&quot; &amp;&amp; headersLike instanceof Headers) {
        return !!(headersLike.get(&quot;authorization&quot;) || headersLike.get(&quot;apikey&quot;));
      }
    } catch {}

    if (Array.isArray(headersLike)) {
      for (var i = 0; i&lt; headersLike.length; i++) {
        var pair = headersLike[i] || [];
        var name = String(pair[0] || &quot;&quot;).toLowerCase();
        if (name === &quot;authorization&quot; || name === &quot;apikey&quot;) return true;
      }
      return false;
    }

    if (typeof headersLike ===&quot;object&quot;) {
      var keys = Object.keys(headersLike);
      for (var j = 0; j &lt; keys.length; j++) {
        var k = keys[j].toLowerCase();
        if (k === &quot;authorization&quot; || k === &quot;apikey&quot;) return true;
      }
    }
    return false;
  }

  function requestLooksSensitive(input, init, extraHeaders) {
    var url = &quot;&quot;;
    try {
      if (typeof input === &quot;string&quot;) {
        url = input;
      } else if (input &amp;&amp; typeof input.url === &quot;string&quot;) {
        url = input.url;
      }
    } catch {}

    var headers =
      (init&amp;&amp; init.headers) ||
      (input &amp;&amp; input.headers) ||
      extraHeaders ||
      null;
    var hasAuthHeaders = headersContainAuth(headers);
    if (hasAuthHeaders) return true;

    if (!url) return false;
    if (isSupabaseDestination(url)&amp;&amp; pathLooksSensitive(url)) return true;
    return false;
  }

  function patchStorage(storage, storageName) {
    if (!storage) return;
    var proto = Object.getPrototypeOf(storage);
    if (!proto || proto.__auraSupabaseFirewallPatched) return;

    var rawGetItem = proto.getItem;
    var rawSetItem = proto.setItem;
    var rawRemoveItem = proto.removeItem;
    var rawClear = proto.clear;
    var rawKey = proto.key;
    var rawLengthDescriptor = Object.getOwnPropertyDescriptor(proto,&quot;length&quot;);
    var rawLengthGet = rawLengthDescriptor &amp;&amp; rawLengthDescriptor.get;

    function getRawLength(instance) {
      try {
        if (rawLengthGet) return Number(rawLengthGet.call(instance) || 0);
      } catch {}
      try {
        return Number(instance.length || 0);
      } catch {}
      return 0;
    }

    function getVisibleKeys(instance) {
      var visible = [];
      var total = getRawLength(instance);
      for (var i = 0; i&lt; total; i++) {
        var currentKey = rawKey.call(instance, i);
        if (currentKey &amp;&amp; !isBlockedStorageKey(currentKey)) {
          visible.push(currentKey);
        }
      }
      return visible;
    }

    function maskBlockedKeyProperty(instance, keyName) {
      if (!keyName || !isBlockedStorageKey(keyName)) return;
      try {
        Object.defineProperty(instance, keyName, {
          configurable: true,
          enumerable: false,
          get: function () {
            return null;
          },
          set: function () {
            return true;
          }
        });
      } catch {}
    }

    function syncBlockedKeyProperties(instance) {
      var total = getRawLength(instance);
      for (var i = 0; i&lt; total; i++) {
        var k = rawKey.call(instance, i);
        if (k) maskBlockedKeyProperty(instance, k);
      }
    }

    proto.getItem = function (key) {
      syncBlockedKeyProperties(this);
      if (isBlockedStorageKey(String(key))) return null;
      return rawGetItem.call(this, key);
    };

    proto.setItem = function (key, value) {
      if (isBlockedStorageKey(String(key))) return;
      return rawSetItem.call(this, key, value);
    };

    proto.removeItem = function (key) {
      if (isBlockedStorageKey(String(key))) return;
      return rawRemoveItem.call(this, key);
    };

    proto.clear = function () {
      if (typeof rawClear !==&quot;function&quot;) return;

    // Preserve blocked keys across clear() to prevent auth token/session wipe.
      var preservedBlockedEntries = [];
      var total = getRawLength(this);
      for (var i = 0; i&lt; total; i++) {
        var blockedKey = rawKey.call(this, i);
        if (blockedKey &amp;&amp; isBlockedStorageKey(blockedKey)) {
          preservedBlockedEntries.push([
            blockedKey,
            rawGetItem.call(this, blockedKey),
          ]);
        }
      }

    rawClear.call(this);

    for (var j = 0; j&lt; preservedBlockedEntries.length; j++) {
        var entry = preservedBlockedEntries[j];
        var key = entry[0];
        var value = entry[1];
        if (typeof key === &quot;string&quot; &amp;&amp; typeof value === &quot;string&quot;) {
          rawSetItem.call(this, key, value);
        }
      }

    syncBlockedKeyProperties(this);
    };

    proto.key = function (index) {
      syncBlockedKeyProperties(this);
      var visible = getVisibleKeys(this);
      return visible[index] || null;
    };

    try {
      Object.defineProperty(proto,&quot;length&quot;, {
        configurable: true,
        enumerable: false,
        get: function () {
          syncBlockedKeyProperties(this);
          return getVisibleKeys(this).length;
        }
      });
    } catch {}

    var proxyStorage = null;
    try {
      proxyStorage = new Proxy(storage, {
        get: function (target, prop) {
          if (typeof prop ===&quot;string&quot; &amp;&amp; isBlockedStorageKey(prop)) return null;
          if (prop === &quot;length&quot;) return getVisibleKeys(target).length;
          if (prop === &quot;key&quot;) {
            return function (index) {
              var visible = getVisibleKeys(target);
              return visible[index] || null;
            };
          }
          if (prop === &quot;clear&quot;) {
            return function () {
              if (typeof rawClear !== &quot;function&quot;) return;

    var preservedBlockedEntries = [];
              var total = getRawLength(target);
              for (var i = 0; i&lt; total; i++) {
                var blockedKey = rawKey.call(target, i);
                if (blockedKey &amp;&amp; isBlockedStorageKey(blockedKey)) {
                  preservedBlockedEntries.push([
                    blockedKey,
                    rawGetItem.call(target, blockedKey),
                  ]);
                }
              }

    rawClear.call(target);

    for (var j = 0; j&lt; preservedBlockedEntries.length; j++) {
                var entry = preservedBlockedEntries[j];
                var key = entry[0];
                var value = entry[1];
                if (typeof key === &quot;string&quot; &amp;&amp; typeof value === &quot;string&quot;) {
                  rawSetItem.call(target, key, value);
                }
              }

    syncBlockedKeyProperties(target);
            };
          }

    var value = target[prop];
          if (typeof value ===&quot;function&quot;) return value.bind(target);
          return value;
        },
        set: function (target, prop, value) {
          if (typeof prop === &quot;string&quot; &amp;&amp; isBlockedStorageKey(prop)) return true;
          target[prop] = value;
          return true;
        },
        has: function (target, prop) {
          if (typeof prop === &quot;string&quot; &amp;&amp; isBlockedStorageKey(prop)) return false;
          return prop in target;
        },
        deleteProperty: function (target, prop) {
          if (typeof prop === &quot;string&quot; &amp;&amp; isBlockedStorageKey(prop)) return true;
          try {
            delete target[prop];
          } catch {}
          return true;
        },
        ownKeys: function (target) {
          return getVisibleKeys(target);
        },
        getOwnPropertyDescriptor: function (target, prop) {
          if (typeof prop === &quot;string&quot; &amp;&amp; isBlockedStorageKey(prop)) {
            return undefined;
          }
          if (prop === &quot;length&quot;) {
            return {
              configurable: true,
              enumerable: false,
              value: getVisibleKeys(target).length,
              writable: false
            };
          }
          return Object.getOwnPropertyDescriptor(target, prop);
        }
      });
    } catch {}

    try {
      if (proxyStorage) {
        Object.defineProperty(window, storageName, {
          configurable: true,
          enumerable: true,
          get: function () {
            return proxyStorage;
          }
        });
      }
    } catch {}

    syncBlockedKeyProperties(storage);
    proto.__auraSupabaseFirewallPatched = true;
  }

  function patchCookieAccess() {
    try {
      var cookieDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, &quot;cookie&quot;);
      if (!cookieDescriptor || !cookieDescriptor.configurable) return;

    Object.defineProperty(document,&quot;cookie&quot;, {
        configurable: true,
        enumerable: false,
        get: function () {
          return &quot;&quot;;
        },
        set: function () {
          return true;
        }
      });
    } catch {}
  }

  function patchFetch() {
    if (typeof window.fetch !== &quot;function&quot;) return;
    var rawFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
      if (requestLooksSensitive(input, init, null)) {
        return Promise.reject(new Error(&quot;Blocked by Aura security policy&quot;));
      }
      return rawFetch(input, init);
    };
  }

  function patchXHR() {
    if (typeof XMLHttpRequest === &quot;undefined&quot;) return;
    var rawOpen = XMLHttpRequest.prototype.open;
    var rawSetHeader = XMLHttpRequest.prototype.setRequestHeader;
    var rawSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url) {
      this.__auraRequestUrl = String(url ||&quot;&quot;);
      this.__auraHeaders = {};
      return rawOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
      if (!this.__auraHeaders) this.__auraHeaders = {};
      this.__auraHeaders[String(name ||&quot;&quot;).toLowerCase()] = String(value || &quot;&quot;);
      return rawSetHeader.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function () {
      if (requestLooksSensitive(this.__auraRequestUrl ||&quot;&quot;, null, this.__auraHeaders || null)) {
        throw new Error(&quot;Blocked by Aura security policy&quot;);
      }
      return rawSend.apply(this, arguments);
    };
  }

  function patchBeacon() {
    if (typeof navigator.sendBeacon !== &quot;function&quot;) return;
    var rawBeacon = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = function (url, data) {
      if (requestLooksSensitive(url, null, null)) return false;
      return rawBeacon(url, data);
    };
  }

  function patchWebSocket() {
    if (typeof WebSocket === &quot;undefined&quot;) return;
    var RawWebSocket = WebSocket;
    window.WebSocket = function (url, protocols) {
      if (requestLooksSensitive(String(url || &quot;&quot;), null, null)) {
        throw new Error(&quot;Blocked by Aura security policy&quot;);
      }
      return new RawWebSocket(url, protocols);
    };
    window.WebSocket.prototype = RawWebSocket.prototype;
  }

  patchStorage(window.localStorage, &quot;localStorage&quot;);
  patchStorage(window.sessionStorage, &quot;sessionStorage&quot;);
  patchCookieAccess();
  patchFetch();
  patchXHR();
  patchBeacon();
  patchWebSocket();
})();&lt;/script&gt;

&lt;meta charset=&quot;UTF-8&quot;&gt;
&lt;meta name=&quot;viewport&quot; content=&quot;width=device-width, initial-scale=1.0&quot;&gt;
&lt;title&gt;LUMEN | Visual Narratives&lt;/title&gt;
&lt;script src=&quot;https://cdn.tailwindcss.com&quot;&gt;&lt;/script&gt;
&lt;script src=&quot;https://unpkg.com/lucide@latest&quot;&gt;&lt;/script&gt;
&lt;script src=&quot;https://code.iconify.design/3/3.1.0/iconify.min.js&quot;&gt;&lt;/script&gt;
&lt;style&gt;
/* Custom scrollbar */
::-webkit-scrollbar {
width: 6px;
}
::-webkit-scrollbar-track {
background: #0f172a;
}
::-webkit-scrollbar-thumb {
background: #38bdf8;
border-radius: 3px;
}
/* Thin grid lines */
.grid-lines {
background-image: linear-gradient(to right, rgba(0, 0, 0, 0.05) 1px, transparent 1px);
background-size: 25% 100%;
}
.text-outline {
-webkit-text-stroke: 1px rgba(0,0,0,0.2);
color: transparent;
}
&lt;/style&gt;
&lt;style id=&quot;aura-editor-visibility-style&quot;&gt;
.invisible { visibility: hidden !important; }
&lt;/style&gt;
&lt;link href=&quot;https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&amp;amp;family=Inter:wght@300;400;500;600&amp;amp;family=Space+Grotesk:wght@300;400;500&amp;amp;display=swap&quot; rel=&quot;stylesheet&quot;&gt;
&lt;style&gt;
body { font-family: 'Inter', sans-serif; }
h1, h2, h3, h4 { font-family: 'Geist', sans-serif; }
.font-mono { font-family: 'Space Grotesk', monospace; }
&lt;/style&gt;
&lt;link id=&quot;all-fonts-link-font-roboto&quot; rel=&quot;stylesheet&quot; href=&quot;https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700&amp;amp;display=swap&quot;&gt;&lt;style id=&quot;all-fonts-style-font-roboto&quot;&gt;.font-roboto { font-family: 'Roboto', sans-serif !important; }&lt;/style&gt;&lt;link id=&quot;all-fonts-link-font-montserrat&quot; rel=&quot;stylesheet&quot; href=&quot;https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&amp;amp;display=swap&quot;&gt;&lt;style id=&quot;all-fonts-style-font-montserrat&quot;&gt;.font-montserrat { font-family: 'Montserrat', sans-serif !important; }&lt;/style&gt;&lt;link id=&quot;all-fonts-link-font-poppins&quot; rel=&quot;stylesheet&quot; href=&quot;https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&amp;amp;display=swap&quot;&gt;&lt;style id=&quot;all-fonts-style-font-poppins&quot;&gt;.font-poppins { font-family: 'Poppins', sans-serif !important; }&lt;/style&gt;&lt;link id=&quot;all-fonts-link-font-playfair&quot; rel=&quot;stylesheet&quot; href=&quot;https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;900&amp;amp;display=swap&quot;&gt;&lt;style id=&quot;all-fonts-style-font-playfair&quot;&gt;.font-playfair { font-family: 'Playfair Display', serif !important; }&lt;/style&gt;&lt;link id=&quot;all-fonts-link-font-instrument-serif&quot; rel=&quot;stylesheet&quot; href=&quot;https://fonts.googleapis.com/css2?family=Instrument+Serif:wght@400;500;600;700&amp;amp;display=swap&quot;&gt;&lt;style id=&quot;all-fonts-style-font-instrument-serif&quot;&gt;.font-instrument-serif { font-family: 'Instrument Serif', serif !important; }&lt;/style&gt;&lt;link id=&quot;all-fonts-link-font-merriweather&quot; rel=&quot;stylesheet&quot; href=&quot;https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700;900&amp;amp;display=swap&quot;&gt;&lt;style id=&quot;all-fonts-style-font-merriweather&quot;&gt;.font-merriweather { font-family: 'Merriweather', serif !important; }&lt;/style&gt;&lt;link id=&quot;all-fonts-link-font-bricolage&quot; rel=&quot;stylesheet&quot; href=&quot;https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@300;400;500;600;700&amp;amp;display=swap&quot;&gt;&lt;style id=&quot;all-fonts-style-font-bricolage&quot;&gt;.font-bricolage { font-family: 'Bricolage Grotesque', sans-serif !important; }&lt;/style&gt;&lt;link id=&quot;all-fonts-link-font-jakarta&quot; rel=&quot;stylesheet&quot; href=&quot;https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&amp;amp;display=swap&quot;&gt;&lt;style id=&quot;all-fonts-style-font-jakarta&quot;&gt;.font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif !important; }&lt;/style&gt;&lt;link id=&quot;all-fonts-link-font-manrope&quot; rel=&quot;stylesheet&quot; href=&quot;https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&amp;amp;display=swap&quot;&gt;&lt;style id=&quot;all-fonts-style-font-manrope&quot;&gt;.font-manrope { font-family: 'Manrope', sans-serif !important; }&lt;/style&gt;&lt;link id=&quot;all-fonts-link-font-space-grotesk&quot; rel=&quot;stylesheet&quot; href=&quot;https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&amp;amp;display=swap&quot;&gt;&lt;style id=&quot;all-fonts-style-font-space-grotesk&quot;&gt;.font-space-grotesk { font-family: 'Space Grotesk', sans-serif !important; }&lt;/style&gt;&lt;link id=&quot;all-fonts-link-font-work-sans&quot; rel=&quot;stylesheet&quot; href=&quot;https://fonts.googleapis.com/css2?family=Work+Sans:wght@300;400;500;600;700;800&amp;amp;display=swap&quot;&gt;&lt;style id=&quot;all-fonts-style-font-work-sans&quot;&gt;.font-work-sans { font-family: 'Work Sans', sans-serif !important; }&lt;/style&gt;&lt;link id=&quot;all-fonts-link-font-pt-serif&quot; rel=&quot;stylesheet&quot; href=&quot;https://fonts.googleapis.com/css2?family=PT+Serif:wght@400;700&amp;amp;display=swap&quot;&gt;&lt;style id=&quot;all-fonts-style-font-pt-serif&quot;&gt;.font-pt-serif { font-family: 'PT Serif', serif !important; }&lt;/style&gt;&lt;link id=&quot;all-fonts-link-font-geist-mono&quot; rel=&quot;stylesheet&quot; href=&quot;https://fonts.googleapis.com/css2?family=Geist+Mono:wght@300;400;500;600;700&amp;amp;display=swap&quot;&gt;&lt;style id=&quot;all-fonts-style-font-geist-mono&quot;&gt;.font-geist-mono { font-family: 'Geist Mono', monospace !important; }&lt;/style&gt;&lt;link id=&quot;all-fonts-link-font-space-mono&quot; rel=&quot;stylesheet&quot; href=&quot;https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&amp;amp;display=swap&quot;&gt;&lt;style id=&quot;all-fonts-style-font-space-mono&quot;&gt;.font-space-mono { font-family: 'Space Mono', monospace !important; }&lt;/style&gt;&lt;link id=&quot;all-fonts-link-font-quicksand&quot; rel=&quot;stylesheet&quot; href=&quot;https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&amp;amp;display=swap&quot;&gt;&lt;style id=&quot;all-fonts-style-font-quicksand&quot;&gt;.font-quicksand { font-family: 'Quicksand', sans-serif !important; }&lt;/style&gt;&lt;link id=&quot;all-fonts-link-font-nunito&quot; rel=&quot;stylesheet&quot; href=&quot;https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;800&amp;amp;display=swap&quot;&gt;&lt;style id=&quot;all-fonts-style-font-nunito&quot;&gt;.font-nunito { font-family: 'Nunito', sans-serif !important; }&lt;/style&gt;&lt;link id=&quot;all-fonts-link-font-newsreader&quot; rel=&quot;stylesheet&quot; href=&quot;https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400..800&amp;amp;display=swap&quot;&gt;&lt;style id=&quot;all-fonts-style-font-newsreader&quot;&gt;.font-newsreader { font-family: 'Newsreader', serif !important; }&lt;/style&gt;&lt;link id=&quot;all-fonts-link-font-google-sans-flex&quot; rel=&quot;stylesheet&quot; href=&quot;https://fonts.googleapis.com/css2?family=Google+Sans+Flex:wght@400;500;600;700&amp;amp;display=swap&quot;&gt;&lt;style id=&quot;all-fonts-style-font-google-sans-flex&quot;&gt;.font-google-sans-flex { font-family: 'Google Sans Flex', sans-serif !important; }&lt;/style&gt;&lt;link id=&quot;all-fonts-link-font-oswald&quot; rel=&quot;stylesheet&quot; href=&quot;https://fonts.googleapis.com/css2?family=Oswald:wght@300;400;500;600;700&amp;amp;display=swap&quot;&gt;&lt;style id=&quot;all-fonts-style-font-oswald&quot;&gt;.font-oswald { font-family: 'Oswald', sans-serif !important; }&lt;/style&gt;&lt;link id=&quot;all-fonts-link-font-dm-sans&quot; rel=&quot;stylesheet&quot; href=&quot;https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&amp;amp;display=swap&quot;&gt;&lt;style id=&quot;all-fonts-style-font-dm-sans&quot;&gt;.font-dm-sans { font-family: 'DM Sans', sans-serif !important; }&lt;/style&gt;&lt;link id=&quot;all-fonts-link-font-cormorant&quot; rel=&quot;stylesheet&quot; href=&quot;https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&amp;amp;display=swap&quot;&gt;&lt;style id=&quot;all-fonts-style-font-cormorant&quot;&gt;.font-cormorant { font-family: 'Cormorant Garamond', serif !important; }&lt;/style&gt;&lt;/head&gt;
  &lt;body class=&quot;min-h-screen overflow-x-hidden selection:bg-sky-500 selection:text-white relative text-zinc-900 bg-zinc-50&quot;&gt;
    &lt;!-- Background Grid Lines --&gt;
    &lt;div class=&quot;fixed grid-lines pointer-events-none z-0 top-0 right-0 bottom-0 left-0 overflow-hidden&quot;&gt;
  &lt;svg class=&quot;absolute inset-0 w-full h-full&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot; preserveAspectRatio=&quot;none&quot;&gt;
    &lt;defs&gt;
      &lt;linearGradient id=&quot;neonGradient1&quot; x1=&quot;0%&quot; y1=&quot;0%&quot; x2=&quot;100%&quot; y2=&quot;0%&quot;&gt;
        &lt;stop offset=&quot;0%&quot; style=&quot;stop-color:rgba(14, 165, 233, 0);stop-opacity:0&quot;&gt;&lt;/stop&gt;
        &lt;stop offset=&quot;50%&quot; style=&quot;stop-color:rgba(14, 165, 233, 0.5);stop-opacity:1&quot;&gt;&lt;/stop&gt;
        &lt;stop offset=&quot;100%&quot; style=&quot;stop-color:rgba(14, 165, 233, 0);stop-opacity:0&quot;&gt;&lt;/stop&gt;
      &lt;/linearGradient&gt;
      &lt;linearGradient id=&quot;neonGradient2&quot; x1=&quot;0%&quot; y1=&quot;0%&quot; x2=&quot;0%&quot; y2=&quot;100%&quot;&gt;
        &lt;stop offset=&quot;0%&quot; style=&quot;stop-color:rgba(14, 165, 233, 0);stop-opacity:0&quot;&gt;&lt;/stop&gt;
        &lt;stop offset=&quot;50%&quot; style=&quot;stop-color:rgba(14, 165, 233, 0.5);stop-opacity:1&quot;&gt;&lt;/stop&gt;
        &lt;stop offset=&quot;100%&quot; style=&quot;stop-color:rgba(14, 165, 233, 0);stop-opacity:0&quot;&gt;&lt;/stop&gt;
      &lt;/linearGradient&gt;
      &lt;filter id=&quot;neonGlow&quot; x=&quot;-50%&quot; y=&quot;-50%&quot; width=&quot;200%&quot; height=&quot;200%&quot;&gt;
        &lt;feGaussianBlur stdDeviation=&quot;2&quot; result=&quot;coloredBlur&quot;&gt;&lt;/feGaussianBlur&gt;
        &lt;feMerge&gt;
          &lt;feMergeNode in=&quot;coloredBlur&quot;&gt;&lt;/feMergeNode&gt;
          &lt;feMergeNode in=&quot;SourceGraphic&quot;&gt;&lt;/feMergeNode&gt;
        &lt;/feMerge&gt;
      &lt;/filter&gt;
    &lt;/defs&gt;

    &lt;!-- Animated Lines --&gt;
    &lt;line x1=&quot;-200&quot; y1=&quot;25%&quot; x2=&quot;0&quot; y2=&quot;25%&quot; stroke=&quot;url(#neonGradient1)&quot; stroke-width=&quot;1&quot; filter=&quot;url(#neonGlow)&quot;&gt;
      &lt;animate attributeName=&quot;x1&quot; values=&quot;-200;100%&quot; dur=&quot;15s&quot; repeatCount=&quot;indefinite&quot;&gt;&lt;/animate&gt;
      &lt;animate attributeName=&quot;x2&quot; values=&quot;0;120%&quot; dur=&quot;15s&quot; repeatCount=&quot;indefinite&quot;&gt;&lt;/animate&gt;
    &lt;/line&gt;

    &lt;line x1=&quot;75%&quot; y1=&quot;-200&quot; x2=&quot;75%&quot; y2=&quot;0&quot; stroke=&quot;url(#neonGradient2)&quot; stroke-width=&quot;1&quot; filter=&quot;url(#neonGlow)&quot;&gt;
      &lt;animate attributeName=&quot;y1&quot; values=&quot;-200;100%&quot; dur=&quot;12s&quot; repeatCount=&quot;indefinite&quot;&gt;&lt;/animate&gt;
      &lt;animate attributeName=&quot;y2&quot; values=&quot;0;120%&quot; dur=&quot;12s&quot; repeatCount=&quot;indefinite&quot;&gt;&lt;/animate&gt;
    &lt;/line&gt;
  &lt;/svg&gt;
&lt;/div&gt;

    &lt;!-- Navigation --&gt;
    &lt;nav class=&quot;flex md:px-12 z-50 border-b pt-6 pr-6 pb-6 pl-6 relative items-center justify-between border-black/5 bg-zinc-50/80 backdrop-blur-md&quot;&gt;
      &lt;a href=&quot;#&quot; class=&quot;inline-flex items-center gap-2 font-bold tracking-tighter text-2xl&quot;&gt;
        &lt;span class=&quot;w-6 h-6 rounded flex items-center justify-center text-sm text-white bg-zinc-900&quot;&gt;L&lt;/span&gt;
        LUMEN
      &lt;/a&gt;

    &lt;div class=&quot;relative&quot;&gt;
        &lt;button onclick=&quot;document.getElementById('nav-dropdown').classList.toggle('hidden')&quot; class=&quot;group flex items-center gap-3 px-5 py-2 border transition duration-300 bg-transparent border-black/10 hover:bg-black/5&quot;&gt;
          &lt;svg xmlns=&quot;http://www.w3.org/2000/svg&quot; width=&quot;24&quot; height=&quot;24&quot; viewBox=&quot;0 0 24 24&quot; fill=&quot;none&quot; stroke=&quot;currentColor&quot; stroke-width=&quot;2&quot; stroke-linecap=&quot;round&quot; stroke-linejoin=&quot;round&quot; data-lucide=&quot;menu&quot; class=&quot;lucide lucide-menu w-5 h-5 stroke-[1.5] text-black&quot;&gt;&lt;path d=&quot;M4 5h16&quot;&gt;&lt;/path&gt;&lt;path d=&quot;M4 12h16&quot;&gt;&lt;/path&gt;&lt;path d=&quot;M4 19h16&quot;&gt;&lt;/path&gt;&lt;/svg&gt;
          &lt;span class=&quot;text-sm font-medium tracking-wide&quot;&gt;Work&lt;/span&gt;
        &lt;/button&gt;

    &lt;div id=&quot;nav-dropdown&quot; class=&quot;hidden absolute right-0 top-full mt-2 w-56 border shadow-2xl py-2 z-50 backdrop-blur-xl bg-white border-black/5&quot;&gt;
          &lt;a href=&quot;#&quot; class=&quot;block px-6 py-3 text-sm font-medium transition-colors tracking-wide border-b text-black/70 hover:bg-black/5 border-black/5 hover:text-sky-600&quot;&gt;Portfolio&lt;/a&gt;
          &lt;a href=&quot;#&quot; class=&quot;block px-6 py-3 text-sm font-medium transition-colors tracking-wide border-b text-black/70 hover:bg-black/5 border-black/5 hover:text-sky-600&quot;&gt;Series&lt;/a&gt;
          &lt;a href=&quot;#&quot; class=&quot;block px-6 py-3 text-sm font-medium transition-colors tracking-wide border-b text-black/70 hover:bg-black/5 border-black/5 hover:text-sky-600&quot;&gt;Exhibitions&lt;/a&gt;
          &lt;a href=&quot;#&quot; class=&quot;block px-6 py-3 text-sm font-medium transition-colors tracking-wide text-black/70 hover:bg-black/5 hover:text-sky-600&quot;&gt;Contact&lt;/a&gt;
        &lt;/div&gt;
      &lt;/div&gt;
    &lt;/nav&gt;

    &lt;!-- Main Wrapper --&gt;
    &lt;main class=&quot;z-10 relative&quot;&gt;
      &lt;!-- Hero Section --&gt;
      &lt;section class=&quot;md:pt-24 md:pb-32 md:px-12 grid grid-cols-1 md:grid-cols-4 gap-0 border-b pt-16 pr-6 pb-20 pl-6 relative gap-x-0 gap-y-0 border-black/10&quot;&gt;
        &lt;!-- Abstract Video Background --&gt;
        &lt;video src=&quot;https://cdn.coverr.co/videos/coverr-shadows-of-leaves-on-a-wall-3536/1080p.mp4&quot; autoplay=&quot;&quot; loop=&quot;&quot; muted=&quot;&quot; playsinline=&quot;&quot; class=&quot;z-10 opacity-[0.08] w-full h-full object-cover absolute top-0 right-0 bottom-0 left-0&quot;&gt;&lt;/video&gt;

    &lt;!-- Left Col --&gt;
        &lt;div class=&quot;col-span-1 flex flex-col z-20 h-full relative justify-between&quot;&gt;
          &lt;div class=&quot;mb-16&quot;&gt;
            &lt;p class=&quot;text-[10px] uppercase md:text-xs font-semibold tracking-widest mb-2 text-sky-600&quot;&gt;
              Focus: Light &amp;amp; Geometry
            &lt;/p&gt;
            &lt;h1 class=&quot;text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-none mb-4&quot;&gt;
              LUMEN
              &lt;span class=&quot;text-sky-500 text-6xl align-top&quot;&gt;+&lt;/span&gt;
            &lt;/h1&gt;
            &lt;div class=&quot;h-px w-full bg-gradient-to-r to-transparent my-6 from-black/20&quot;&gt;&lt;/div&gt;
          &lt;/div&gt;

    &lt;div class=&quot;grid grid-cols-2 gap-8 mb-12&quot;&gt;
            &lt;div class=&quot;group cursor-pointer&quot;&gt;
              &lt;svg xmlns=&quot;http://www.w3.org/2000/svg&quot; aria-hidden=&quot;true&quot; role=&quot;img&quot; width=&quot;1em&quot; height=&quot;1em&quot; viewBox=&quot;0 0 24 24&quot; data-icon=&quot;solar:camera-minimalistic-bold-duotone&quot; class=&quot;iconify text-4xl mb-4 group-hover:text-sky-600 transition-colors text-zinc-800 iconify--solar&quot;&gt;&lt;defs&gt;&lt;mask id=&quot;IconifyId19bd4e7f5b9fcf4560&quot;&gt;&lt;g fill=&quot;none&quot;&gt;&lt;path fill=&quot;#fff&quot; d=&quot;M9.778 21h4.444c3.121 0 4.682 0 5.803-.722a4.4 4.4 0 0 0 1.226-1.183C22 18.015 22 16.51 22 13.5s0-4.514-.75-5.595a4.4 4.4 0 0 0-1.225-1.183C18.904 6 17.343 6 14.222 6H9.778c-3.121 0-4.682 0-5.803.722A4.4 4.4 0 0 0 2.75 7.905C2 8.985 2 10.49 2 13.498v.002c0 3.01 0 4.514.749 5.595c.324.468.74.87 1.226 1.183C5.096 21 6.657 21 9.778 21&quot; opacity=&quot;.5&quot;&gt;&lt;/path&gt;&lt;path fill=&quot;#fff&quot; fill-rule=&quot;evenodd&quot; d=&quot;M8 4c0-.552.413-1 .923-1h6.154c.51 0 .923.448.923 1s-.413 1-.923 1H8.923C8.413 5 8 4.552 8 4&quot; clip-rule=&quot;evenodd&quot;&gt;&lt;/path&gt;&lt;path fill=&quot;#000&quot; fill-rule=&quot;evenodd&quot; d=&quot;M17.278 10.286c0-.444.373-.804.833-.804h.556c.46 0 .833.36.833.804s-.373.804-.833.804h-.556c-.46 0-.833-.36-.833-.804&quot; clip-rule=&quot;evenodd&quot;&gt;&lt;/path&gt;&lt;path fill=&quot;#fff&quot; fill-rule=&quot;evenodd&quot; d=&quot;M7.834 13.5c0-2.219 1.865-4.018 4.166-4.018s4.167 1.8 4.167 4.018c0 2.22-1.866 4.018-4.167 4.018S7.834 15.72 7.834 13.5m1.666 0c0-1.331 1.12-2.41 2.5-2.41s2.5 1.079 2.5 2.41s-1.12 2.411-2.5 2.411s-2.5-1.08-2.5-2.41m8.611-4.019c-.46 0-.833.36-.833.804s.373.804.833.804h.556c.46 0 .833-.36.833-.804s-.373-.804-.833-.804z&quot; clip-rule=&quot;evenodd&quot;&gt;&lt;/path&gt;&lt;/g&gt;&lt;/mask&gt;&lt;/defs&gt;&lt;path fill=&quot;currentColor&quot; d=&quot;M0 0h24v24H0z&quot; mask=&quot;url(#IconifyId19bd4e7f5b9fcf4560)&quot;&gt;&lt;/path&gt;&lt;/svg&gt;
              &lt;h3 class=&quot;text-sm font-semibold leading-tight mb-2&quot;&gt;
                Editorial &amp;amp;
                &lt;br&gt;
                Commercial
              &lt;/h3&gt;
              &lt;div class=&quot;w-4 h-0.5 group-hover:w-8 transition-all bg-sky-500&quot;&gt;&lt;/div&gt;
            &lt;/div&gt;
            &lt;div class=&quot;group cursor-pointer&quot;&gt;
              &lt;svg xmlns=&quot;http://www.w3.org/2000/svg&quot; aria-hidden=&quot;true&quot; role=&quot;img&quot; width=&quot;1em&quot; height=&quot;1em&quot; viewBox=&quot;0 0 24 24&quot; data-icon=&quot;solar:gallery-wide-bold-duotone&quot; class=&quot;iconify text-4xl mb-4 group-hover:text-sky-600 transition-colors text-zinc-800 iconify--solar&quot;&gt;&lt;path fill=&quot;currentColor&quot; d=&quot;M18.512 10.077c0 .738-.625 1.337-1.396 1.337s-1.395-.599-1.395-1.337c0-.739.625-1.338 1.395-1.338s1.396.599 1.396 1.338&quot;&gt;&lt;/path&gt;&lt;path fill=&quot;currentColor&quot; fill-rule=&quot;evenodd&quot; d=&quot;M18.036 5.532c-1.06-.137-2.414-.137-4.123-.136h-3.826c-1.71 0-3.064 0-4.123.136c-1.09.14-1.974.437-2.67 1.104S2.29 8.149 2.142 9.195C2 10.21 2 11.508 2 13.147v.1c0 1.64 0 2.937.142 3.953c.147 1.046.456 1.892 1.152 2.559s1.58.963 2.67 1.104c1.06.136 2.414.136 4.123.136h3.826c1.71 0 3.064 0 4.123-.136c1.09-.14 1.974-.437 2.67-1.104s1.005-1.514 1.152-2.559C22 16.184 22 14.886 22 13.248v-.1c0-1.64 0-2.937-.142-3.953c-.147-1.046-.456-1.892-1.152-2.559s-1.58-.963-2.67-1.104M6.15 6.858c-.936.12-1.475.346-1.87.724c-.393.377-.629.894-.755 1.791c-.1.72-.123 1.619-.128 2.795l.47-.395c1.125-.942 2.819-.888 3.875.124l3.99 3.825a1.2 1.2 0 0 0 1.491.124l.278-.187a3.606 3.606 0 0 1 4.34.25l2.407 2.077c.098-.264.173-.579.227-.964c.128-.916.13-2.124.13-3.824s-.002-2.909-.13-3.825c-.126-.897-.362-1.414-.756-1.791c-.393-.378-.933-.604-1.869-.724c-.956-.124-2.216-.125-3.99-.125h-3.72c-1.774 0-3.034.001-3.99.125&quot; clip-rule=&quot;evenodd&quot;&gt;&lt;/path&gt;&lt;path fill=&quot;currentColor&quot; d=&quot;M17.087 2.61c-.86-.11-1.955-.11-3.32-.11h-3.09c-1.364 0-2.459 0-3.318.11c-.89.115-1.633.358-2.222.92a2.9 2.9 0 0 0-.724 1.12c.504-.23 1.074-.366 1.714-.45c1.085-.14 2.47-.14 4.22-.14h3.915c1.749 0 3.134 0 4.219.14c.559.073 1.064.186 1.52.366a2.9 2.9 0 0 0-.693-1.035c-.589-.563-1.331-.806-2.221-.92&quot; opacity=&quot;.5&quot;&gt;&lt;/path&gt;&lt;/svg&gt;
              &lt;h3 class=&quot;leading-tight text-sm font-semibold mb-2&quot;&gt;
                Fine Art
                &lt;br&gt;
                Prints
              &lt;/h3&gt;
              &lt;div class=&quot;w-4 h-0.5 group-hover:w-8 transition-all bg-sky-500&quot;&gt;&lt;/div&gt;
            &lt;/div&gt;
          &lt;/div&gt;

    &lt;div class=&quot;flex gap-12 mt-auto text-xs font-medium tracking-wide text-zinc-600&quot;&gt;
            &lt;a href=&quot;#&quot; class=&quot;flex items-center gap-2 transition-colors hover:text-black&quot;&gt;
              View Galleries
              &lt;svg xmlns=&quot;http://www.w3.org/2000/svg&quot; width=&quot;24&quot; height=&quot;24&quot; viewBox=&quot;0 0 24 24&quot; fill=&quot;none&quot; stroke=&quot;currentColor&quot; stroke-width=&quot;2&quot; stroke-linecap=&quot;round&quot; stroke-linejoin=&quot;round&quot; data-lucide=&quot;chevron-right&quot; class=&quot;lucide lucide-chevron-right w-3 h-3&quot;&gt;&lt;path d=&quot;m9 18 6-6-6-6&quot;&gt;&lt;/path&gt;&lt;/svg&gt;
            &lt;/a&gt;
            &lt;a href=&quot;#&quot; class=&quot;flex items-center gap-2 transition-colors hover:text-black&quot;&gt;
              Book Studio
              &lt;svg xmlns=&quot;http://www.w3.org/2000/svg&quot; width=&quot;24&quot; height=&quot;24&quot; viewBox=&quot;0 0 24 24&quot; fill=&quot;none&quot; stroke=&quot;currentColor&quot; stroke-width=&quot;2&quot; stroke-linecap=&quot;round&quot; stroke-linejoin=&quot;round&quot; data-lucide=&quot;chevron-right&quot; class=&quot;lucide lucide-chevron-right w-3 h-3&quot;&gt;&lt;path d=&quot;m9 18 6-6-6-6&quot;&gt;&lt;/path&gt;&lt;/svg&gt;
            &lt;/a&gt;
          &lt;/div&gt;
        &lt;/div&gt;

    &lt;!-- Center Visual (3D Carousel) --&gt;
        &lt;div class=&quot;col-span-1 md:col-span-2 flex md:py-0 pt-10 pb-10 relative items-center justify-center&quot;&gt;
  &lt;div class=&quot;aspect-[3/4] group overflow-hidden md:aspect-auto md:h-[600px] w-full relative&quot; id=&quot;hero-gallery-container&quot;&gt;

    &lt;!-- Slider Track --&gt;
    &lt;div class=&quot;flex transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform w-full h-full&quot; id=&quot;hero-gallery-track&quot;&gt;

    &lt;!-- Slide 1: Portrait --&gt;
      &lt;div class=&quot;flex-shrink-0 z-10 w-full h-full relative&quot;&gt;
        &lt;img src=&quot;https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/feb67f29-4bdc-4631-af01-58eb137bfb45_1600w.webp&quot; alt=&quot;Portrait&quot; class=&quot;w-full h-full object-cover grayscale contrast-125&quot;&gt;
        &lt;div class=&quot;bg-gradient-to-t via-transparent to-transparent z-10 absolute top-0 right-0 bottom-0 left-0 from-zinc-900/50&quot;&gt;&lt;/div&gt;
        &lt;div class=&quot;absolute bottom-0 left-0 p-8 transform transition-transform duration-500 group-hover:-translate-y-2&quot;&gt;
            &lt;div class=&quot;flex items-center gap-3 mb-2&quot;&gt;
                &lt;span class=&quot;px-2 py-0.5 rounded border text-[10px] font-mono uppercase backdrop-blur-md border-white/20 bg-white/10 text-white&quot;&gt;Portraiture&lt;/span&gt;
            &lt;/div&gt;
            &lt;h3 class=&quot;text-2xl font-semibold tracking-tight mb-1 text-white&quot;&gt;The Human Gaze&lt;/h3&gt;
            &lt;p class=&quot;text-sm line-clamp-1 text-white/70&quot;&gt;Raw emotion captured in monochrome.&lt;/p&gt;
        &lt;/div&gt;
      &lt;/div&gt;

    &lt;!-- Slide 2: Architecture --&gt;
      &lt;div class=&quot;w-full h-full flex-shrink-0 relative&quot;&gt;
        &lt;img src=&quot;https://images.unsplash.com/photo-1486718448742-163732cd1544?q=80&amp;amp;w=2574&amp;amp;auto=format&amp;amp;fit=crop&quot; alt=&quot;Architecture&quot; class=&quot;w-full h-full object-cover grayscale contrast-125&quot;&gt;
        &lt;div class=&quot;absolute inset-0 bg-gradient-to-t via-transparent to-transparent from-zinc-900/50&quot;&gt;&lt;/div&gt;
        &lt;div class=&quot;absolute bottom-0 left-0 p-8 transform transition-transform duration-500 group-hover:-translate-y-2&quot;&gt;
            &lt;div class=&quot;flex items-center gap-3 mb-2&quot;&gt;
                &lt;span class=&quot;px-2 py-0.5 rounded border border-white/20 bg-white/10 text-[10px] font-mono uppercase backdrop-blur-md text-white&quot;&gt;Form&lt;/span&gt;
            &lt;/div&gt;
            &lt;h3 class=&quot;text-2xl font-semibold tracking-tight mb-1 text-white&quot;&gt;Concrete Dreams&lt;/h3&gt;
            &lt;p class=&quot;text-sm line-clamp-1 text-white/70&quot;&gt;Brutalist structures and urban geometry.&lt;/p&gt;
        &lt;/div&gt;
      &lt;/div&gt;

    &lt;!-- Slide 3: Nature --&gt;
      &lt;div class=&quot;w-full h-full flex-shrink-0 relative&quot;&gt;
        &lt;img src=&quot;https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&amp;amp;w=2670&amp;amp;auto=format&amp;amp;fit=crop&quot; alt=&quot;Landscape&quot; class=&quot;w-full h-full object-cover grayscale contrast-125&quot;&gt;
        &lt;div class=&quot;absolute inset-0 bg-gradient-to-t via-transparent to-transparent from-zinc-900/50&quot;&gt;&lt;/div&gt;
        &lt;div class=&quot;absolute bottom-0 left-0 p-8 transform transition-transform duration-500 group-hover:-translate-y-2&quot;&gt;
            &lt;div class=&quot;flex items-center gap-3 mb-2&quot;&gt;
                &lt;span class=&quot;px-2 py-0.5 rounded border border-white/20 bg-white/10 text-[10px] font-mono uppercase backdrop-blur-md text-white&quot;&gt;Landscape&lt;/span&gt;
            &lt;/div&gt;
            &lt;h3 class=&quot;text-2xl font-semibold tracking-tight mb-1 text-white&quot;&gt;Silent Peaks&lt;/h3&gt;
            &lt;p class=&quot;text-sm line-clamp-1 text-white/70&quot;&gt;The grandeur of untouched horizons.&lt;/p&gt;
        &lt;/div&gt;
      &lt;/div&gt;

    &lt;/div&gt;

    &lt;!-- Navigation Overlay --&gt;
    &lt;div class=&quot;flex gap-3 z-20 absolute right-8 bottom-8 items-center&quot;&gt;
        &lt;!-- Pagination Indicator --&gt;
        &lt;div class=&quot;px-3 py-1.5 rounded-full backdrop-blur-xl border text-xs font-mono mr-2 shadow-lg bg-black/80 border-white/10 text-white&quot;&gt;
            &lt;span id=&quot;hero-gallery-indicator&quot;&gt;01&lt;/span&gt;&lt;span class=&quot;mx-1 text-white/30&quot;&gt;/&lt;/span&gt;03
        &lt;/div&gt;

    &lt;!-- Controls --&gt;
        &lt;div class=&quot;flex gap-2&quot;&gt;
            &lt;button id=&quot;hero-gallery-prev&quot; class=&quot;w-10 h-10 rounded-full border backdrop-blur-xl flex items-center justify-center transition-all duration-300 group/btn shadow-lg border-white/10 bg-black/50 text-white hover:bg-white hover:text-black&quot;&gt;
                &lt;svg xmlns=&quot;http://www.w3.org/2000/svg&quot; width=&quot;18&quot; height=&quot;18&quot; viewBox=&quot;0 0 24 24&quot; fill=&quot;none&quot; stroke=&quot;currentColor&quot; stroke-width=&quot;1.5&quot; stroke-linecap=&quot;round&quot; stroke-linejoin=&quot;round&quot; class=&quot;lucide lucide-arrow-left group-hover/btn:-translate-x-0.5 transition-transform&quot;&gt;&lt;path d=&quot;m12 19-7-7 7-7&quot;&gt;&lt;/path&gt;&lt;path d=&quot;M19 12H5&quot;&gt;&lt;/path&gt;&lt;/svg&gt;
            &lt;/button&gt;
            &lt;button id=&quot;hero-gallery-next&quot; class=&quot;w-10 h-10 rounded-full border backdrop-blur-xl flex items-center justify-center transition-all duration-300 group/btn shadow-lg border-white/10 bg-black/50 text-white hover:bg-white hover:text-black&quot;&gt;
                &lt;svg xmlns=&quot;http://www.w3.org/2000/svg&quot; width=&quot;18&quot; height=&quot;18&quot; viewBox=&quot;0 0 24 24&quot; fill=&quot;none&quot; stroke=&quot;currentColor&quot; stroke-width=&quot;1.5&quot; stroke-linecap=&quot;round&quot; stroke-linejoin=&quot;round&quot; class=&quot;lucide lucide-arrow-right group-hover/btn:translate-x-0.5 transition-transform&quot;&gt;&lt;path d=&quot;M5 12h14&quot;&gt;&lt;/path&gt;&lt;path d=&quot;m12 5 7 7-7 7&quot;&gt;&lt;/path&gt;&lt;/svg&gt;
            &lt;/button&gt;
        &lt;/div&gt;
    &lt;/div&gt;

    &lt;!-- Interactive Script --&gt;
    &lt;script&gt;
      (function() {
        const container = document.getElementById('hero-gallery-container');
        const track = document.getElementById('hero-gallery-track');
        const prevBtn = document.getElementById('hero-gallery-prev');
        const nextBtn = document.getElementById('hero-gallery-next');
        const indicator = document.getElementById('hero-gallery-indicator');
        let index = 0;
        const total = 3;

    function updateSlider() {
            track.style.transform =`translateX(-${index * 100}%)`;
            indicator.textContent = String(index + 1).padStart(2, '0');
        }

    prevBtn.addEventListener('click', (e) =&gt; {
            e.preventDefault(); e.stopPropagation();
            index = (index - 1 + total) % total;
            updateSlider();
        });

    nextBtn.addEventListener('click', (e) =&gt; {
            e.preventDefault(); e.stopPropagation();
            index = (index + 1) % total;
            updateSlider();
        });
      })();
    &lt;/script&gt;
  &lt;/div&gt;
&lt;/div&gt;

    &lt;!-- Right Col --&gt;
        &lt;div class=&quot;col-span-1 flex flex-col md:items-end z-20 md:pt-0 h-full pt-8 relative items-start pl-6 md:pl-0&quot;&gt;
          &lt;p class=&quot;text-[10px] uppercase font-semibold text-zinc-400 tracking-widest mb-1&quot;&gt;
            Projects Archived:
          &lt;/p&gt;
          &lt;span class=&quot;text-6xl md:text-8xl font-bold tracking-tighter text-zinc-900&quot;&gt;
            214
          &lt;/span&gt;
        &lt;/div&gt;
      &lt;/section&gt;

    &lt;!-- Exploration Section --&gt;
      &lt;section class=&quot;grid grid-cols-1 md:grid-cols-2 border-b border-black/10&quot;&gt;
        &lt;!-- Left: Gallery --&gt;
        &lt;div class=&quot;md:p-12 overflow-hidden group border-black/10 border-r pt-6 pr-6 pb-6 pl-6 relative&quot; id=&quot;gallery-container&quot;&gt;
          &lt;div class=&quot;grid grid-cols-2 gap-4 h-full&quot;&gt;
            &lt;div class=&quot;bg-zinc-200 w-full h-64 md:h-80 relative overflow-hidden&quot;&gt;
              &lt;img id=&quot;gallery-img-1&quot; src=&quot;https://images.unsplash.com/photo-1531747056595-07f6cbbe10ad?q=80&amp;amp;w=2670&amp;amp;auto=format&amp;amp;fit=crop&quot; class=&quot;w-full h-full object-cover grayscale opacity-90 group-hover:scale-105 transition-transform duration-700&quot;&gt;
            &lt;/div&gt;
            &lt;div class=&quot;w-full h-64 md:h-80 relative overflow-hidden translate-y-8 bg-zinc-200&quot;&gt;
              &lt;img id=&quot;gallery-img-2&quot; src=&quot;https://cdn.midjourney.com/deedb816-1e56-4b14-984f-328fb04010c1/0_0.png&quot; class=&quot;w-full h-full object-cover grayscale opacity-90 group-hover:scale-105 transition-transform duration-700 delay-75&quot;&gt;
            &lt;/div&gt;
          &lt;/div&gt;
        &lt;/div&gt;

    &lt;!-- Right: Text Content --&gt;
        &lt;div class=&quot;md:p-12 flex flex-col pt-6 pr-6 pb-6 pl-6 justify-center&quot;&gt;
          &lt;h2 id=&quot;project-title&quot; class=&quot;text-7xl md:text-9xl font-semibold tracking-tighter mb-4 text-zinc-900&quot;&gt;Portrait&lt;/h2&gt;
          &lt;h3 id=&quot;project-subtitle&quot; class=&quot;text-xl md:text-2xl font-semibold mb-4 text-zinc-600&quot;&gt;Faces of Kyoto&lt;/h3&gt;
          &lt;p class=&quot;leading-relaxed md:text-base text-sm text-zinc-500 max-w-md mb-10&quot; id=&quot;project-description&quot;&gt;Intimate portraits captured on medium format film, exploring tradition and modernity in Japan's ancient capital.&lt;/p&gt;

    &lt;div class=&quot;flex items-center justify-between mt-auto pt-8 border-t border-black/10&quot;&gt;
            &lt;div class=&quot;flex items-center gap-4&quot;&gt;
              &lt;span class=&quot;text-3xl font-semibold font-mono&quot;&gt;
                &lt;span id=&quot;current-slide&quot; class=&quot;&quot;&gt;02&lt;/span&gt;
                &lt;span class=&quot;text-base align-top ml-1 text-black/30&quot;&gt;/ &lt;span id=&quot;total-slides&quot; class=&quot;&quot;&gt;04&lt;/span&gt;&lt;/span&gt;
              &lt;/span&gt;
              &lt;div class=&quot;flex gap-2 ml-4 gap-x-2 gap-y-2&quot;&gt;
  &lt;button id=&quot;prev-btn&quot; class=&quot;flex transition hover:bg-black hover:text-white w-8 h-8 border-black/20 border rounded-full items-center justify-center text-black&quot;&gt;
    &lt;svg xmlns=&quot;http://www.w3.org/2000/svg&quot; width=&quot;16&quot; height=&quot;16&quot; viewBox=&quot;0 0 24 24&quot; fill=&quot;none&quot; stroke=&quot;currentColor&quot; stroke-width=&quot;2&quot; stroke-linecap=&quot;round&quot; stroke-linejoin=&quot;round&quot; class=&quot;lucide lucide-chevron-left w-4 h-4&quot;&gt;&lt;path d=&quot;m15 18-6-6 6-6&quot;&gt;&lt;/path&gt;&lt;/svg&gt;
  &lt;/button&gt;
  &lt;button id=&quot;next-btn&quot; class=&quot;flex transition hover:bg-black hover:text-white w-8 h-8 border-black/20 border rounded-full items-center justify-center text-black&quot;&gt;
    &lt;svg xmlns=&quot;http://www.w3.org/2000/svg&quot; width=&quot;16&quot; height=&quot;16&quot; viewBox=&quot;0 0 24 24&quot; fill=&quot;none&quot; stroke=&quot;currentColor&quot; stroke-width=&quot;2&quot; stroke-linecap=&quot;round&quot; stroke-linejoin=&quot;round&quot; class=&quot;lucide lucide-chevron-right w-4 h-4&quot;&gt;&lt;path d=&quot;m9 18 6-6-6-6&quot;&gt;&lt;/path&gt;&lt;/svg&gt;
  &lt;/button&gt;
&lt;/div&gt;
            &lt;/div&gt;

    &lt;a href=&quot;#&quot; class=&quot;px-6 py-3 border text-sm font-medium transition-colors flex items-center gap-2 border-black/20 hover:bg-black hover:text-white&quot;&gt;
              All Projects
              &lt;svg xmlns=&quot;http://www.w3.org/2000/svg&quot; aria-hidden=&quot;true&quot; role=&quot;img&quot; width=&quot;1em&quot; height=&quot;1em&quot; viewBox=&quot;0 0 24 24&quot; data-icon=&quot;solar:arrow-right-linear&quot; class=&quot;iconify iconify--solar&quot;&gt;&lt;path fill=&quot;none&quot; stroke=&quot;currentColor&quot; stroke-linecap=&quot;round&quot; stroke-linejoin=&quot;round&quot; stroke-width=&quot;1.5&quot; d=&quot;M4 12h16m0 0l-6-6m6 6l-6 6&quot;&gt;&lt;/path&gt;&lt;/svg&gt;
            &lt;/a&gt;
          &lt;/div&gt;
        &lt;/div&gt;

    &lt;script&gt;
          (function() {
            const projects = [
              {
                title: &quot;Series&quot;,
                subtitle: &quot;Urban Isolation&quot;,
                description: &quot;A photographic study of solitude within the dense fabric of the modern metropolis. Capturing moments of silence amidst the noise.&quot;,
                img1: &quot;https://cdn.midjourney.com/4a2fba13-1f73-4826-a8e4-614f757c5cbf/0_1.png&quot;,
                img2: &quot;https://cdn.midjourney.com/dbe40a1a-ded3-4843-ba59-cf3357ed870b/0_0.png&quot;
              },
              {
                title: &quot;Portrait&quot;,
                subtitle: &quot;Faces of Kyoto&quot;,
                description: &quot;Intimate portraits captured on medium format film, exploring tradition and modernity in Japan's ancient capital.&quot;,
                img1: &quot;https://images.unsplash.com/photo-1531747056595-07f6cbbe10ad?q=80&amp;w=2670&amp;auto=format&amp;fit=crop&quot;,
                img2: &quot;https://cdn.midjourney.com/deedb816-1e56-4b14-984f-328fb04010c1/0_0.png&quot;
              },
              {
                title: &quot;Light&quot;,
                subtitle: &quot;Prism Studies&quot;,
                description: &quot;Experimental abstract photography using refracted light and glass to create ethereal, painterly compositions.&quot;,
                img1: &quot;https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&amp;w=2670&amp;auto=format&amp;fit=crop&quot;,
                img2: &quot;https://images.unsplash.com/photo-1497290756760-23ac55edf36f?q=80&amp;w=2574&amp;auto=format&amp;fit=crop&quot;
              },
              {
                title: &quot;Wild&quot;,
                subtitle: &quot;Nordic Silence&quot;,
                description: &quot;Minimalist landscapes from the Arctic Circle. A journey through ice, fog, and the absence of color.&quot;,
                img1: &quot;https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&amp;w=2670&amp;auto=format&amp;fit=crop&quot;,
                img2: &quot;https://cdn.midjourney.com/fca07dc0-250c-434d-b91c-9f99e50b62db/0_0.png&quot;
              }
            ];

    let currentIndex = 0;
            const totalSlides = projects.length;

    function updateSlide() {
              const project = projects[currentIndex];
              document.getElementById('project-title').textContent = project.title;
              document.getElementById('project-subtitle').textContent = project.subtitle;
              document.getElementById('project-description').textContent = project.description;
              document.getElementById('gallery-img-1').src = project.img1;
              document.getElementById('gallery-img-2').src = project.img2;
              document.getElementById('current-slide').textContent = String(currentIndex + 1).padStart(2, '0');
              document.getElementById('total-slides').textContent = String(totalSlides).padStart(2, '0');
            }

    document.getElementById('next-btn').addEventListener('click', function() {
              currentIndex = (currentIndex + 1) % totalSlides;
              updateSlide();
            });

    document.getElementById('prev-btn').addEventListener('click', function() {
              currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
              updateSlide();
            });
          })();&lt;/script&gt;
      &lt;/section&gt;

    &lt;!-- Featured Case Study --&gt;
      &lt;section class=&quot;relative border-b border-black/10&quot;&gt;
        &lt;!-- Tabs --&gt;
        &lt;div class=&quot;absolute top-0 left-0 md:left-1/4 flex z-20&quot;&gt;
          &lt;button class=&quot;text-sm font-semibold border-r pt-3 pr-8 pb-3 pl-8 backdrop-blur-sm bg-white/50 border-black/10 text-zinc-900&quot;&gt;
            The Darkroom
          &lt;/button&gt;
          &lt;button class=&quot;transition-colors text-sm font-semibold pt-3 pr-8 pb-3 pl-8 hover:text-black text-black/50&quot;&gt;
            Studio A
          &lt;/button&gt;
        &lt;/div&gt;

    &lt;div class=&quot;grid grid-cols-1 md:grid-cols-2&quot;&gt;
          &lt;!-- Left Content --&gt;
          &lt;div class=&quot;md:p-12 md:pt-32 flex flex-col border-black/10 border-r pt-24 pr-6 pb-6 pl-6 relative justify-center&quot;&gt;
            &lt;h2 class=&quot;md:text-7xl uppercase text-5xl font-bold tracking-tighter mb-8 text-zinc-900&quot;&gt;
              Process
            &lt;/h2&gt;

    &lt;div class=&quot;mb-12&quot;&gt;
              &lt;h4 class=&quot;text-xl font-semibold mb-2&quot;&gt;Analog Workflow&lt;/h4&gt;
              &lt;h5 class=&quot;text-lg text-black/70 mb-6&quot;&gt;Silver Gelatin Print&lt;/h5&gt;
              &lt;p class=&quot;leading-relaxed text-sm text-zinc-500 max-w-sm&quot;&gt;
                Every print is hand-developed in our private darkroom. We believe in the tactile relationship between the artist and the medium, preserving the chemical magic of photography.
              &lt;/p&gt;
            &lt;/div&gt;

    &lt;div class=&quot;grid grid-cols-3 gap-8 pt-8 border-t border-black/10&quot;&gt;
              &lt;div class=&quot;&quot;&gt;
                &lt;p class=&quot;text-[10px] font-bold uppercase mb-1 text-sky-600&quot;&gt;
                  Format
                &lt;/p&gt;
                &lt;p class=&quot;text-2xl font-bold font-mono&quot;&gt;120mm&lt;/p&gt;
              &lt;/div&gt;
              &lt;div class=&quot;&quot;&gt;
                &lt;p class=&quot;text-[10px] font-bold uppercase mb-1 text-sky-600&quot;&gt;
                  Paper
                &lt;/p&gt;
                &lt;p class=&quot;text-2xl font-bold font-mono&quot;&gt;Fiber&lt;/p&gt;
              &lt;/div&gt;
              &lt;div class=&quot;&quot;&gt;
                &lt;p class=&quot;text-[10px] font-bold uppercase mb-1 text-sky-600&quot;&gt;
                  Editions
                &lt;/p&gt;
                &lt;p class=&quot;text-2xl font-bold font-mono&quot;&gt;1/10&lt;/p&gt;
              &lt;/div&gt;
            &lt;/div&gt;
          &lt;/div&gt;

    &lt;!-- Right Image --&gt;
          &lt;div class=&quot;relative h-[500px] md:h-auto overflow-hidden&quot;&gt;
            &lt;img src=&quot;https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/b64a0436-0ae9-40c8-9036-da022ed50341_1600w.webp&quot; class=&quot;absolute inset-0 w-full h-full object-cover grayscale contrast-125&quot; style=&quot;transition: outline 0.1s ease-in-out;&quot;&gt;
            &lt;div class=&quot;absolute inset-0 bg-gradient-to-t to-transparent from-zinc-50/20&quot;&gt;&lt;/div&gt;
          &lt;/div&gt;
        &lt;/div&gt;
      &lt;/section&gt;

    &lt;!-- Methodology Section --&gt;
      &lt;section class=&quot;grid grid-cols-1 lg:grid-cols-2 border-b relative group border-black/10 bg-zinc-50&quot;&gt;
  &lt;!-- Left: Visual Content --&gt;
  &lt;div class=&quot;relative min-h-[500px] lg:min-h-[700px] border-r overflow-hidden border-black/10&quot;&gt;
    &lt;img src=&quot;https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&amp;amp;w=2564&amp;amp;auto=format&amp;amp;fit=crop&quot; alt=&quot;Camera Lens&quot; class=&quot;absolute inset-0 w-full h-full object-cover grayscale opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-1000 ease-out&quot;&gt;
    &lt;div class=&quot;absolute inset-0 bg-gradient-to-t to-transparent from-zinc-50 via-zinc-50/20&quot;&gt;&lt;/div&gt;

    &lt;!-- Floating Data Card --&gt;
    &lt;div class=&quot;absolute bottom-8 left-8 right-8 md:left-12 md:right-auto md:w-80 backdrop-blur-xl border p-6 z-10 transition-colors duration-300 bg-white/80 border-black/10 hover:bg-white&quot;&gt;
      &lt;div class=&quot;flex items-center justify-between mb-4 pb-4 border-b border-black/10&quot;&gt;
        &lt;span class=&quot;text-[10px] font-bold uppercase tracking-widest text-sky-600&quot;&gt;Current Gear&lt;/span&gt;
        &lt;svg xmlns=&quot;http://www.w3.org/2000/svg&quot; aria-hidden=&quot;true&quot; role=&quot;img&quot; width=&quot;1em&quot; height=&quot;1em&quot; viewBox=&quot;0 0 24 24&quot; data-icon=&quot;solar:camera-square-bold&quot; style=&quot;font-size: 16px;&quot; class=&quot;iconify text-zinc-500 iconify--solar&quot;&gt;&lt;path fill=&quot;currentColor&quot; fill-rule=&quot;evenodd&quot; d=&quot;M3.464 3.464C2 4.93 2 7.286 2 12s0 7.071 1.464 8.535C4.93 22 7.286 22 12 22s7.071 0 8.535-1.465C22 19.072 22 16.714 22 12s0-7.071-1.465-8.536C19.072 2 16.714 2 12 2S4.929 2 3.464 3.464M7.25 12a4.75 4.75 0 1 1 9.5 0a4.75 4.75 0 0 1-9.5 0m1.5 0a3.25 3.25 0 1 1 6.5 0a3.25 3.25 0 0 1-6.5 0&quot; clip-rule=&quot;evenodd&quot;&gt;&lt;/path&gt;&lt;/svg&gt;
      &lt;/div&gt;
      &lt;div class=&quot;space-y-1&quot;&gt;
        &lt;p class=&quot;text-xs uppercase tracking-wider font-semibold text-black/50&quot;&gt;Body: Leica M11&lt;/p&gt;
        &lt;p class=&quot;text-lg font-medium tracking-tight&quot;&gt;Summilux 35mm f/1.4&lt;/p&gt;
      &lt;/div&gt;
    &lt;/div&gt;
  &lt;/div&gt;

  &lt;!-- Right: Philosophy &amp; Interactive List --&gt;
  &lt;div class=&quot;flex flex-col&quot;&gt;
    &lt;!-- Header --&gt;
    &lt;div class=&quot;p-8 md:p-16 flex-1 flex flex-col justify-center relative&quot;&gt;
      &lt;div class=&quot;absolute top-0 right-0 p-6 opacity-5&quot;&gt;
         &lt;span class=&quot;iconify w-[120px] h-[120px]&quot; data-icon=&quot;solar:aperture-bold-duotone&quot;&gt;&lt;/span&gt;
      &lt;/div&gt;

    &lt;p class=&quot;text-[10px] uppercase flex items-center gap-3 font-bold text-sky-600 tracking-[0.2em] mb-6&quot;&gt;
        &lt;span class=&quot;w-2 h-2 rounded-full bg-sky-600&quot;&gt;&lt;/span&gt;
        Vision
      &lt;/p&gt;
      &lt;h2 class=&quot;text-4xl md:text-6xl font-semibold tracking-tighter leading-none mb-6 text-zinc-900&quot;&gt;
        Frame, Focus &amp;amp;
        &lt;span class=&quot;text-black/30&quot;&gt;Feel&lt;/span&gt;
      &lt;/h2&gt;
      &lt;p class=&quot;leading-relaxed md:text-base text-sm text-zinc-500 max-w-md&quot;&gt;
        Photography is not just about capturing reality, but interpreting it. We strip away the color to reveal the essential structure of light, texture, and emotion.
      &lt;/p&gt;
    &lt;/div&gt;

    &lt;!-- Accordion / List Items --&gt;
    &lt;div class=&quot;border-t divide-y border-black/10 divide-black/10 bg-white&quot;&gt;

    &lt;!-- Item 1 --&gt;
      &lt;a href=&quot;#&quot; class=&quot;group block md:px-12 md:py-8 transition-colors duration-300 hover:bg-black/5 pt-6 pr-6 pb-6 pl-6&quot;&gt;
        &lt;div class=&quot;flex items-center justify-between&quot;&gt;
          &lt;div class=&quot;flex items-center gap-6&quot;&gt;
            &lt;span class=&quot;font-mono text-xs transition-colors text-sky-600/50 group-hover:text-sky-600&quot;&gt;01&lt;/span&gt;
            &lt;div class=&quot;flex flex-col&quot;&gt;
              &lt;h3 class=&quot;group-hover:text-black transition-colors text-lg font-medium text-black/80 tracking-tight&quot;&gt;Pre-Visualization&lt;/h3&gt;
              &lt;span class=&quot;text-xs mt-1 opacity-0 h-0 group-hover:opacity-100 group-hover:h-auto transition-all duration-300 overflow-hidden transform translate-y-2 group-hover:translate-y-0 text-black/40&quot;&gt;Scouting locations and understanding light&lt;/span&gt;
            &lt;/div&gt;
          &lt;/div&gt;
          &lt;div class=&quot;w-8 h-8 rounded-full border flex items-center justify-center transition-all border-black/10 group-hover:border-sky-600/50 group-hover:bg-sky-600/10&quot;&gt;
            &lt;svg xmlns=&quot;http://www.w3.org/2000/svg&quot; width=&quot;16&quot; height=&quot;16&quot; viewBox=&quot;0 0 24 24&quot; fill=&quot;none&quot; stroke=&quot;currentColor&quot; stroke-width=&quot;1.5&quot; stroke-linecap=&quot;round&quot; stroke-linejoin=&quot;round&quot; class=&quot;lucide lucide-arrow-up-right text-black/50 group-hover:text-sky-600&quot;&gt;&lt;path d=&quot;M7 7h10v10&quot;&gt;&lt;/path&gt;&lt;path d=&quot;M7 17 17 7&quot;&gt;&lt;/path&gt;&lt;/svg&gt;
          &lt;/div&gt;
        &lt;/div&gt;
      &lt;/a&gt;

    &lt;!-- Item 2 --&gt;
      &lt;a href=&quot;#&quot; class=&quot;group block p-6 md:px-12 md:py-8 transition-colors duration-300 hover:bg-black/5&quot;&gt;
        &lt;div class=&quot;flex items-center justify-between&quot;&gt;
          &lt;div class=&quot;flex items-center gap-6&quot;&gt;
            &lt;span class=&quot;font-mono text-xs transition-colors text-sky-600/50 group-hover:text-sky-600&quot;&gt;02&lt;/span&gt;
            &lt;div class=&quot;flex flex-col&quot;&gt;
              &lt;h3 class=&quot;group-hover:text-black transition-colors text-lg font-medium text-black/80 tracking-tight&quot;&gt;The Capture&lt;/h3&gt;
              &lt;span class=&quot;group-hover:opacity-100 group-hover:h-auto transition-all duration-300 overflow-hidden transform group-hover:translate-y-0 text-xs text-black/40 opacity-0 h-0 mt-1 translate-y-2&quot;&gt;Manual exposure and composition&lt;/span&gt;
            &lt;/div&gt;
          &lt;/div&gt;
          &lt;div class=&quot;w-8 h-8 rounded-full border flex items-center justify-center transition-all border-black/10 group-hover:border-sky-600/50 group-hover:bg-sky-600/10&quot;&gt;
            &lt;svg xmlns=&quot;http://www.w3.org/2000/svg&quot; width=&quot;16&quot; height=&quot;16&quot; viewBox=&quot;0 0 24 24&quot; fill=&quot;none&quot; stroke=&quot;currentColor&quot; stroke-width=&quot;1.5&quot; stroke-linecap=&quot;round&quot; stroke-linejoin=&quot;round&quot; class=&quot;lucide lucide-arrow-up-right text-black/50 group-hover:text-sky-600&quot;&gt;&lt;path d=&quot;M7 7h10v10&quot;&gt;&lt;/path&gt;&lt;path d=&quot;M7 17 17 7&quot;&gt;&lt;/path&gt;&lt;/svg&gt;
          &lt;/div&gt;
        &lt;/div&gt;
      &lt;/a&gt;

    &lt;!-- Item 3 --&gt;
      &lt;a href=&quot;#&quot; class=&quot;group block p-6 md:px-12 md:py-8 transition-colors duration-300 hover:bg-black/5&quot;&gt;
        &lt;div class=&quot;flex items-center justify-between&quot;&gt;
          &lt;div class=&quot;flex items-center gap-6&quot;&gt;
            &lt;span class=&quot;font-mono text-xs transition-colors text-sky-600/50 group-hover:text-sky-600&quot;&gt;03&lt;/span&gt;
            &lt;div class=&quot;flex flex-col&quot;&gt;
              &lt;h3 class=&quot;text-lg font-medium tracking-tight group-hover:text-black transition-colors text-black/80&quot;&gt;Post-Production&lt;/h3&gt;
              &lt;span class=&quot;text-xs mt-1 opacity-0 h-0 group-hover:opacity-100 group-hover:h-auto transition-all duration-300 overflow-hidden transform translate-y-2 group-hover:translate-y-0 text-black/40&quot;&gt;Grading, dodging, and burning&lt;/span&gt;
            &lt;/div&gt;
          &lt;/div&gt;
          &lt;div class=&quot;w-8 h-8 rounded-full border flex items-center justify-center transition-all border-black/10 group-hover:border-sky-600/50 group-hover:bg-sky-600/10&quot;&gt;
            &lt;svg xmlns=&quot;http://www.w3.org/2000/svg&quot; width=&quot;16&quot; height=&quot;16&quot; viewBox=&quot;0 0 24 24&quot; fill=&quot;none&quot; stroke=&quot;currentColor&quot; stroke-width=&quot;1.5&quot; stroke-linecap=&quot;round&quot; stroke-linejoin=&quot;round&quot; class=&quot;lucide lucide-arrow-up-right text-black/50 group-hover:text-sky-600&quot;&gt;&lt;path d=&quot;M7 7h10v10&quot;&gt;&lt;/path&gt;&lt;path d=&quot;M7 17 17 7&quot;&gt;&lt;/path&gt;&lt;/svg&gt;
          &lt;/div&gt;
        &lt;/div&gt;
      &lt;/a&gt;

    &lt;/div&gt;
  &lt;/div&gt;
&lt;/section&gt;

    &lt;!-- Awards Section --&gt;
      &lt;section class=&quot;border-b border-black/10&quot;&gt;
        &lt;div class=&quot;px-6 md:px-12 py-16 flex items-end justify-between border-b border-black/10&quot;&gt;
          &lt;h2 class=&quot;text-6xl md:text-7xl font-bold tracking-tighter uppercase text-zinc-900&quot;&gt;
            Recognition
          &lt;/h2&gt;
          &lt;a href=&quot;#&quot; class=&quot;px-6 py-3 border text-sm font-medium transition-colors flex items-center gap-2 mb-2 border-black/20 hover:bg-black hover:text-white&quot;&gt;
            Press Kit
            &lt;svg xmlns=&quot;http://www.w3.org/2000/svg&quot; aria-hidden=&quot;true&quot; role=&quot;img&quot; width=&quot;1em&quot; height=&quot;1em&quot; viewBox=&quot;0 0 24 24&quot; data-icon=&quot;solar:arrow-right-linear&quot; class=&quot;iconify iconify--solar&quot;&gt;&lt;path fill=&quot;none&quot; stroke=&quot;currentColor&quot; stroke-linecap=&quot;round&quot; stroke-linejoin=&quot;round&quot; stroke-width=&quot;1.5&quot; d=&quot;M4 12h16m0 0l-6-6m6 6l-6 6&quot;&gt;&lt;/path&gt;&lt;/svg&gt;
          &lt;/a&gt;
        &lt;/div&gt;

    &lt;div class=&quot;grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-black/10&quot;&gt;
          &lt;!-- Award 1 --&gt;
          &lt;div class=&quot;group transition-colors cursor-pointer hover:bg-black/5 pt-8 pr-8 pb-8 pl-8&quot;&gt;
            &lt;div class=&quot;flex h-40 border-b mb-6 items-center justify-center border-black/10&quot;&gt;
              &lt;svg xmlns=&quot;http://www.w3.org/2000/svg&quot; aria-hidden=&quot;true&quot; role=&quot;img&quot; width=&quot;1em&quot; height=&quot;1em&quot; viewBox=&quot;0 0 24 24&quot; data-icon=&quot;solar:cup-star-bold-duotone&quot; class=&quot;iconify text-6xl group-hover:scale-110 transition-transform duration-300 text-zinc-800 iconify--solar&quot;&gt;&lt;path fill=&quot;currentColor&quot; d=&quot;M12 16c-5.76 0-6.78-5.74-6.96-10.294c-.05-1.266-.076-1.9.4-2.485c.476-.586 1.045-.682 2.184-.874A26.4 26.4 0 0 1 12 2c1.783 0 3.253.157 4.377.347c1.138.192 1.708.288 2.183.874c.476.586.451 1.219.4 2.485C18.78 10.259 17.76 16 12 16&quot; opacity=&quot;.5&quot;&gt;&lt;/path&gt;&lt;path fill=&quot;currentColor&quot; d=&quot;m17.64 12.422l2.817-1.565c.752-.418 1.128-.627 1.336-.979C22 9.526 22 9.096 22 8.235v-.073c0-1.043 0-1.565-.283-1.958s-.778-.558-1.768-.888L19 5l-.017.085q-.008.283-.022.621c-.088 2.225-.377 4.733-1.32 6.716M5.04 5.706c.087 2.225.376 4.733 1.32 6.716l-2.817-1.565c-.752-.418-1.129-.627-1.336-.979S2 9.096 2 8.235v-.073c0-1.043 0-1.565.283-1.958s.778-.558 1.768-.888L5 5l.017.087q.008.281.022.62&quot;&gt;&lt;/path&gt;&lt;path fill=&quot;currentColor&quot; fill-rule=&quot;evenodd&quot; d=&quot;M5.25 22a.75.75 0 0 1 .75-.75h12a.75.75 0 0 1 0 1.5H6a.75.75 0 0 1-.75-.75&quot; clip-rule=&quot;evenodd&quot;&gt;&lt;/path&gt;&lt;path fill=&quot;currentColor&quot; d=&quot;M15.458 21.25H8.543l.297-1.75a1 1 0 0 1 .98-.804h4.36a1 1 0 0 1 .981.804z&quot; opacity=&quot;.5&quot;&gt;&lt;/path&gt;&lt;path fill=&quot;currentColor&quot; d=&quot;M12 16q-.39 0-.75-.034v2.73h1.5v-2.73A8 8 0 0 1 12 16m-.854-9.977C11.526 5.34 11.716 5 12 5s.474.34.854 1.023l.098.176c.108.194.162.29.246.354c.085.064.19.088.4.135l.19.044c.738.167 1.107.25 1.195.532s-.164.577-.667 1.165l-.13.152c-.143.167-.215.25-.247.354s-.021.215 0 .438l.02.203c.076.785.114 1.178-.115 1.352c-.23.174-.576.015-1.267-.303l-.178-.082c-.197-.09-.295-.135-.399-.135s-.202.045-.399.135l-.178.082c-.691.319-1.037.477-1.267.303s-.191-.567-.115-1.352l.02-.203c.021-.223.032-.334 0-.438s-.104-.187-.247-.354l-.13-.152c-.503-.588-.755-.882-.667-1.165c.088-.282.457-.365 1.195-.532l.19-.044c.21-.047.315-.07.4-.135c.084-.064.138-.16.246-.354z&quot;&gt;&lt;/path&gt;&lt;/svg&gt;
            &lt;/div&gt;
            &lt;p class=&quot;text-[10px] font-bold uppercase mb-2 text-sky-600&quot;&gt;
              Sony World
            &lt;/p&gt;
            &lt;h3 class=&quot;leading-tight transition-colors text-xl font-semibold mb-6 text-zinc-900&quot;&gt;
              Photographer of the Year 2023
            &lt;/h3&gt;
            &lt;div class=&quot;flex items-center text-xs font-medium group-hover:text-black transition-colors text-black/50&quot;&gt;
              View Gallery
              &lt;svg xmlns=&quot;http://www.w3.org/2000/svg&quot; width=&quot;24&quot; height=&quot;24&quot; viewBox=&quot;0 0 24 24&quot; fill=&quot;none&quot; stroke=&quot;currentColor&quot; stroke-width=&quot;2&quot; stroke-linecap=&quot;round&quot; stroke-linejoin=&quot;round&quot; data-lucide=&quot;chevron-right&quot; class=&quot;lucide lucide-chevron-right w-3 h-3 ml-1&quot;&gt;&lt;path d=&quot;m9 18 6-6-6-6&quot;&gt;&lt;/path&gt;&lt;/svg&gt;
            &lt;/div&gt;
          &lt;/div&gt;

    &lt;!-- Award 2 --&gt;
          &lt;div class=&quot;group transition-colors cursor-pointer hover:bg-black/5 pt-8 pr-8 pb-8 pl-8&quot;&gt;
            &lt;div class=&quot;h-40 flex items-center justify-center border-b mb-6 border-black/10&quot;&gt;
              &lt;svg xmlns=&quot;http://www.w3.org/2000/svg&quot; aria-hidden=&quot;true&quot; role=&quot;img&quot; width=&quot;1em&quot; height=&quot;1em&quot; viewBox=&quot;0 0 24 24&quot; data-icon=&quot;solar:medal-star-bold-duotone&quot; class=&quot;iconify text-6xl group-hover:scale-110 transition-transform duration-300 text-zinc-800 iconify--solar&quot;&gt;&lt;path fill=&quot;currentColor&quot; d=&quot;M12.795 2h-2c-1.886 0-2.829 0-3.414.586c-.586.586-.586 1.528-.586 3.414v3.5h10V6c0-1.886 0-2.828-.586-3.414S14.681 2 12.795 2&quot; opacity=&quot;.5&quot;&gt;&lt;/path&gt;&lt;path fill=&quot;currentColor&quot; fill-rule=&quot;evenodd&quot; d=&quot;M13.23 5.783a3 3 0 0 0-2.872 0L5.564 8.397A3 3 0 0 0 4 11.031v4.938a3 3 0 0 0 1.564 2.634l4.794 2.614a3 3 0 0 0 2.872 0l4.795-2.614a3 3 0 0 0 1.564-2.634V11.03a3 3 0 0 0-1.564-2.634zM11.794 10.5c-.284 0-.474.34-.854 1.023l-.098.176c-.108.194-.162.29-.246.354s-.19.088-.399.135l-.19.044c-.739.167-1.108.25-1.195.532c-.088.283.163.577.666 1.165l.13.152c.144.167.215.25.247.354s.022.215 0 .438l-.02.203c-.076.785-.114 1.178.116 1.352s.575.015 1.266-.303l.179-.082c.196-.09.294-.135.398-.135s.203.045.399.135l.179.082c.69.319 1.036.477 1.266.303s.192-.567.116-1.352l-.02-.203c-.022-.223-.033-.334 0-.438c.032-.103.103-.187.246-.354l.13-.152c.504-.588.755-.882.667-1.165c-.088-.282-.457-.365-1.194-.532l-.191-.044c-.21-.047-.315-.07-.399-.135c-.084-.064-.138-.16-.246-.354l-.098-.176c-.38-.682-.57-1.023-.855-1.023&quot; clip-rule=&quot;evenodd&quot;&gt;&lt;/path&gt;&lt;/svg&gt;
            &lt;/div&gt;
            &lt;p class=&quot;text-[10px] font-bold uppercase mb-2 text-sky-600&quot;&gt;
              National Geographic
            &lt;/p&gt;
            &lt;h3 class=&quot;leading-tight transition-colors text-xl font-semibold mb-6 text-zinc-900&quot;&gt;
              Best Storytelling
            &lt;/h3&gt;
            &lt;div class=&quot;flex items-center text-xs font-medium group-hover:text-black transition-colors text-black/50&quot;&gt;
              Read more
              &lt;svg xmlns=&quot;http://www.w3.org/2000/svg&quot; width=&quot;24&quot; height=&quot;24&quot; viewBox=&quot;0 0 24 24&quot; fill=&quot;none&quot; stroke=&quot;currentColor&quot; stroke-width=&quot;2&quot; stroke-linecap=&quot;round&quot; stroke-linejoin=&quot;round&quot; data-lucide=&quot;chevron-right&quot; class=&quot;lucide lucide-chevron-right w-3 h-3 ml-1&quot;&gt;&lt;path d=&quot;m9 18 6-6-6-6&quot;&gt;&lt;/path&gt;&lt;/svg&gt;
            &lt;/div&gt;
          &lt;/div&gt;

    &lt;!-- Award 3 --&gt;
          &lt;div class=&quot;p-8 group transition-colors cursor-pointer hover:bg-black/5&quot;&gt;
            &lt;div class=&quot;h-40 flex items-center justify-center border-b mb-6 border-black/10&quot;&gt;
              &lt;svg xmlns=&quot;http://www.w3.org/2000/svg&quot; aria-hidden=&quot;true&quot; role=&quot;img&quot; width=&quot;1em&quot; height=&quot;1em&quot; viewBox=&quot;0 0 24 24&quot; data-icon=&quot;solar:verified-check-bold-duotone&quot; class=&quot;iconify text-6xl group-hover:scale-110 transition-transform duration-300 text-zinc-800 iconify--solar&quot;&gt;&lt;path fill=&quot;currentColor&quot; d=&quot;M9.592 3.2a6 6 0 0 1-.495.399c-.298.2-.633.338-.985.408c-.153.03-.313.043-.632.068c-.801.064-1.202.096-1.536.214a2.71 2.71 0 0 0-1.655 1.655c-.118.334-.15.735-.214 1.536a6 6 0 0 1-.068.632c-.07.352-.208.687-.408.985c-.087.13-.191.252-.399.495c-.521.612-.782.918-.935 1.238c-.353.74-.353 1.6 0 2.34c.153.32.414.626.935 1.238c.208.243.312.365.399.495c.2.298.338.633.408.985c.03.153.043.313.068.632c.064.801.096 1.202.214 1.536a2.71 2.71 0 0 0 1.655 1.655c.334.118.735.15 1.536.214c.319.025.479.038.632.068c.352.07.687.209.985.408c.13.087.252.191.495.399c.612.521.918.782 1.238.935c.74.353 1.6.353 2.34 0c.32-.153.626-.414 1.238-.935c.243-.208.365-.312.495-.399c.298-.2.633-.338.985-.408c.153-.03.313-.043.632-.068c.801-.064 1.202-.096 1.536-.214a2.71 2.71 0 0 0 1.655-1.655c.118-.334.15-.735.214-1.536c.025-.319.038-.479.068-.632c.07-.352.209-.687.408-.985c.087-.13.191-.252.399-.495c.521-.612.782-.918.935-1.238c.353-.74.353-1.6 0-2.34c-.153-.32-.414-.626-.935-1.238a6 6 0 0 1-.399-.495a2.7 2.7 0 0 1-.408-.985a6 6 0 0 1-.068-.632c-.064-.801-.096-1.202-.214-1.536a2.71 2.71 0 0 0-1.655-1.655c-.334-.118-.735-.15-1.536-.214a6 6 0 0 1-.632-.068a2.7 2.7 0 0 1-.985-.408a6 6 0 0 1-.495-.399c-.612-.521-.918-.782-1.238-.935a2.71 2.71 0 0 0-2.34 0c-.32.153-.626.414-1.238.935&quot; opacity=&quot;.5&quot;&gt;&lt;/path&gt;&lt;path fill=&quot;currentColor&quot; d=&quot;M16.374 9.863a.814.814 0 0 0-1.151-1.151l-4.85 4.85l-1.595-1.595a.814.814 0 0 0-1.151 1.151l2.17 2.17a.814.814 0 0 0 1.15 0z&quot;&gt;&lt;/path&gt;&lt;/svg&gt;
            &lt;/div&gt;
            &lt;p class=&quot;text-[10px] font-bold uppercase mb-2 text-sky-600&quot;&gt;
              Magnum Photos
            &lt;/p&gt;
            &lt;h3 class=&quot;leading-tight transition-colors text-xl font-semibold mb-6 text-zinc-900&quot;&gt;
              Nominee Member 2022
            &lt;/h3&gt;
            &lt;div class=&quot;flex items-center text-xs font-medium group-hover:text-black transition-colors text-black/50&quot;&gt;
              Read more
              &lt;svg xmlns=&quot;http://www.w3.org/2000/svg&quot; width=&quot;24&quot; height=&quot;24&quot; viewBox=&quot;0 0 24 24&quot; fill=&quot;none&quot; stroke=&quot;currentColor&quot; stroke-width=&quot;2&quot; stroke-linecap=&quot;round&quot; stroke-linejoin=&quot;round&quot; data-lucide=&quot;chevron-right&quot; class=&quot;lucide lucide-chevron-right w-3 h-3 ml-1&quot;&gt;&lt;path d=&quot;m9 18 6-6-6-6&quot;&gt;&lt;/path&gt;&lt;/svg&gt;
            &lt;/div&gt;
          &lt;/div&gt;

    &lt;!-- Award 4 --&gt;
          &lt;div class=&quot;p-8 group transition-colors cursor-pointer hover:bg-black/5&quot;&gt;
            &lt;div class=&quot;h-40 flex items-center justify-center border-b mb-6 border-black/10&quot;&gt;
              &lt;svg xmlns=&quot;http://www.w3.org/2000/svg&quot; aria-hidden=&quot;true&quot; role=&quot;img&quot; width=&quot;1em&quot; height=&quot;1em&quot; viewBox=&quot;0 0 24 24&quot; data-icon=&quot;solar:gallery-favourite-bold-duotone&quot; class=&quot;iconify text-6xl group-hover:scale-110 transition-transform duration-300 text-zinc-800 iconify--solar&quot;&gt;&lt;path fill=&quot;currentColor&quot; d=&quot;M21.904 16.441c.083-1.024.094-2.274.096-3.743a.697.697 0 1 0-1.396 0c-.001 1.477-.012 2.658-.091 3.63c-.084 1.032-.242 1.763-.507 2.32l-2.633-2.37a2.79 2.79 0 0 0-3.471-.21l-.277.196a1.86 1.86 0 0 1-2.386-.207l-3.99-3.99a2.14 2.14 0 0 0-2.922-.097l-.931.814V12c0-2.212 0-3.801.163-5.01c.16-1.19.464-1.907.994-2.437S5.8 3.72 6.99 3.56c1.079-.145 2.458-.161 4.313-.163a.699.699 0 0 0 0-1.396c-1.829.002-3.33.02-4.499.177c-1.343.18-2.404.557-3.236 1.39s-1.21 1.893-1.39 3.236C2 8.116 2 9.8 2 11.947V12q0 .736.002 1.396c.007 1.729.044 3.121.243 4.24c.203 1.14.584 2.058 1.322 2.796c.832.833 1.893 1.21 3.236 1.39C8.116 22 9.8 22 11.947 22h.106c2.148 0 3.83 0 5.144-.177c1.344-.18 2.404-.557 3.236-1.39a4.2 4.2 0 0 0 .73-.983c.445-.825.644-1.82.74-3.009&quot; opacity=&quot;.5&quot;&gt;&lt;/path&gt;&lt;path fill=&quot;currentColor&quot; fill-rule=&quot;evenodd&quot; d=&quot;M17.5 11c-2.121 0-3.182 0-3.841-.659S13 8.621 13 6.5s0-3.182.659-3.841S15.379 2 17.5 2s3.182 0 3.841.659S22 4.379 22 6.5s0 3.182-.659 3.841S19.621 11 17.5 11m-1.455-2.784c-.765-.67-1.545-1.564-1.545-2.418c0-1.773 1.65-2.435 3-1.065c1.35-1.37 3-.708 3 1.065c0 .854-.78 1.747-1.545 2.418c-.596.523-.894.784-1.455.784c-.56 0-.859-.261-1.455-.784&quot; clip-rule=&quot;evenodd&quot;&gt;&lt;/path&gt;&lt;/svg&gt;
            &lt;/div&gt;
            &lt;p class=&quot;text-[10px] font-bold uppercase mb-2 text-sky-600&quot;&gt;
              LensCulture
            &lt;/p&gt;
            &lt;h3 class=&quot;leading-tight transition-colors text-xl font-semibold mb-6 text-zinc-900&quot;&gt;
              Black &amp;amp; White Awards
            &lt;/h3&gt;
            &lt;div class=&quot;flex items-center text-xs font-medium group-hover:text-black transition-colors text-black/50&quot;&gt;
              View List
              &lt;svg xmlns=&quot;http://www.w3.org/2000/svg&quot; width=&quot;24&quot; height=&quot;24&quot; viewBox=&quot;0 0 24 24&quot; fill=&quot;none&quot; stroke=&quot;currentColor&quot; stroke-width=&quot;2&quot; stroke-linecap=&quot;round&quot; stroke-linejoin=&quot;round&quot; data-lucide=&quot;chevron-right&quot; class=&quot;lucide lucide-chevron-right w-3 h-3 ml-1&quot;&gt;&lt;path d=&quot;m9 18 6-6-6-6&quot;&gt;&lt;/path&gt;&lt;/svg&gt;
            &lt;/div&gt;
          &lt;/div&gt;
        &lt;/div&gt;
      &lt;/section&gt;

    &lt;!-- Journal Section --&gt;
      &lt;section class=&quot;border-b border-black/10 bg-zinc-50&quot;&gt;
  &lt;div class=&quot;grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-black/10&quot;&gt;

    &lt;!-- Left: Featured Article (Large Visual) --&gt;
    &lt;div class=&quot;group relative min-h-[600px] flex flex-col justify-end p-8 md:p-12 overflow-hidden cursor-pointer&quot;&gt;
      &lt;!-- Background Image with Zoom Effect --&gt;
      &lt;img src=&quot;https://images.unsplash.com/photo-1452587925148-ce544e77e70d?q=80&amp;amp;w=2574&amp;amp;auto=format&amp;amp;fit=crop&quot; alt=&quot;Darkroom&quot; class=&quot;group-hover:opacity-80 group-hover:scale-105 transition-all duration-1000 ease-out opacity-60 w-full h-full object-cover absolute top-0 right-0 bottom-0 left-0 grayscale&quot; style=&quot;&quot;&gt;
      &lt;div class=&quot;bg-gradient-to-t to-transparent absolute top-0 right-0 bottom-0 left-0 from-zinc-50 via-zinc-50/60&quot;&gt;&lt;/div&gt;

    &lt;!-- Content Overlay --&gt;
      &lt;div class=&quot;relative z-10 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500&quot;&gt;
        &lt;div class=&quot;flex items-center gap-4 mb-6&quot;&gt;
          &lt;span class=&quot;px-3 py-1 border text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm border-sky-500/30 bg-sky-500/10 text-sky-600&quot;&gt;Featured Diary&lt;/span&gt;
          &lt;span class=&quot;text-xs font-mono tracking-tight text-black/50&quot;&gt;OCT 24, 2024&lt;/span&gt;
        &lt;/div&gt;

    &lt;h3 class=&quot;md:text-7xl uppercase text-5xl font-bold tracking-tighter mb-8 text-zinc-900&quot;&gt;
          The Art of
          &lt;span class=&quot;font-normal text-black/40&quot;&gt;Printing&lt;/span&gt;
        &lt;/h3&gt;

    &lt;p class=&quot;leading-relaxed line-clamp-2 md:text-lg text-zinc-600 max-w-md mb-8&quot;&gt;
          Exploring the meditative process of darkroom printing, where digital noise fades and chemistry brings images to life.
        &lt;/p&gt;

    &lt;div class=&quot;flex items-center gap-3 text-xs font-bold uppercase tracking-widest transition-colors text-black group-hover:text-sky-600&quot;&gt;
          Read Full Entry
          &lt;div class=&quot;w-8 h-8 rounded-full border flex items-center justify-center group-hover:text-white transition-all duration-300 border-black/20 group-hover:bg-sky-600 group-hover:border-sky-600&quot;&gt;
            &lt;svg xmlns=&quot;http://www.w3.org/2000/svg&quot; width=&quot;16&quot; height=&quot;16&quot; viewBox=&quot;0 0 24 24&quot; fill=&quot;none&quot; stroke=&quot;currentColor&quot; stroke-width=&quot;2&quot; stroke-linecap=&quot;round&quot; stroke-linejoin=&quot;round&quot; class=&quot;lucide lucide-arrow-right&quot;&gt;&lt;path d=&quot;M5 12h14&quot;&gt;&lt;/path&gt;&lt;path d=&quot;m12 5 7 7-7 7&quot;&gt;&lt;/path&gt;&lt;/svg&gt;
          &lt;/div&gt;
        &lt;/div&gt;
      &lt;/div&gt;
    &lt;/div&gt;

    &lt;!-- Right: Editorial List &amp; Header --&gt;
    &lt;div class=&quot;flex flex-col h-full&quot;&gt;
      &lt;!-- Section Header --&gt;
      &lt;div class=&quot;p-8 md:p-12 border-b flex items-center justify-between bg-white/[0.02] border-black/10&quot;&gt;
        &lt;div class=&quot;&quot;&gt;
          &lt;h2 class=&quot;text-4xl md:text-5xl font-bold tracking-tighter uppercase mb-2 text-zinc-900&quot;&gt;Journal&lt;/h2&gt;
          &lt;p class=&quot;text-xs uppercase tracking-widest text-black/40&quot;&gt;Behind the Lens&lt;/p&gt;
        &lt;/div&gt;
        &lt;a href=&quot;#&quot; class=&quot;px-5 py-2.5 border text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 border-black/10 hover:bg-black hover:text-zinc-100&quot;&gt;
          Archive
          &lt;svg xmlns=&quot;http://www.w3.org/2000/svg&quot; width=&quot;14&quot; height=&quot;14&quot; viewBox=&quot;0 0 24 24&quot; fill=&quot;none&quot; stroke=&quot;currentColor&quot; stroke-width=&quot;2&quot; stroke-linecap=&quot;round&quot; stroke-linejoin=&quot;round&quot; class=&quot;lucide lucide-book-open&quot;&gt;&lt;path d=&quot;M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z&quot;&gt;&lt;/path&gt;&lt;path d=&quot;M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z&quot;&gt;&lt;/path&gt;&lt;/svg&gt;
        &lt;/a&gt;
      &lt;/div&gt;

    &lt;!-- Article List --&gt;
      &lt;div class=&quot;flex-1 divide-y divide-black/10&quot;&gt;
        &lt;!-- Item 1 --&gt;
        &lt;a href=&quot;#&quot; class=&quot;group block p-8 md:px-12 transition-colors relative overflow-hidden hover:bg-black/5&quot;&gt;
          &lt;div class=&quot;absolute right-0 top-0 bottom-0 w-1 transform translate-x-full group-hover:translate-x-0 transition-transform duration-300 bg-sky-500&quot;&gt;&lt;/div&gt;
          &lt;div class=&quot;flex justify-between items-start gap-6&quot;&gt;
            &lt;div class=&quot;flex-1&quot;&gt;
               &lt;div class=&quot;flex items-center gap-3 mb-3&quot;&gt;
                 &lt;span class=&quot;text-[10px] font-bold uppercase tracking-widest text-sky-600&quot;&gt;Gear&lt;/span&gt;
                 &lt;span class=&quot;w-1 h-1 rounded-full bg-black/20&quot;&gt;&lt;/span&gt;
                 &lt;span class=&quot;text-[10px] uppercase tracking-widest text-black/40&quot;&gt;Review&lt;/span&gt;
               &lt;/div&gt;
               &lt;h4 class=&quot;text-xl md:text-2xl font-semibold mb-2 group-hover:text-black transition-colors text-black/90&quot;&gt;Leica M11 Monochrom&lt;/h4&gt;
               &lt;p class=&quot;text-sm group-hover:text-black/70 transition-colors text-black/40&quot;&gt;Why I switched to a black and white only sensor for my latest project.&lt;/p&gt;
            &lt;/div&gt;
            &lt;div class=&quot;flex hidden md:flex transition-colors w-20 h-20 border items-center justify-center bg-black/5 border-black/10 group-hover:bg-sky-100 text-sky-600&quot;&gt;
                &lt;svg xmlns=&quot;http://www.w3.org/2000/svg&quot; aria-hidden=&quot;true&quot; role=&quot;img&quot; width=&quot;1em&quot; height=&quot;1em&quot; viewBox=&quot;0 0 24 24&quot; data-icon=&quot;solar:camera-add-bold-duotone&quot; class=&quot;iconify text-2xl iconify--solar&quot;&gt;&lt;path fill=&quot;currentColor&quot; fill-rule=&quot;evenodd&quot; d=&quot;M9.778 21h4.444c3.121 0 4.682 0 5.803-.735a4.4 4.4 0 0 0 1.226-1.204c.749-1.1.749-2.633.749-5.697s0-4.597-.749-5.697a4.4 4.4 0 0 0-1.226-1.204c-.72-.473-1.622-.642-3.003-.702c-.659 0-1.226-.49-1.355-1.125A2.064 2.064 0 0 0 13.634 3h-3.268c-.988 0-1.839.685-2.033 1.636c-.129.635-.696 1.125-1.355 1.125c-1.38.06-2.282.23-3.003.702A4.4 4.4 0 0 0 2.75 7.667C2 8.767 2 10.299 2 13.364s0 4.596.749 5.697c.324.476.74.885 1.226 1.204C5.096 21 6.657 21 9.778 21M16 13a4 4 0 1 1-8 0a4 4 0 0 1 8 0m2-3.75a.75.75 0 0 0 0 1.5h1a.75.75 0 0 0 0-1.5z&quot; clip-rule=&quot;evenodd&quot; opacity=&quot;.5&quot;&gt;&lt;/path&gt;&lt;path fill=&quot;currentColor&quot; fill-rule=&quot;evenodd&quot; d=&quot;M16 13a4 4 0 1 1-8 0a4 4 0 0 1 8 0m-3.25-2a.75.75 0 0 0-1.5 0v1.25H10a.75.75 0 0 0 0 1.5h1.25V15a.75.75 0 0 0 1.5 0v-1.25H14a.75.75 0 0 0 0-1.5h-1.25z&quot; clip-rule=&quot;evenodd&quot;&gt;&lt;/path&gt;&lt;path fill=&quot;currentColor&quot; d=&quot;M18 9.25a.75.75 0 0 0 0 1.5h1a.75.75 0 0 0 0-1.5z&quot;&gt;&lt;/path&gt;&lt;/svg&gt;
            &lt;/div&gt;
          &lt;/div&gt;
        &lt;/a&gt;

    &lt;!-- Item 2 --&gt;
        &lt;a href=&quot;#&quot; class=&quot;group block md:px-12 transition-colors overflow-hidden pt-8 pr-8 pb-8 pl-8 relative hover:bg-black/5&quot;&gt;
          &lt;div class=&quot;absolute right-0 top-0 bottom-0 w-1 bg-sky-500 transform translate-x-full group-hover:translate-x-0 transition-transform duration-300&quot;&gt;&lt;/div&gt;
          &lt;div class=&quot;flex justify-between items-start gap-6&quot;&gt;
            &lt;div class=&quot;flex-1&quot;&gt;
               &lt;div class=&quot;flex items-center gap-3 mb-3&quot;&gt;
                 &lt;span class=&quot;text-[10px] font-bold uppercase tracking-widest text-sky-600&quot;&gt;Travel&lt;/span&gt;
                 &lt;span class=&quot;w-1 h-1 rounded-full bg-black/20&quot;&gt;&lt;/span&gt;
                 &lt;span class=&quot;text-[10px] uppercase tracking-widest text-black/40&quot;&gt;Location&lt;/span&gt;
               &lt;/div&gt;
               &lt;h4 class=&quot;text-xl md:text-2xl font-semibold mb-2 group-hover:text-black transition-colors text-black/90&quot;&gt;Iceland's Black Beaches&lt;/h4&gt;
               &lt;p class=&quot;text-sm group-hover:text-black/70 transition-colors text-black/40&quot;&gt;Scouting the alien landscapes of Vík for the 'Nordic Silence' series.&lt;/p&gt;
            &lt;/div&gt;
            &lt;div class=&quot;flex hidden md:flex transition-colors w-20 h-20 border items-center justify-center bg-black/5 border-black/10 group-hover:bg-sky-100 text-sky-600&quot;&gt;
                &lt;svg xmlns=&quot;http://www.w3.org/2000/svg&quot; aria-hidden=&quot;true&quot; role=&quot;img&quot; width=&quot;1em&quot; height=&quot;1em&quot; viewBox=&quot;0 0 24 24&quot; data-icon=&quot;solar:map-point-bold-duotone&quot; class=&quot;iconify text-2xl iconify--solar&quot;&gt;&lt;path fill=&quot;currentColor&quot; d=&quot;M12 2c-4.418 0-8 4.003-8 8.5c0 4.462 2.553 9.312 6.537 11.174a3.45 3.45 0 0 0 2.926 0C17.447 19.812 20 14.962 20 10.5C20 6.003 16.418 2 12 2&quot; opacity=&quot;.5&quot;&gt;&lt;/path&gt;&lt;path fill=&quot;currentColor&quot; d=&quot;M12 12.5a2.5 2.5 0 1 0 0-5a2.5 2.5 0 0 0 0 5&quot;&gt;&lt;/path&gt;&lt;/svg&gt;
            &lt;/div&gt;
          &lt;/div&gt;
        &lt;/a&gt;

    &lt;!-- Item 3 --&gt;
        &lt;a href=&quot;#&quot; class=&quot;group block p-8 md:px-12 transition-colors relative overflow-hidden hover:bg-black/5&quot;&gt;
          &lt;div class=&quot;absolute right-0 top-0 bottom-0 w-1 transform translate-x-full group-hover:translate-x-0 transition-transform duration-300 bg-sky-500&quot;&gt;&lt;/div&gt;
          &lt;div class=&quot;flex justify-between items-start gap-6&quot;&gt;
            &lt;div class=&quot;flex-1&quot;&gt;
               &lt;div class=&quot;flex items-center gap-3 mb-3&quot;&gt;
                 &lt;span class=&quot;text-[10px] font-bold uppercase tracking-widest text-sky-600&quot;&gt;Tutorial&lt;/span&gt;
                 &lt;span class=&quot;w-1 h-1 rounded-full bg-black/20&quot;&gt;&lt;/span&gt;
                 &lt;span class=&quot;text-[10px] uppercase tracking-widest text-black/40&quot;&gt;Technique&lt;/span&gt;
               &lt;/div&gt;
               &lt;h4 class=&quot;text-xl md:text-2xl font-semibold mb-2 group-hover:text-black transition-colors text-black/90&quot;&gt;Mastering High Contrast&lt;/h4&gt;
               &lt;p class=&quot;text-sm group-hover:text-black/70 transition-colors text-black/40&quot;&gt;Lighting techniques to achieve dramatic shadows in studio portraiture.&lt;/p&gt;
            &lt;/div&gt;
            &lt;div class=&quot;w-20 h-20 border flex items-center justify-center hidden md:flex transition-colors bg-black/5 border-black/10 group-hover:bg-sky-100 text-sky-600&quot;&gt;
                &lt;svg xmlns=&quot;http://www.w3.org/2000/svg&quot; aria-hidden=&quot;true&quot; role=&quot;img&quot; width=&quot;1em&quot; height=&quot;1em&quot; viewBox=&quot;0 0 24 24&quot; data-icon=&quot;solar:lightbulb-bolt-bold-duotone&quot; class=&quot;iconify text-2xl iconify--solar&quot;&gt;&lt;path fill=&quot;currentColor&quot; d=&quot;M4 9.674C4 5.436 7.358 2 11.5 2S19 5.436 19 9.674a7.74 7.74 0 0 1-2.499 5.72c-.51.467-.889.814-1.157 1.066a15 15 0 0 0-.4.39l-.025.027l-.008.01c-.237.298-.288.375-.318.445s-.053.16-.113.54c-.023.15-.026.406-.026 1.105v.03c0 .409 0 .762-.025 1.051c-.027.306-.087.61-.248.895a2.07 2.07 0 0 1-.75.767c-.278.165-.575.226-.874.254c-.283.026-.628.026-1.028.026h-.058c-.4 0-.745 0-1.028-.026c-.3-.028-.596-.09-.875-.254a2.07 2.07 0 0 1-.749-.767c-.16-.285-.22-.588-.248-.895c-.026-.29-.026-.642-.026-1.051v-.03c0-.699-.002-.955-.026-1.105c-.06-.38-.081-.47-.112-.54c-.03-.07-.081-.147-.318-.446l-.008-.01l-.025-.026l-.088-.09a15 15 0 0 0-.312-.3c-.268-.252-.647-.599-1.157-1.067A7.74 7.74 0 0 1 4 9.674&quot; opacity=&quot;.5&quot;&gt;&lt;/path&gt;&lt;path fill=&quot;currentColor&quot; d=&quot;M13.085 19.675h-3.17q.004.144.014.258c.018.21.05.285.071.323a.7.7 0 0 0 .25.256c.037.021.111.054.316.072c.214.02.496.021.934.021c.437 0 .72 0 .934-.02c.204-.02.279-.052.316-.073a.7.7 0 0 0 .25-.256c.02-.038.052-.114.07-.323q.01-.113.015-.258M12.61 8.177c.307.224.378.66.159.973l-1.178 1.688h1.402a.68.68 0 0 1 .606.378a.71.71 0 0 1-.051.725L11.6 14.73a.67.67 0 0 1-.951.163a.71.71 0 0 1-.159-.973l1.178-1.688h-1.402a.68.68 0 0 1-.606-.379a.71.71 0 0 1 .051-.724l1.948-2.79a.67.67 0 0 1 .951-.163&quot;&gt;&lt;/path&gt;&lt;/svg&gt;
            &lt;/div&gt;
          &lt;/div&gt;
        &lt;/a&gt;
      &lt;/div&gt;
    &lt;/div&gt;
  &lt;/div&gt;
&lt;/section&gt;

    &lt;!-- Footer Visual &amp; Links --&gt;
      &lt;section class=&quot;overflow-hidden pt-32 pb-12 relative&quot;&gt;
        &lt;!-- Footer Content --&gt;
        &lt;div class=&quot;md:px-12 flex flex-col md:flex-row z-10 mb-16 pr-6 pl-6 relative gap-x-12 gap-y-12 items-end justify-between&quot;&gt;
          &lt;div class=&quot;flex items-center gap-8&quot;&gt;
            &lt;div class=&quot;w-12 h-12 rounded-full border flex items-center justify-center border-zinc-900 bg-zinc-900&quot;&gt;
              &lt;span class=&quot;font-bold text-white text-xl&quot;&gt;L&lt;/span&gt;
            &lt;/div&gt;
            &lt;div class=&quot;flex gap-4 text-xs font-semibold tracking-widest uppercase opacity-80&quot;&gt;
              &lt;span&gt;L&lt;/span&gt;
              &lt;span&gt;U&lt;/span&gt;
              &lt;span&gt;M&lt;/span&gt;
              &lt;span&gt;E&lt;/span&gt;
              &lt;span&gt;N&lt;/span&gt;
            &lt;/div&gt;
          &lt;/div&gt;

    &lt;div class=&quot;text-right&quot;&gt;
            &lt;p class=&quot;text-sm font-semibold mb-4 text-zinc-900&quot;&gt;
              Connect:
            &lt;/p&gt;
            &lt;div class=&quot;flex gap-4 justify-end&quot;&gt;
              &lt;a href=&quot;#&quot; class=&quot;w-10 h-10 rounded-full flex items-center justify-center transition-colors bg-black/5 hover:bg-black hover:text-white&quot;&gt;
                &lt;svg xmlns=&quot;http://www.w3.org/2000/svg&quot; width=&quot;24&quot; height=&quot;24&quot; viewBox=&quot;0 0 24 24&quot; fill=&quot;none&quot; stroke=&quot;currentColor&quot; stroke-width=&quot;2&quot; stroke-linecap=&quot;round&quot; stroke-linejoin=&quot;round&quot; data-lucide=&quot;instagram&quot; class=&quot;lucide lucide-instagram w-4 h-4&quot;&gt;&lt;rect width=&quot;20&quot; height=&quot;20&quot; x=&quot;2&quot; y=&quot;2&quot; rx=&quot;5&quot; ry=&quot;5&quot;&gt;&lt;/rect&gt;&lt;path d=&quot;M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z&quot;&gt;&lt;/path&gt;&lt;line x1=&quot;17.5&quot; x2=&quot;17.51&quot; y1=&quot;6.5&quot; y2=&quot;6.5&quot;&gt;&lt;/line&gt;&lt;/svg&gt;
              &lt;/a&gt;
              &lt;a href=&quot;#&quot; class=&quot;w-10 h-10 rounded-full flex items-center justify-center transition-colors bg-black/5 hover:bg-black hover:text-white&quot;&gt;
                &lt;svg xmlns=&quot;http://www.w3.org/2000/svg&quot; width=&quot;24&quot; height=&quot;24&quot; viewBox=&quot;0 0 24 24&quot; fill=&quot;none&quot; stroke=&quot;currentColor&quot; stroke-width=&quot;2&quot; stroke-linecap=&quot;round&quot; stroke-linejoin=&quot;round&quot; data-lucide=&quot;twitter&quot; class=&quot;lucide lucide-twitter w-4 h-4&quot;&gt;&lt;path d=&quot;M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z&quot;&gt;&lt;/path&gt;&lt;/svg&gt;
              &lt;/a&gt;
              &lt;a href=&quot;#&quot; class=&quot;w-10 h-10 rounded-full flex items-center justify-center transition-colors bg-black/5 hover:bg-black hover:text-white&quot;&gt;
                &lt;svg xmlns=&quot;http://www.w3.org/2000/svg&quot; width=&quot;24&quot; height=&quot;24&quot; viewBox=&quot;0 0 24 24&quot; fill=&quot;none&quot; stroke=&quot;currentColor&quot; stroke-width=&quot;2&quot; stroke-linecap=&quot;round&quot; stroke-linejoin=&quot;round&quot; data-lucide=&quot;mail&quot; class=&quot;lucide lucide-mail w-4 h-4&quot;&gt;&lt;path d=&quot;m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7&quot;&gt;&lt;/path&gt;&lt;rect x=&quot;2&quot; y=&quot;4&quot; width=&quot;20&quot; height=&quot;16&quot; rx=&quot;2&quot;&gt;&lt;/rect&gt;&lt;/svg&gt;
              &lt;/a&gt;
            &lt;/div&gt;
          &lt;/div&gt;
        &lt;/div&gt;

    &lt;!-- Bottom Navigation Bar --&gt;
        &lt;div class=&quot;md:px-12 border-t pt-16 pr-6 pb-8 pl-6 backdrop-blur-md bg-zinc-100/50 border-black/10&quot;&gt;
  &lt;div class=&quot;grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12 max-w-7xl mx-auto&quot;&gt;
    &lt;!-- Brand &amp; Newsletter --&gt;
    &lt;div class=&quot;space-y-6&quot;&gt;
      &lt;a href=&quot;#&quot; class=&quot;inline-flex items-center gap-2 font-bold tracking-tighter text-2xl&quot;&gt;
        &lt;span class=&quot;w-6 h-6 rounded flex items-center justify-center text-sm text-white bg-zinc-900&quot;&gt;L&lt;/span&gt;
        LUMEN
      &lt;/a&gt;
      &lt;p class=&quot;text-sm leading-relaxed max-w-xs text-zinc-500&quot;&gt;
        Capturing the ephemeral. A portfolio of light, shadow, and the human condition.
      &lt;/p&gt;
      &lt;div class=&quot;pt-2&quot;&gt;
        &lt;p class=&quot;text-xs font-semibold mb-2 text-black&quot;&gt;Subscribe for print drops&lt;/p&gt;
        &lt;form class=&quot;flex gap-2&quot;&gt;
          &lt;input type=&quot;email&quot; placeholder=&quot;Email address&quot; class=&quot;border rounded px-3 py-2 text-xs placeholder-zinc-400 focus:outline-none focus:bg-white w-full transition-all bg-white border-black/10 text-black focus:border-sky-500&quot;&gt;
          &lt;button type=&quot;submit&quot; class=&quot;font-semibold text-xs px-4 py-2 rounded transition-colors text-white bg-zinc-900 hover:bg-zinc-800&quot;&gt;
            Join
          &lt;/button&gt;
        &lt;/form&gt;
      &lt;/div&gt;
    &lt;/div&gt;

    &lt;!-- Links Column 1 --&gt;
    &lt;div class=&quot;&quot;&gt;
      &lt;h4 class=&quot;text-sm font-semibold mb-6 tracking-wide text-black&quot;&gt;Portfolio&lt;/h4&gt;
      &lt;ul class=&quot;space-y-3 text-sm text-zinc-500&quot;&gt;
        &lt;li class=&quot;&quot;&gt;&lt;a href=&quot;#&quot; class=&quot;transition-colors block hover:text-sky-600&quot;&gt;Editorial&lt;/a&gt;&lt;/li&gt;
        &lt;li class=&quot;&quot;&gt;&lt;a href=&quot;#&quot; class=&quot;transition-colors block hover:text-sky-600&quot;&gt;Landscape&lt;/a&gt;&lt;/li&gt;
        &lt;li class=&quot;&quot;&gt;&lt;a href=&quot;#&quot; class=&quot;transition-colors block hover:text-sky-600&quot;&gt;Portraiture&lt;/a&gt;&lt;/li&gt;
        &lt;li class=&quot;&quot;&gt;&lt;a href=&quot;#&quot; class=&quot;transition-colors block hover:text-sky-600&quot;&gt;Architecture&lt;/a&gt;&lt;/li&gt;
        &lt;li class=&quot;&quot;&gt;&lt;a href=&quot;#&quot; class=&quot;transition-colors block hover:text-sky-600&quot;&gt;Experimental&lt;/a&gt;&lt;/li&gt;
      &lt;/ul&gt;
    &lt;/div&gt;

    &lt;!-- Links Column 2 --&gt;
    &lt;div class=&quot;&quot;&gt;
      &lt;h4 class=&quot;text-sm font-semibold mb-6 tracking-wide text-black&quot;&gt;Studio&lt;/h4&gt;
      &lt;ul class=&quot;space-y-3 text-sm text-zinc-500&quot;&gt;
        &lt;li class=&quot;&quot;&gt;&lt;a href=&quot;#&quot; class=&quot;transition-colors block hover:text-sky-600&quot;&gt;About Lumen&lt;/a&gt;&lt;/li&gt;
        &lt;li class=&quot;&quot;&gt;&lt;a href=&quot;#&quot; class=&quot;transition-colors block hover:text-sky-600&quot;&gt;Equipment&lt;/a&gt;&lt;/li&gt;
        &lt;li class=&quot;&quot;&gt;&lt;a href=&quot;#&quot; class=&quot;transition-colors block hover:text-sky-600&quot;&gt;Workshops&lt;/a&gt;&lt;/li&gt;
        &lt;li class=&quot;&quot;&gt;&lt;a href=&quot;#&quot; class=&quot;transition-colors block hover:text-sky-600&quot;&gt;Licensing&lt;/a&gt;&lt;/li&gt;
        &lt;li class=&quot;&quot;&gt;&lt;a href=&quot;#&quot; class=&quot;transition-colors block hover:text-sky-600&quot;&gt;Print Shop&lt;/a&gt;&lt;/li&gt;
      &lt;/ul&gt;
    &lt;/div&gt;

    &lt;!-- Links Column 3 --&gt;
    &lt;div class=&quot;&quot;&gt;
      &lt;h4 class=&quot;text-sm font-semibold mb-6 tracking-wide text-black&quot;&gt;Contact&lt;/h4&gt;
      &lt;ul class=&quot;space-y-3 text-sm text-zinc-500&quot;&gt;
        &lt;li&gt;&lt;a href=&quot;#&quot; class=&quot;transition-colors flex items-center gap-2 hover:text-sky-600&quot;&gt;
          &lt;svg xmlns=&quot;http://www.w3.org/2000/svg&quot; width=&quot;14&quot; height=&quot;14&quot; viewBox=&quot;0 0 24 24&quot; fill=&quot;none&quot; stroke=&quot;currentColor&quot; stroke-width=&quot;2&quot; stroke-linecap=&quot;round&quot; stroke-linejoin=&quot;round&quot; class=&quot;lucide lucide-map-pin&quot;&gt;&lt;path d=&quot;M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z&quot;&gt;&lt;/path&gt;&lt;circle cx=&quot;12&quot; cy=&quot;10&quot; r=&quot;3&quot;&gt;&lt;/circle&gt;&lt;/svg&gt;
          London, UK
        &lt;/a&gt;&lt;/li&gt;
        &lt;li&gt;&lt;a href=&quot;#&quot; class=&quot;transition-colors flex items-center gap-2 hover:text-sky-600&quot;&gt;
          &lt;svg xmlns=&quot;http://www.w3.org/2000/svg&quot; width=&quot;14&quot; height=&quot;14&quot; viewBox=&quot;0 0 24 24&quot; fill=&quot;none&quot; stroke=&quot;currentColor&quot; stroke-width=&quot;2&quot; stroke-linecap=&quot;round&quot; stroke-linejoin=&quot;round&quot; class=&quot;lucide lucide-phone&quot;&gt;&lt;path d=&quot;M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z&quot;&gt;&lt;/path&gt;&lt;/svg&gt;
          +44 (0) 20 7123 4567
        &lt;/a&gt;&lt;/li&gt;
        &lt;li&gt;&lt;a href=&quot;#&quot; class=&quot;transition-colors flex items-center gap-2 hover:text-sky-600&quot;&gt;
          &lt;svg xmlns=&quot;http://www.w3.org/2000/svg&quot; width=&quot;14&quot; height=&quot;14&quot; viewBox=&quot;0 0 24 24&quot; fill=&quot;none&quot; stroke=&quot;currentColor&quot; stroke-width=&quot;2&quot; stroke-linecap=&quot;round&quot; stroke-linejoin=&quot;round&quot; class=&quot;lucide lucide-calendar&quot;&gt;&lt;rect width=&quot;18&quot; height=&quot;18&quot; x=&quot;3&quot; y=&quot;4&quot; rx=&quot;2&quot; ry=&quot;2&quot;&gt;&lt;/rect&gt;&lt;line x1=&quot;16&quot; x2=&quot;16&quot; y1=&quot;2&quot; y2=&quot;6&quot;&gt;&lt;/line&gt;&lt;line x1=&quot;8&quot; x2=&quot;8&quot; y1=&quot;2&quot; y2=&quot;6&quot;&gt;&lt;/line&gt;&lt;line x1=&quot;3&quot; x2=&quot;21&quot; y1=&quot;10&quot; y2=&quot;10&quot;&gt;&lt;/line&gt;&lt;/svg&gt;
          Bookings
        &lt;/a&gt;&lt;/li&gt;
        &lt;li&gt;&lt;a href=&quot;#&quot; class=&quot;transition-colors flex items-center gap-2 hover:text-sky-600&quot;&gt;
          &lt;svg xmlns=&quot;http://www.w3.org/2000/svg&quot; width=&quot;14&quot; height=&quot;14&quot; viewBox=&quot;0 0 24 24&quot; fill=&quot;none&quot; stroke=&quot;currentColor&quot; stroke-width=&quot;2&quot; stroke-linecap=&quot;round&quot; stroke-linejoin=&quot;round&quot; class=&quot;lucide lucide-mail&quot;&gt;&lt;rect width=&quot;20&quot; height=&quot;16&quot; x=&quot;2&quot; y=&quot;4&quot; rx=&quot;2&quot;&gt;&lt;/rect&gt;&lt;path d=&quot;m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7&quot;&gt;&lt;/path&gt;&lt;/svg&gt;
          hello@lumen.studio
        &lt;/a&gt;&lt;/li&gt;
      &lt;/ul&gt;
    &lt;/div&gt;
  &lt;/div&gt;

  &lt;div class=&quot;border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4 max-w-7xl mx-auto border-black/10&quot;&gt;
    &lt;p class=&quot;text-xs text-zinc-400&quot;&gt;
      © 2024 Lumen Photography. All rights reserved.
    &lt;/p&gt;
    &lt;div class=&quot;flex items-center gap-6 text-xs text-zinc-400&quot;&gt;
      &lt;a href=&quot;#&quot; class=&quot;transition-colors hover:text-black&quot;&gt;Privacy Policy&lt;/a&gt;
      &lt;a href=&quot;#&quot; class=&quot;transition-colors hover:text-black&quot;&gt;Terms of Service&lt;/a&gt;
      &lt;a href=&quot;#&quot; class=&quot;transition-colors hover:text-black&quot;&gt;Sitemap&lt;/a&gt;
    &lt;/div&gt;
  &lt;/div&gt;
&lt;/div&gt;
      &lt;/section&gt;
    &lt;/main&gt;

    &lt;script&gt;
      lucide.createIcons();
    &lt;/script&gt;

&lt;script data-img-fallback-handler&gt;!function(){var f=[&quot;https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/917d6f93-fb36-439a-8c48-884b67b35381_1600w.jpg&quot;,&quot;https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/4734259a-bad7-422f-981e-ce01e79184f2_1600w.jpg&quot;,&quot;https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/c543a9e1-f226-4ced-80b0-feb8445a75b9_1600w.jpg&quot;,&quot;https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/5bab247f-35d9-400d-a82b-fd87cfe913d2_1600w.webp&quot;,&quot;https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/30104e3c-5eea-4b93-93e9-5313698a7156_1600w.webp&quot;],h=new Set;function g(s){for(var x=0,i=0;i&lt;s.length;i++)x=(x&lt;&lt;5)-x+s.charCodeAt(i)|0;return f[Math.abs(x)%f.length]}function r(t){var s=t.src;if(s&amp;&amp;!h.has(s)){h.add(s);t.src=g(s)}}window.addEventListener(&quot;error&quot;,function(e){var t=e.target;if(t&amp;&amp;t.tagName===&quot;IMG&quot;)r(t)},!0);function c(){document.querySelectorAll(&quot;img&quot;).forEach(function(i){if(i.complete&amp;&amp;!i.naturalWidth&amp;&amp;i.src)r(i)})}if(document.readyState===&quot;loading&quot;)document.addEventListener(&quot;DOMContentLoaded&quot;,c);else c()}()&lt;/script&gt;&lt;/body&gt;&lt;/html&gt;">`</iframe></div>``</div><div class="fixed bottom-4 right-4 z-50">``<div class="group bg-neutral-900 transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] border border-white/5 rounded-xl p-1 px-2 h-10 flex items-center gap-0 shadow-strong shine overflow-hidden"><a href="https://aura.build" class="flex items-center gap-1 hover:opacity-80 transition-opacity" data-state="closed">``<img src="/logo-aura-gray.svg" alt="Aura Logo" class="h-5 w-5 mix-blend-screen"><span class="text-[11px] font-medium text-neutral-300 mr-2">`Made in Aura`</a></div>``</div></div>``</div></div>``<div role="region" aria-label="Notifications (F8)" tabindex="-1" style="pointer-events: none;"><ol tabindex="-1" class="fixed top-8 left-1/2 -translate-x-1/2 z-[100] flex max-h-screen flex-col-reverse p-4 max-w-[420px]">``</ol></div>``</div>`

`<browser-mcp-container data-wxt-shadow-root=""></browser-mcp-container>``</body>`
