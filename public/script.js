const FEED = document.getElementById('feed');
const YEAR = document.getElementById('year');
const ARTICLE_MODAL = document.getElementById('articleModal');
const ARTICLE_CONTAINER = document.getElementById('article');
const LIGHTBOX = document.getElementById('lightbox');
const LIGHT_IMAGE = document.getElementById('lightImage');
const LIGHT_PREV = document.getElementById('lightPrev');
const LIGHT_NEXT = document.getElementById('lightNext');

let allNews = [];
let visibleNews = [];
let activeCategory = 'Все';
let currentGallery = [];
let currentIndex = 0;

function formatDate(iso){
  try{
    const d = new Date(iso);
    return d.toLocaleDateString('ru-RU', { year:'numeric', month:'long', day:'numeric' });
  }catch{ return iso }
}

function createCard(item, isFeatured=false){
  const card = document.createElement('article');
  card.className = 'card' + (isFeatured ? ' featured' : '');
  card.setAttribute('tabindex', '0');
  card.addEventListener('click', () => openArticle(item));
  card.addEventListener('keypress', (e) => { if(e.key === 'Enter') openArticle(item) });

  const imageWrap = document.createElement('div');
  imageWrap.className = 'card-image';
  if (Array.isArray(item.images) && item.images.length){
    const img = document.createElement('img');
    img.src = `images/${item.images[0]}`;
    img.alt = item.title;
    img.onerror = () => { imageWrap.classList.add('image-placeholder'); img.remove(); };
    imageWrap.appendChild(img);
  } else {
    imageWrap.classList.add('image-placeholder');
  }

  const body = document.createElement('div');
  body.className = 'card-body';
  body.innerHTML = `
    <div class="card-category">${item.category}</div>
    <h3 class="card-title">${item.title}</h3>
    ${item.subtitle ? `<div class="card-subtitle">${item.subtitle}</div>` : ''}
    <div class="card-meta">${formatDate(item.date)}</div>
  `;

  card.appendChild(imageWrap);
  card.appendChild(body);
  return card;
}

function createInlineAd(){
  const ad = document.createElement('div');
  ad.className = 'ad-inline';
  const link = document.createElement('a');
  link.href = 'https://alfabank.ru/?utm_source=popscope&utm_medium=inline&utm_campaign=ref';
  link.target = '_blank';
  link.rel = 'noopener';
  const img = document.createElement('img');
  img.src = 'images/alpha-inline.png';
  img.alt = 'Реклама Альфа-Банк';
  img.onerror = () => { ad.classList.add('placeholder'); img.remove(); };
  const span = document.createElement('span');
  span.textContent = 'Реклама — Альфа-Банк';
  link.appendChild(img);
  link.appendChild(span);
  ad.appendChild(link);
  return ad;
}

function renderFeed(){
  FEED.innerHTML = '';
  let items = allNews;
  if (activeCategory !== 'Все') items = items.filter(n => n.category === activeCategory);
  visibleNews = items;
  const first = items[0];
  if (first) FEED.appendChild(createCard(first, true));

  const ad = createInlineAd();
  items.slice(1).forEach((item, index) => {
    if (index === 3) FEED.appendChild(ad);
    FEED.appendChild(createCard(item));
  });
}

async function loadNews(){
  // Try server API first (local dev), then static index.json (GitHub Pages)
  const tryFetch = async (url) => {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) return await res.json();
    } catch (_) {}
    return null;
  };

  let data = await tryFetch('api/news');
  if (!data) data = await tryFetch('news/index.json');

  if (Array.isArray(data)) {
    allNews = data;
  } else if (data && Array.isArray(data.items)) {
    allNews = data.items;
  } else {
    allNews = [];
  }
  renderFeed();
}

function setActiveCategory(cat){
  activeCategory = cat;
  document.querySelectorAll('.category-chip').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.category === cat);
  });
  renderFeed();
}

function openArticle(item){
  ARTICLE_CONTAINER.innerHTML = '';

  const header = document.createElement('header');
  const k = document.createElement('div');
  k.className = 'card-category';
  k.textContent = item.category;
  const h1 = document.createElement('h1');
  h1.textContent = item.title;
  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.textContent = `${formatDate(item.date)}`;
  header.appendChild(k); header.appendChild(h1); header.appendChild(meta);

  const content = document.createElement('div');
  content.className = 'content';
  (item.content || []).forEach(p => {
    const el = document.createElement('p'); el.textContent = p; content.appendChild(el);
  });

  const gallery = document.createElement('div');
  gallery.className = 'gallery';
  currentGallery = Array.isArray(item.images) ? item.images : [];
  currentIndex = 0;
  if (currentGallery.length){
    currentGallery.forEach((imgName, idx) => {
      const img = document.createElement('img');
      img.src = `images/${imgName}`;
      img.alt = `${item.title} — фото ${idx+1}`;
      img.onerror = () => { img.replaceWith(document.createElement('div')); };
      img.addEventListener('click', () => openLightbox(idx));
      gallery.appendChild(img);
    });
  }

  ARTICLE_CONTAINER.appendChild(header);
  ARTICLE_CONTAINER.appendChild(content);
  if (currentGallery.length) ARTICLE_CONTAINER.appendChild(gallery);

  ARTICLE_MODAL.setAttribute('aria-hidden', 'false');
}

function closeModal(){
  ARTICLE_MODAL.setAttribute('aria-hidden', 'true');
}

function openLightbox(index){
  currentIndex = index;
  updateLightbox();
  LIGHTBOX.setAttribute('aria-hidden', 'false');
}
function closeLightbox(){
  LIGHTBOX.setAttribute('aria-hidden', 'true');
}
function updateLightbox(){
  const src = currentGallery[currentIndex] ? `images/${currentGallery[currentIndex]}` : '';
  LIGHT_IMAGE.src = src;
}

LIGHT_PREV.addEventListener('click', () => {
  if (!currentGallery.length) return;
  currentIndex = (currentIndex - 1 + currentGallery.length) % currentGallery.length;
  updateLightbox();
});
LIGHT_NEXT.addEventListener('click', () => {
  if (!currentGallery.length) return;
  currentIndex = (currentIndex + 1) % currentGallery.length;
  updateLightbox();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape'){
    if (LIGHTBOX.getAttribute('aria-hidden') === 'false') closeLightbox();
    else if (ARTICLE_MODAL.getAttribute('aria-hidden') === 'false') closeModal();
  }
});

document.querySelectorAll('[data-close]').forEach(el => {
  el.addEventListener('click', () => {
    if (el.closest('.modal')) closeModal();
    if (el.closest('.lightbox')) closeLightbox();
  });
});

Array.from(document.querySelectorAll('.category-chip')).forEach(btn => {
  btn.addEventListener('click', () => setActiveCategory(btn.dataset.category));
});

window.addEventListener('DOMContentLoaded', () => {
  YEAR.textContent = new Date().getFullYear();
  loadNews();
});