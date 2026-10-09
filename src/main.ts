import { screenById, hotspotsFor } from './screens';
import type { Screen } from './screens';
import screenText from './screen-text.json';
import transitionPreviews from './transition-previews.json';
import './style.css';

const app = document.querySelector<HTMLElement>('#app')!;
const cache = new Map<string, HTMLImageElement>();
let active = 'home';
let trail: string[] = [];
let renderVersion = 0;

function asset(screen: Screen) {
  const embedded = (window as Window & { FIT_ARTWORK?: Record<string, string> }).FIT_ARTWORK;
  return embedded?.[screen.source] ?? `${import.meta.env.BASE_URL}screens/${screen.source}.webp`;
}

function load(screen: Screen): Promise<HTMLImageElement> {
  let image = cache.get(screen.id);
  if (!image) {
    image = new Image();
    image.fetchPriority = 'low';
    image.src = asset(screen);
    image.alt = '';
    image.draggable = false;
    image.className = 'artwork';
    cache.set(screen.id, image);
    // Full-size artwork is large; bound decoded image memory on phones.
    if (cache.size > 4) cache.delete(cache.keys().next().value!);
  } else {
    cache.delete(screen.id);
    cache.set(screen.id, image);
  }
  return image.decode().then(() => image!, error => {
    if (cache.get(screen.id) === image) cache.delete(screen.id);
    throw error;
  });
}

function currentLocation() {
  const id = window.location.hash.slice(1);
  return screenById.has(id) ? id : 'home';
}

function saveNavigation() {
  // Session storage is optional (some privacy modes disable it).
  try {
    sessionStorage.setItem('zabey-navigation', JSON.stringify({ active, trail }));
  } catch { /* Navigation still works without storage. */ }
}

function render(id: string, focus = false) {
  const screen = screenById.get(id) ?? screenById.get('home')!;
  const version = ++renderVersion;
  app.setAttribute('aria-busy', 'true');
  // Every preview is part of the application bundle: a click changes the
  // displayed screen and its controls synchronously, even on a slow connection.
  const image = new Image();
  image.src = (transitionPreviews as Record<string, string>)[screen.source];
  image.alt = '';
  image.draggable = false;
  image.className = 'artwork';
  image.dataset.quality = 'preview';

  const stage = document.createElement('section');
  stage.className = 'screen';
  stage.dataset.screen = screen.id;
  stage.style.setProperty('--screen-height', String(screen.height));
  stage.style.aspectRatio = `1320 / ${screen.height}`;
  stage.setAttribute('aria-labelledby', 'screen-title');
  stage.setAttribute('aria-describedby', 'screen-description');
  const title = document.createElement('h1');
  title.id = 'screen-title';
  title.className = 'sr-only';
  title.tabIndex = -1;
  title.textContent = screen.title;
  const description = document.createElement('p');
  description.id = 'screen-description';
  description.className = 'sr-only';
  description.textContent = (screenText as Record<string, string>)[screen.id] ?? screen.description;
  stage.append(image, title, description);

  for (const spot of hotspotsFor(screen)) {
    const control = document.createElement(spot.href ? 'a' : 'button');
    control.className = 'hotspot';
    control.setAttribute('aria-label', spot.label);
    control.title = spot.label;
    control.style.left = `${spot.rect[0] / 1320 * 100}%`;
    control.style.top = `${spot.rect[1] / screen.height * 100}%`;
    control.style.width = `${spot.rect[2] / 1320 * 100}%`;
    control.style.height = `${spot.rect[3] / screen.height * 100}%`;
    if (control instanceof HTMLAnchorElement && spot.href) {
      control.href = spot.href;
      if (spot.href.startsWith('https://')) {
        control.target = '_blank';
        control.rel = 'noopener noreferrer';
      }
    } else if (control instanceof HTMLButtonElement) {
      control.type = 'button';
      if (spot.action === 'home') {
        control.disabled = screen.id === 'home';
        control.onclick = () => navigate('home', true);
      } else if (spot.action === 'back') {
        control.disabled = screen.id === 'home';
        control.onclick = goBack;
      } else if (spot.to) {
        control.dataset.to = spot.to;
        control.onclick = () => navigate(spot.to!);
      }
    }
    stage.append(control);
  }

  app.replaceChildren(stage);
  app.setAttribute('aria-busy', 'false');
  document.title = screen.id === 'home' ? 'Забей ковёр — студия тафтинга' : `${screen.title} — Забей ковёр`;
  if (focus) title.focus({ preventScroll: true });
  void load(screen).then(original => {
    // A late response must never replace a screen selected by a newer click.
    if (version !== renderVersion) return;
    original.dataset.quality = 'original';
    image.replaceWith(original);
    app.setAttribute('aria-busy', 'false');
  }).catch(() => {
    if (version !== renderVersion) return;
    // The embedded preview and all controls remain usable if the connection
    // drops. A later visit retries the original image.
    app.setAttribute('aria-busy', 'false');
  });
}

function navigate(id: string, reset = false) {
  if (id === active || !screenById.has(id)) return;
  trail = reset ? [] : [...trail, active];
  active = id;
  history.pushState({ trail }, '', `#${id}`);
  saveNavigation();
  void render(id, true);
}

function goBack() {
  if (active === 'home') return;
  const target = trail.pop() ?? screenById.get(active)!.parent;
  active = target;
  // Keep the actual in-app path, including screens reached from several branches.
  history.pushState({ trail: [...trail] }, '', `#${active}`);
  saveNavigation();
  void render(active, true);
}

active = currentLocation();
try {
  const saved = JSON.parse(sessionStorage.getItem('zabey-navigation') ?? 'null');
  if (saved?.active === active && Array.isArray(saved.trail)) {
    trail = saved.trail.filter((id: unknown): id is string => typeof id === 'string' && screenById.has(id));
  }
} catch { /* Ignore stale or unavailable storage. */ }
history.replaceState({ trail }, '', `#${active}`);
window.addEventListener('popstate', event => {
  active = currentLocation();
  trail = Array.isArray(event.state?.trail) ? event.state.trail.filter((id: string) => screenById.has(id)) : [];
  saveNavigation();
  void render(active, true);
});
void render(active);
