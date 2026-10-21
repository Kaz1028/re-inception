// Accept height updates only from our own embedded at-home pages.
window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.data?.type !== 'inception-athome-height') return;
  const height = Number(event.data.height);
  if (!Number.isFinite(height) || height < 1 || height > 12000) return;
  for (const frame of document.querySelectorAll('iframe.athome-widget-frame')) {
    if (frame.contentWindow === event.source) frame.style.height = `${height + 8}px`;
  }
});
