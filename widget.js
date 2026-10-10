/**
 * Alessandro Rocchi - Music Player Floating Embed Script
 * Embed on any external website with 1 line of code:
 * <script src="https://alta-mente.github.io/canzoni/widget.js" data-album="non-ce-vita-su-marte" data-track="1"></script>
 */
(function() {
  'use strict';

  // Find the executing script tag
  var currentScript = document.currentScript || (function() {
    var scripts = document.getElementsByTagName('script');
    for (var i = scripts.length - 1; i >= 0; i--) {
      if (scripts[i].src && scripts[i].src.indexOf('widget.js') !== -1) {
        return scripts[i];
      }
    }
    return null;
  })();

  if (!currentScript) return;

  // Options from script attributes
  var album = currentScript.getAttribute('data-album') || 'non-ce-vita-su-marte';
  var track = currentScript.getAttribute('data-track') || '1';
  var style = currentScript.getAttribute('data-style') || 'floating';
  var theme = currentScript.getAttribute('data-theme') || 'dark';
  var position = currentScript.getAttribute('data-position') || 'bottom-right'; // 'bottom-right' | 'bottom-left'

  // If duplicate attributes exist in HTML tag, pick the last specified one
  try {
    var rawHtml = currentScript.outerHTML || '';
    var styleMatches = rawHtml.match(/data-style=["']([^"']+)["']/g);
    if (styleMatches && styleMatches.length > 0) {
      var lastStyle = styleMatches[styleMatches.length - 1].replace(/data-style=["']/, '').replace(/["']$/, '');
      if (lastStyle) style = lastStyle;
    }
    var themeMatches = rawHtml.match(/data-theme=["']([^"']+)["']/g);
    if (themeMatches && themeMatches.length > 0) {
      var lastTheme = themeMatches[themeMatches.length - 1].replace(/data-theme=["']/, '').replace(/["']$/, '');
      if (lastTheme) theme = lastTheme;
    }
  } catch (e) {}

  // Base URL (derive from script source or default to github pages)
  var baseUrl = 'https://alta-mente.github.io/canzoni/';
  if (currentScript.src) {
    try {
      var url = new URL(currentScript.src);
      baseUrl = url.origin + url.pathname.replace(/\/widget\.js.*$/, '/');
      if (!baseUrl.endsWith('/')) baseUrl += '/';
    } catch (e) {}
  }

  var widgetUrl = baseUrl + '#widget?album=' + encodeURIComponent(album) +
                  '&track=' + encodeURIComponent(track) +
                  '&style=' + encodeURIComponent(style) +
                  '&theme=' + encodeURIComponent(theme);

  // If style is floating or pill, create fixed overlay container
  if (style === 'floating' || style === 'pill') {
    var container = document.createElement('div');
    container.id = 'alessandro-rocchi-floating-player';
    
    var posStyles = position === 'bottom-left' ? 'left: 20px;' : 'right: 20px;';
    container.style.cssText = 'position: fixed; bottom: 20px; ' + posStyles +
      ' z-index: 999999; display: flex; justify-content: flex-end; align-items: flex-end;' +
      ' pointer-events: auto; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);' +
      ' filter: drop-shadow(0 15px 35px rgba(0,0,0,0.5));';

    var isPill = style === 'pill';
    var iframe = document.createElement('iframe');
    iframe.src = widgetUrl;
    var w = isPill ? '260px' : '330px';
    var h = isPill ? '56px' : '135px';
    var r = isPill ? '28px' : '20px';
    iframe.style.cssText = 'border: none; overflow: hidden; background: transparent; transition: all 0.3s ease; width: ' + w + '; height: ' + h + '; border-radius: ' + r + ';';
    iframe.allow = 'autoplay; encrypted-media';
    iframe.title = 'Alessandro Rocchi Player';

    container.appendChild(iframe);

    // Listen for resize messages from widget (when minimized / expanded)
    window.addEventListener('message', function(event) {
      if (event.data && event.data.type === 'WIDGET_RESIZE') {
        if (event.data.isMinimized) {
          iframe.style.width = '260px';
          iframe.style.height = '56px';
          iframe.style.borderRadius = '28px';
        } else {
          iframe.style.width = '330px';
          iframe.style.height = '135px';
          iframe.style.borderRadius = '20px';
        }
      }
    });

    if (document.body) {
      document.body.appendChild(container);
    } else {
      window.addEventListener('DOMContentLoaded', function() {
        document.body.appendChild(container);
      });
    }
  } else {
    // In-page embed
    var inPageIframe = document.createElement('iframe');
    inPageIframe.src = widgetUrl;
    inPageIframe.style.cssText = 'width: 100%; border: none; overflow: hidden; background: transparent; border-radius: 20px;';
    inPageIframe.allow = 'autoplay; encrypted-media';
    inPageIframe.title = 'Alessandro Rocchi Player';

    if (style === 'compact') {
      inPageIframe.style.height = '80px';
      inPageIframe.style.maxWidth = '600px';
    } else if (style === 'card') {
      inPageIframe.style.height = '230px';
      inPageIframe.style.maxWidth = '460px';
    } else if (style === 'playlist') {
      inPageIframe.style.height = '420px';
      inPageIframe.style.maxWidth = '550px';
    }

    currentScript.parentNode.insertBefore(inPageIframe, currentScript);
  }
})();
