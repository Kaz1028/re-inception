// Accept height updates only from our own embedded at-home pages.
window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.data?.type !== 'inception-athome-height') return;
  const height = Number(event.data.height);
  if (!Number.isFinite(height) || height < 1 || height > 12000) return;
  for (const frame of document.querySelectorAll('iframe.athome-widget-frame')) {
    if (frame.contentWindow === event.source) frame.style.height = `${height + 8}px`;
  }
});

// Keep category and regional navigation in the named search frame.
document.addEventListener('click', event => {
  const link = event.target.closest?.('a[target="athome-property-search"]');
  if (!link) return;
  const frame = document.getElementById('athome-property-search');
  if (!frame) return;
  for (const item of document.querySelectorAll('a[target="athome-property-search"]')) {
    item.removeAttribute('aria-current');
  }
  link.setAttribute('aria-current', 'true');
  const top = frame.getBoundingClientRect().top;
  if (top < 90 || top > window.innerHeight - 180) {
    frame.scrollIntoView({behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block:'start'});
  }
});
