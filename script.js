import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

document.addEventListener('DOMContentLoaded', async () => {
  const SUPABASE_URL = 'https://mehednetacyxzmfpvivz.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_cKMMn9O468LhXJdtaWyDmw_klQW0k-1';
  const ADMIN_EMAILS = [
    'mamurjonqalandarov8@gmail.com',
    'mamurjonqalandarov40@gmail.com'
  ];

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const STORAGE_KEYS = {
    theme: 'pwg-theme',
    edits: 'pwg-edits',
    images: 'pwg-images',
    sections: 'pwg-sections',
    cards: 'pwg-cards',
    cardsData: 'pwg-cards-data',
    customSections: 'pwg-custom-sections'
  };

  const CONTENT_KEYS = ['edits', 'images', 'sections', 'cards', 'cards-data', 'custom-sections'];

  const state = {
    defaults: {
      grids: {}
    },
    activeImage: null,
    activeLinkCardId: null,
    activeGridId: null,
    toastTimer: null,
    authMode: 'signin',
    currentSession: null
  };

  const root = document.documentElement;
  const body = document.body;
  const footer = document.querySelector('.footer');

  const adminLink = document.getElementById('admin-link');
  const adminModal = document.getElementById('admin-modal');
  const adminForm = document.getElementById('admin-form');
  const adminEmail = document.getElementById('admin-email');
  const adminPassword = document.getElementById('admin-password');
  const togglePassword = document.getElementById('toggle-password');
  const adminError = document.getElementById('admin-error');
  const adminBanner = document.getElementById('admin-banner');
  const adminSave = document.getElementById('admin-save');
  const adminSignout = document.getElementById('admin-signout');
  const adminPanel = document.getElementById('admin-panel');
  const adminPanelToggle = document.getElementById('admin-panel-toggle');
  const adminPanelBody = document.getElementById('admin-panel-body');
  const adminSectionsList = document.getElementById('admin-sections-list');
  const adminGridsList = document.getElementById('admin-grids-list');
  const adminReset = document.getElementById('admin-reset');
  const adminToast = document.getElementById('admin-toast');
  const authStatusMessage = document.getElementById('auth-status-message');
  const authTabSignin = document.getElementById('auth-tab-signin');
  const authTabSignup = document.getElementById('auth-tab-signup');
  const authModeCopy = document.getElementById('auth-mode-copy');
  const forgotPassword = document.getElementById('forgot-password');
  const adminSubmit = document.getElementById('admin-submit');

  const imagePopover = document.getElementById('image-popover');
  const imageUrlInput = document.getElementById('image-url-input');
  const imagePopoverError = document.getElementById('image-popover-error');
  const imageApply = document.getElementById('image-apply');
  const imageCancel = document.getElementById('image-cancel');

  const linkPopover = document.getElementById('link-popover');
  const linkUrlInput = document.getElementById('link-url-input');
  const linkPopoverError = document.getElementById('link-popover-error');
  const linkApply = document.getElementById('link-apply');
  const linkCancel = document.getElementById('link-cancel');

  const cardPopover = document.getElementById('card-popover');
  const cardTitleInput = document.getElementById('card-title-input');
  const cardBodyInput = document.getElementById('card-body-input');
  const cardMetaInput = document.getElementById('card-meta-input');
  const cardCtaInput = document.getElementById('card-cta-input');
  const cardHrefInput = document.getElementById('card-href-input');
  const cardPopoverError = document.getElementById('card-popover-error');
  const cardApply = document.getElementById('card-apply');
  const cardCancel = document.getElementById('card-cancel');

  let lastFocused = null;

  const readJSON = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };

  const writeJSON = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  };

  const getStorageKeyForContent = (key) => {
    if (key === 'cards-data') return STORAGE_KEYS.cardsData;
    if (key === 'custom-sections') return STORAGE_KEYS.customSections;
    return STORAGE_KEYS[key];
  };

  const isAllowlistedEmail = (email) => ADMIN_EMAILS.includes((email || '').toLowerCase());
  const isAdmin = () => isAllowlistedEmail(state.currentSession?.user?.email);

  const setAuthStatus = (message) => {
    if (authStatusMessage) authStatusMessage.textContent = message || '';
  };

  const showToast = (message) => {
    if (!adminToast) return;
    adminToast.textContent = message;
    adminToast.hidden = false;
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => {
      adminToast.hidden = true;
    }, 1800);
  };

  const getManagedSections = () => Array.from(document.querySelectorAll('[data-section-id]'));

  const ensureHiddenTag = (section) => {
    let tag = section.querySelector('.hidden-section-tag');
    if (!tag) {
      tag = document.createElement('span');
      tag.className = 'hidden-section-tag';
      tag.textContent = 'Hidden';
      section.appendChild(tag);
    }
    return tag;
  };

  const setTheme = (theme) => {
    root.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEYS.theme, theme);
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
  };

  const applySavedEdits = () => {
    const edits = readJSON(STORAGE_KEYS.edits, {});
    Object.entries(edits).forEach(([id, html]) => {
      const element = document.querySelector(`[data-edit-id="${id}"]`);
      if (element) element.innerHTML = html;
    });
  };

  const applySavedImages = () => {
    const images = readJSON(STORAGE_KEYS.images, {});
    Object.entries(images).forEach(([id, src]) => {
      const image = document.querySelector(`[data-image-id="${id}"]`);
      if (image instanceof HTMLImageElement) {
        image.classList.remove('image-fallback');
        delete image.dataset.fallbackApplied;
        image.src = src;
      }
    });
  };

  const getCardAnchor = (card) => {
    if (!card) return null;
    return card.querySelector('.resource-link') || card.querySelector('.card-footer a') || card.querySelector('a[href]');
  };

  const setCardHref = (card, href) => {
    const anchor = getCardAnchor(card);
    if (!anchor || !href) return;
    anchor.setAttribute('href', href);
    if (!href.startsWith('#')) {
      anchor.setAttribute('target', '_blank');
      anchor.setAttribute('rel', 'noopener noreferrer');
    }
  };

  const getSectionLabel = (section) => section.dataset.sectionLabel || section.id || section.dataset.sectionId;

  const normalizeUrl = (value) => {
    if (!value) return '';
    if (value.startsWith('#')) return value;
    try {
      return new URL(value).toString();
    } catch {
      return '';
    }
  };

  const captureDefaultGrids = () => {
    document.querySelectorAll('.managed-grid').forEach((grid) => {
      const gridId = grid.dataset.gridId;
      if (!gridId || state.defaults.grids[gridId]) return;
      const cards = {};
      const defaultOrder = [];
      grid.querySelectorAll(':scope > [data-card-id]').forEach((card) => {
        const cardId = card.dataset.cardId;
        if (!cardId) return;
        defaultOrder.push(cardId);
        cards[cardId] = {
          html: card.outerHTML,
          kind: card.dataset.cardKind || '',
          label: card.querySelector('h3, h4')?.textContent?.trim() || cardId,
          href: getCardAnchor(card)?.getAttribute('href') || '',
          builtIn: true
        };
      });
      state.defaults.grids[gridId] = {
        defaultOrder,
        cards,
        label: grid.dataset.gridLabel || gridId
      };
    });
  };

  const buildCardControls = (cardId) => {
    const controls = document.createElement('div');
    controls.className = 'card-admin-controls';
    controls.innerHTML = `
      <button type="button" data-card-action="up" data-card-id="${cardId}">↑</button>
      <button type="button" data-card-action="down" data-card-id="${cardId}">↓</button>
      <button type="button" data-card-action="link" data-card-id="${cardId}">Edit link</button>
      <button type="button" data-card-action="delete" data-card-id="${cardId}">Delete</button>
    `;
    return controls;
  };

  const buildAddCardButton = (gridId) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'grid-add-card';
    button.dataset.gridAdd = gridId;
    button.textContent = '+ Add card';
    return button;
  };

  const buildCardFromHTML = (html, cardId, data) => {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html.trim();
    const card = wrapper.firstElementChild;
    if (!card) return null;
    card.dataset.cardId = cardId;
    if (data?.kind) card.dataset.cardKind = data.kind;
    if (data?.href) setCardHref(card, data.href);
    const existingControls = card.querySelector('.card-admin-controls');
    if (existingControls) existingControls.remove();
    card.appendChild(buildCardControls(cardId));
    return card;
  };

  const getCardsData = () => readJSON(STORAGE_KEYS.cardsData, {});
  const getCardsOrder = () => readJSON(STORAGE_KEYS.cards, {});
  const persistCardsData = (value) => writeJSON(STORAGE_KEYS.cardsData, value);
  const persistCardsOrder = (value) => writeJSON(STORAGE_KEYS.cards, value);

  const renderGrid = (gridId) => {
    const grid = document.querySelector(`[data-grid-id="${gridId}"]`);
    const defaults = state.defaults.grids[gridId];
    if (!grid || !defaults) return;

    const cardsData = getCardsData();
    const savedOrderMap = getCardsOrder();
    const cardMap = new Map();

    Object.entries(defaults.cards).forEach(([cardId, data]) => {
      cardMap.set(cardId, { ...data, cardId, gridId });
    });

    Object.entries(cardsData).forEach(([cardId, data]) => {
      if (data.gridId !== gridId) return;
      const previous = cardMap.get(cardId) || {};
      cardMap.set(cardId, { ...previous, ...data, cardId, gridId });
    });

    const orderedIds = [];
    const requestedOrder = Array.isArray(savedOrderMap[gridId]) ? savedOrderMap[gridId] : defaults.defaultOrder;

    requestedOrder.forEach((cardId) => {
      if (cardMap.has(cardId)) orderedIds.push(cardId);
    });

    cardMap.forEach((_, cardId) => {
      if (!orderedIds.includes(cardId)) orderedIds.push(cardId);
    });

    grid.innerHTML = '';

    orderedIds.forEach((cardId) => {
      const data = cardMap.get(cardId);
      if (!data || data.deleted) return;
      const html = data.html || defaults.cards[cardId]?.html;
      const card = buildCardFromHTML(html, cardId, data);
      if (card) grid.appendChild(card);
    });

    grid.appendChild(buildAddCardButton(gridId));
  };

  const applySavedCards = () => {
    Object.keys(state.defaults.grids).forEach((gridId) => renderGrid(gridId));
  };

  const createCustomSectionHTML = (section) => {
    const temp = document.createElement('div');
    temp.innerHTML = section.html.trim();
    const element = temp.firstElementChild;
    if (!element) return '';
    element.dataset.customSection = 'true';
    element.dataset.sectionId = section.id;
    element.dataset.sectionLabel = section.label;
    element.dataset.template = section.template;
    return element.outerHTML;
  };

  const renderCustomSections = () => {
    document.querySelectorAll('[data-custom-section="true"]').forEach((section) => section.remove());
    const customSections = readJSON(STORAGE_KEYS.customSections, []);
    customSections.forEach((section) => {
      if (!footer) return;
      const html = createCustomSectionHTML(section);
      if (!html) return;
      footer.insertAdjacentHTML('beforebegin', html);
    });
  };

  const syncCustomSections = () => {
    const customSections = Array.from(document.querySelectorAll('[data-custom-section="true"]')).map((section) => ({
      id: section.dataset.sectionId,
      template: section.dataset.template || 'custom',
      label: section.dataset.sectionLabel || section.dataset.sectionId,
      html: section.outerHTML
    }));
    writeJSON(STORAGE_KEYS.customSections, customSections);
  };

  const applySectionVisibility = () => {
    const sectionState = readJSON(STORAGE_KEYS.sections, {});
    const admin = isAdmin();
    getManagedSections().forEach((section) => {
      const sectionId = section.dataset.sectionId;
      const hidden = sectionState[sectionId] === 'hidden';
      ensureHiddenTag(section);
      section.classList.remove('section-hidden-admin');
      section.hidden = false;
      if (hidden) {
        if (admin) {
          section.classList.add('section-hidden-admin');
        } else {
          section.hidden = true;
        }
      }
    });
  };

  const collectEdits = () => {
    const edits = {};
    document.querySelectorAll('[data-edit-id]').forEach((element) => {
      const id = element.getAttribute('data-edit-id');
      if (id) edits[id] = element.innerHTML;
    });
    return edits;
  };

  const saveEdits = () => {
    writeJSON(STORAGE_KEYS.edits, collectEdits());
  };

  const collectContentPayload = () => ({
    edits: collectEdits(),
    images: readJSON(STORAGE_KEYS.images, {}),
    sections: readJSON(STORAGE_KEYS.sections, {}),
    cards: readJSON(STORAGE_KEYS.cards, {}),
    'cards-data': readJSON(STORAGE_KEYS.cardsData, {}),
    'custom-sections': readJSON(STORAGE_KEYS.customSections, [])
  });

  const cacheContentValue = (key, value) => {
    const storageKey = getStorageKeyForContent(key);
    if (storageKey) writeJSON(storageKey, value);
  };

  const hydrateFromContent = (content) => {
    CONTENT_KEYS.forEach((key) => {
      const value = content[key];
      if (value !== undefined) {
        cacheContentValue(key, value);
      }
    });
  };

  const fetchRemoteContent = async () => {
    const { data, error } = await supabase
      .from('site_content')
      .select('key, value')
      .in('key', CONTENT_KEYS);
    if (error) throw error;
    const content = {};
    (data || []).forEach((row) => {
      content[row.key] = row.value;
    });
    return content;
  };

  const saveAll = async (options = {}) => {
    saveEdits();
    syncCustomSections();

    const payload = collectContentPayload();
    Object.entries(payload).forEach(([key, value]) => cacheContentValue(key, value));

    if (isAdmin()) {
      const rows = Object.entries(payload).map(([key, value]) => ({
        key,
        value
      }));
      const { error } = await supabase.from('site_content').upsert(rows, { onConflict: 'key' });
      if (error) {
        if (!options.silent) showToast('Failed to save — check connection');
        return false;
      }
      if (!options.silent) showToast('Saved (live for everyone)');
      return true;
    }

    if (!options.silent) showToast('Saved');
    return true;
  };

  const renderAdminPanel = () => {
    if (!adminSectionsList || !adminGridsList) return;

    adminSectionsList.innerHTML = '';
    const sections = readJSON(STORAGE_KEYS.sections, {});

    getManagedSections().forEach((section) => {
      const sectionId = section.dataset.sectionId;
      const label = getSectionLabel(section);
      const row = document.createElement('div');
      row.className = 'admin-list-item';
      row.innerHTML = `
        <div class="admin-list-item-label">
          <span>${label}</span>
          <small>${sectionId}</small>
        </div>
        <div class="admin-switch">
          <label>
            <input type="checkbox" data-section-toggle="${sectionId}" ${sections[sectionId] === 'hidden' ? '' : 'checked'}>
            <span>${sections[sectionId] === 'hidden' ? 'Hidden' : 'Visible'}</span>
          </label>
          ${section.dataset.customSection === 'true' ? `<button type="button" class="admin-secondary-btn" data-delete-section="${sectionId}">Delete</button>` : ''}
        </div>
      `;
      adminSectionsList.appendChild(row);
    });

    adminGridsList.innerHTML = '';
    Object.entries(state.defaults.grids).forEach(([gridId, grid]) => {
      const row = document.createElement('div');
      row.className = 'admin-list-item';
      row.innerHTML = `
        <div class="admin-list-item-label">
          <span>${grid.label}</span>
          <small>${gridId}</small>
        </div>
        <button type="button" class="admin-secondary-btn" data-open-card-popover="${gridId}">+ Add card</button>
      `;
      adminGridsList.appendChild(row);
    });
  };

  const setEditableState = (enabled) => {
    body.classList.toggle('admin-mode', enabled);
    document.querySelectorAll('[data-edit-id]').forEach((node) => {
      if (enabled) {
        node.setAttribute('contenteditable', 'true');
        node.setAttribute('spellcheck', 'true');
      } else {
        node.removeAttribute('contenteditable');
        node.removeAttribute('spellcheck');
      }
    });
    document.querySelectorAll('.managed-image').forEach((image) => {
      image.classList.toggle('editable-image', enabled);
      if (enabled) {
        image.setAttribute('tabindex', '0');
      } else {
        image.removeAttribute('tabindex');
      }
    });
    if (adminBanner) adminBanner.hidden = !enabled;
    if (adminPanel) adminPanel.hidden = !enabled;
    applySectionVisibility();
    renderAdminPanel();
  };

  const openAdminModal = () => {
    if (!adminModal) return;
    lastFocused = document.activeElement;
    adminModal.hidden = false;
    body.style.overflow = 'hidden';
    adminError.textContent = '';
    adminForm.reset();
    if (togglePassword) {
      togglePassword.textContent = 'Show';
      togglePassword.setAttribute('aria-label', 'Show password');
    }
    if (adminPassword) adminPassword.type = 'password';
    adminEmail?.focus();
  };

  const closeAdminModal = () => {
    if (!adminModal) return;
    adminModal.hidden = true;
    body.style.overflow = '';
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  };

  const getFocusable = () => {
    if (!adminModal || adminModal.hidden) return [];
    return Array.from(
      adminModal.querySelectorAll('button, input, [href], textarea, select, [tabindex]:not([tabindex="-1"])')
    ).filter((element) => !element.hasAttribute('disabled'));
  };

  const positionPopover = (popover, anchor) => {
    if (!popover || !anchor) return;
    const rect = anchor.getBoundingClientRect();
    const width = Math.min(360, window.innerWidth - 32);
    let left = rect.left + window.scrollX;
    let top = rect.bottom + window.scrollY + 12;
    if (left + width > window.scrollX + window.innerWidth - 16) {
      left = window.scrollX + window.innerWidth - width - 16;
    }
    if (window.innerWidth < 768) {
      left = window.scrollX + 16;
      top = window.scrollY + window.innerHeight - popover.offsetHeight - 24;
    }
    popover.style.left = `${Math.max(16, left)}px`;
    popover.style.top = `${Math.max(16, top)}px`;
  };

  const closePopovers = () => {
    [imagePopover, linkPopover, cardPopover].forEach((popover) => {
      if (popover) popover.hidden = true;
    });
    state.activeImage = null;
    state.activeLinkCardId = null;
    state.activeGridId = null;
  };

  const validateImageUrl = (url) => new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(true);
    image.onerror = () => resolve(false);
    image.src = url;
  });

  const moveCard = async (cardId, direction) => {
    const card = document.querySelector(`[data-card-id="${cardId}"]`);
    if (!card) return;
    const grid = card.closest('.managed-grid');
    if (!grid) return;
    const gridId = grid.dataset.gridId;
    const orderMap = getCardsOrder();
    const currentOrder = Array.isArray(orderMap[gridId])
      ? [...orderMap[gridId]]
      : [...state.defaults.grids[gridId].defaultOrder];
    const visibleIds = Array.from(grid.querySelectorAll(':scope > [data-card-id]')).map((item) => item.dataset.cardId);
    visibleIds.forEach((id) => {
      if (!currentOrder.includes(id)) currentOrder.push(id);
    });
    const index = currentOrder.indexOf(cardId);
    if (index === -1) return;
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= currentOrder.length) return;
    [currentOrder[index], currentOrder[swapIndex]] = [currentOrder[swapIndex], currentOrder[index]];
    orderMap[gridId] = currentOrder;
    persistCardsOrder(orderMap);
    renderGrid(gridId);
    setEditableState(isAdmin());
    renderAdminPanel();
    await saveAll({ silent: true });
  };

  const deleteCard = async (cardId) => {
    const card = document.querySelector(`[data-card-id="${cardId}"]`);
    if (!card) return;
    const grid = card.closest('.managed-grid');
    if (!grid) return;
    const gridId = grid.dataset.gridId;
    const cardsData = getCardsData();
    cardsData[cardId] = {
      ...(cardsData[cardId] || {}),
      gridId,
      deleted: true
    };
    persistCardsData(cardsData);
    renderGrid(gridId);
    setEditableState(isAdmin());
    renderAdminPanel();
    await saveAll({ silent: true });
  };

  const updateCardLink = async (cardId, href) => {
    const card = document.querySelector(`[data-card-id="${cardId}"]`);
    if (!card) return;
    const grid = card.closest('.managed-grid');
    if (!grid) return;
    const gridId = grid.dataset.gridId;
    const cardsData = getCardsData();
    cardsData[cardId] = {
      ...(cardsData[cardId] || {}),
      gridId,
      href
    };
    persistCardsData(cardsData);
    setCardHref(card, href);
    await saveAll({ silent: true });
  };

  const escapeHTML = (value) => {
    const div = document.createElement('div');
    div.textContent = value;
    return div.innerHTML;
  };

  const buildServiceCardHTML = (cardId, values) => `
    <div class="card service-card fade-in" data-card-id="${cardId}" data-card-kind="service">
      <svg class="service-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2 4 6v6c0 5 3.5 8.8 8 10 4.5-1.2 8-5 8-10V6l-8-4Z"></path><path d="M9.5 11.5 11 13l4-4"></path></svg>
      <h3 data-edit-id="${cardId}-title">${escapeHTML(values.title)}</h3>
      <p data-edit-id="${cardId}-copy">${escapeHTML(values.body)}</p>
      <div class="card-footer">
        <span class="price" data-edit-id="${cardId}-price">${escapeHTML(values.meta)}</span>
        <a href="${escapeHTML(values.href)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm"><span data-edit-id="${cardId}-cta">${escapeHTML(values.cta)}</span></a>
      </div>
    </div>
  `;

  const buildResourceCardHTML = (cardId, values) => `
    <article class="resource-card fade-in" data-card-id="${cardId}" data-card-kind="resource">
      <span class="tag">${escapeHTML(values.meta || 'Guide')}</span>
      <h4 data-edit-id="${cardId}-title">${escapeHTML(values.title)}</h4>
      <p data-edit-id="${cardId}-copy">${escapeHTML(values.body)}</p>
      <a href="${escapeHTML(values.href)}" target="_blank" rel="noopener noreferrer" class="resource-link"><span data-edit-id="${cardId}-cta">${escapeHTML(values.cta)}</span> <span class="arrow">&rarr;</span></a>
    </article>
  `;

  const addCardToGrid = async (gridId, values) => {
    const cardId = `card-${Date.now()}`;
    const kind = gridId === 'services-grid' ? 'service' : 'resource';
    const html = kind === 'service' ? buildServiceCardHTML(cardId, values) : buildResourceCardHTML(cardId, values);
    const cardsData = getCardsData();
    const orderMap = getCardsOrder();
    cardsData[cardId] = {
      gridId,
      kind,
      html,
      href: values.href,
      deleted: false,
      builtIn: false
    };
    persistCardsData(cardsData);
    const currentOrder = Array.isArray(orderMap[gridId]) ? [...orderMap[gridId]] : [...state.defaults.grids[gridId].defaultOrder];
    currentOrder.push(cardId);
    orderMap[gridId] = currentOrder;
    persistCardsOrder(orderMap);
    renderGrid(gridId);
    setEditableState(isAdmin());
    renderAdminPanel();
    await saveAll({ silent: true });
  };

  const createSectionTemplate = (template) => {
    const id = `custom-section-${Date.now()}`;
    if (template === 'text-image') {
      return {
        id,
        template,
        label: 'Custom Text + Image',
        html: `
          <section class="section custom-section" data-custom-section="true" data-section-id="${id}" data-section-label="Custom Text + Image" data-template="${template}">
            <div class="container grid-2">
              <div>
                <h2 data-edit-id="${id}-title">A new section headline</h2>
                <p data-edit-id="${id}-copy">Add your own explanation here. This is saved in this browser only.</p>
              </div>
              <figure class="about-photo">
                <img class="managed-image" data-image-id="${id}-image" src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1200&q=80&auto=format&fit=crop" data-backup-src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&q=80&auto=format&fit=crop" onerror="window.pwgImageError && window.pwgImageError(this)" alt="Books and notes on a study desk" loading="lazy" decoding="async" width="1200" height="800">
              </figure>
            </div>
          </section>
        `
      };
    }
    if (template === 'heading-paragraph') {
      return {
        id,
        template,
        label: 'Custom Text Section',
        html: `
          <section class="section custom-section" data-custom-section="true" data-section-id="${id}" data-section-label="Custom Text Section" data-template="${template}">
            <div class="container">
              <h2 data-edit-id="${id}-title">New section title</h2>
              <p class="lead" data-edit-id="${id}-copy">Write your section copy here. It stays on this device unless you add a backend.</p>
            </div>
          </section>
        `
      };
    }
    if (template === 'card-grid') {
      return {
        id,
        template,
        label: 'Custom Card Grid',
        html: `
          <section class="section custom-section section-light" data-custom-section="true" data-section-id="${id}" data-section-label="Custom Card Grid" data-template="${template}">
            <div class="container">
              <h2 data-edit-id="${id}-title">New card grid</h2>
              <div class="custom-card-grid">
                <div class="card"><h3 data-edit-id="${id}-card-1-title">Card one</h3><p data-edit-id="${id}-card-1-copy">Add your first point here.</p></div>
                <div class="card"><h3 data-edit-id="${id}-card-2-title">Card two</h3><p data-edit-id="${id}-card-2-copy">Add your second point here.</p></div>
                <div class="card"><h3 data-edit-id="${id}-card-3-title">Card three</h3><p data-edit-id="${id}-card-3-copy">Add your third point here.</p></div>
              </div>
            </div>
          </section>
        `
      };
    }
    return {
      id,
      template,
      label: 'Custom CTA Band',
      html: `
        <section class="section section-dark custom-section" data-custom-section="true" data-section-id="${id}" data-section-label="Custom CTA Band" data-template="${template}">
          <div class="container text-center">
            <h2 data-edit-id="${id}-title">A direct next step</h2>
            <p data-edit-id="${id}-copy">Use this band for one clear instruction or offer.</p>
            <a href="https://t.me/pathwayglobal_admin" target="_blank" rel="noopener noreferrer" class="btn btn-primary"><span data-edit-id="${id}-cta">Contact on Telegram</span></a>
          </div>
        </section>
      `
    };
  };

  const addCustomSection = async (template) => {
    const customSections = readJSON(STORAGE_KEYS.customSections, []);
    customSections.push(createSectionTemplate(template));
    writeJSON(STORAGE_KEYS.customSections, customSections);
    renderCustomSections();
    applySectionVisibility();
    setEditableState(isAdmin());
    renderAdminPanel();
    await saveAll({ silent: true });
  };

  const deleteCustomSection = async (sectionId) => {
    const section = document.querySelector(`[data-section-id="${sectionId}"]`);
    if (section) section.remove();
    const customSections = readJSON(STORAGE_KEYS.customSections, []).filter((item) => item.id !== sectionId);
    writeJSON(STORAGE_KEYS.customSections, customSections);
    const sectionState = readJSON(STORAGE_KEYS.sections, {});
    delete sectionState[sectionId];
    writeJSON(STORAGE_KEYS.sections, sectionState);
    renderAdminPanel();
    await saveAll({ silent: true });
  };

  const updateSectionVisibility = async (sectionId, visible) => {
    const sectionState = readJSON(STORAGE_KEYS.sections, {});
    sectionState[sectionId] = visible ? 'visible' : 'hidden';
    writeJSON(STORAGE_KEYS.sections, sectionState);
    applySectionVisibility();
    renderAdminPanel();
    await saveAll({ silent: true });
  };

  const openImagePopover = (image) => {
    if (!imagePopover || !imageUrlInput || !imagePopoverError) return;
    state.activeImage = image;
    imagePopover.hidden = false;
    imagePopoverError.textContent = '';
    imageUrlInput.value = image.getAttribute('src') || '';
    positionPopover(imagePopover, image);
    imageUrlInput.focus();
  };

  const openLinkPopover = (cardId, anchorElement) => {
    if (!linkPopover || !linkUrlInput || !linkPopoverError) return;
    state.activeLinkCardId = cardId;
    linkPopover.hidden = false;
    linkPopoverError.textContent = '';
    const card = document.querySelector(`[data-card-id="${cardId}"]`);
    linkUrlInput.value = getCardAnchor(card)?.getAttribute('href') || '';
    positionPopover(linkPopover, anchorElement);
    linkUrlInput.focus();
  };

  const openCardPopover = (gridId, anchorElement) => {
    if (!cardPopover) return;
    state.activeGridId = gridId;
    cardPopover.hidden = false;
    cardPopoverError.textContent = '';
    cardTitleInput.value = '';
    cardBodyInput.value = '';
    cardMetaInput.value = gridId === 'services-grid' ? 'from $99' : 'Guide';
    cardCtaInput.value = gridId === 'services-grid' ? 'Book now' : 'Read more';
    cardHrefInput.value = 'https://t.me/pathwayglobal_admin';
    positionPopover(cardPopover, anchorElement);
    cardTitleInput.focus();
  };

  const initializeFadeObserver = () => {
    const fadeElements = document.querySelectorAll('.fade-in');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReducedMotion && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, {
        root: null,
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      });

      fadeElements.forEach((element) => {
        element.classList.remove('visible');
        observer.observe(element);
      });
    } else {
      fadeElements.forEach((element) => element.classList.add('visible'));
    }
  };

  const applyAllFromStorage = () => {
    applySavedEdits();
    applySavedImages();
    applySavedCards();
    renderCustomSections();
    applySectionVisibility();
    initializeFadeObserver();
  };

  const syncFromSupabase = async () => {
    try {
      const remoteContent = await fetchRemoteContent();
      hydrateFromContent(remoteContent);
    } catch {
    }
    applyAllFromStorage();
  };

  const setAuthMode = (mode) => {
    state.authMode = mode;
    const signInActive = mode === 'signin';
    authTabSignin?.classList.toggle('is-active', signInActive);
    authTabSignin?.setAttribute('aria-selected', signInActive ? 'true' : 'false');
    authTabSignup?.classList.toggle('is-active', !signInActive);
    authTabSignup?.setAttribute('aria-selected', !signInActive ? 'true' : 'false');
    if (adminSubmit) adminSubmit.textContent = signInActive ? 'Sign in' : 'Sign up';
    if (authModeCopy) {
      authModeCopy.textContent = signInActive
        ? 'Use your admin email and password to sign in.'
        : 'Create an account, verify your email, then sign in.';
    }
    adminError.textContent = '';
  };

  const handleSession = async (session) => {
    state.currentSession = session;
    if (session?.user?.email && isAllowlistedEmail(session.user.email)) {
      setEditableState(true);
      setAuthStatus('');
    } else {
      setEditableState(false);
      if (session?.user?.email) {
        setAuthStatus("You're signed in, but admin editing is restricted.");
      } else {
        setAuthStatus('');
      }
    }
    await syncFromSupabase();
  };

  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      setTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  captureDefaultGrids();
  applyAllFromStorage();

  if (adminLink) adminLink.addEventListener('click', openAdminModal);
  authTabSignin?.addEventListener('click', () => setAuthMode('signin'));
  authTabSignup?.addEventListener('click', () => setAuthMode('signup'));

  if (togglePassword) {
    togglePassword.addEventListener('click', () => {
      const showing = adminPassword?.type === 'text';
      if (adminPassword) adminPassword.type = showing ? 'password' : 'text';
      togglePassword.textContent = showing ? 'Show' : 'Hide';
      togglePassword.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
    });
  }

  forgotPassword?.addEventListener('click', async () => {
    const emailValue = adminEmail?.value.trim() || '';
    if (!emailValue) {
      adminError.textContent = 'Enter your email first.';
      return;
    }
    const redirectTo = `${window.location.origin}${window.location.pathname}`;
    const { error } = await supabase.auth.resetPasswordForEmail(emailValue, { redirectTo });
    adminError.textContent = error ? error.message : 'Password reset email sent.';
  });

  if (adminForm) {
    adminForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const emailValue = adminEmail?.value.trim() || '';
      const passwordValue = adminPassword?.value || '';
      if (!emailValue || !passwordValue) {
        adminError.textContent = 'Please enter email and password.';
        return;
      }

      if (state.authMode === 'signup') {
        const redirectUrl = `${window.location.origin}${window.location.pathname}`;
        const { error } = await supabase.auth.signUp({
          email: emailValue,
          password: passwordValue,
          options: {
            emailRedirectTo: redirectUrl
          }
        });
        adminError.textContent = error ? error.message : 'Check your email to verify, then sign in.';
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailValue,
        password: passwordValue
      });

      if (error) {
        adminError.textContent = error.message;
        return;
      }

      closeAdminModal();
      await handleSession(data.session);
    });
  }

  if (adminSave) {
    adminSave.addEventListener('click', async () => {
      await saveAll();
    });
  }

  if (adminSignout) {
    adminSignout.addEventListener('click', async () => {
      await supabase.auth.signOut();
      closePopovers();
    });
  }

  if (adminModal) {
    adminModal.addEventListener('click', (event) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.dataset.closeAdminModal === 'true') {
        closeAdminModal();
      }
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (adminModal && !adminModal.hidden) closeAdminModal();
      closePopovers();
    }
    if (event.key === 'Tab' && adminModal && !adminModal.hidden) {
      const focusable = getFocusable();
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  if (adminPanelToggle && adminPanel) {
    adminPanelToggle.addEventListener('click', () => {
      const collapsed = adminPanel.classList.toggle('is-collapsed');
      adminPanelToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      if (!collapsed && adminPanelBody) adminPanelBody.scrollTop = 0;
    });
  }

  if (adminReset) {
    adminReset.addEventListener('click', async () => {
      const confirmed = window.confirm('This will remove all edits live on the public site. Continue?');
      if (!confirmed) return;
      if (isAdmin()) {
        const { error } = await supabase.from('site_content').delete().in('key', CONTENT_KEYS);
        if (error) {
          showToast('Failed to save — check connection');
          return;
        }
      }
      Object.values(STORAGE_KEYS).forEach((key) => {
        if (key !== STORAGE_KEYS.theme) localStorage.removeItem(key);
      });
      closePopovers();
      window.location.reload();
    });
  }

  if (imageApply) {
    imageApply.addEventListener('click', async () => {
      if (!(state.activeImage instanceof HTMLImageElement)) return;
      const normalized = normalizeUrl(imageUrlInput?.value.trim() || '');
      if (!normalized) {
        imagePopoverError.textContent = 'Invalid image URL';
        return;
      }
      const valid = await validateImageUrl(normalized);
      if (!valid) {
        imagePopoverError.textContent = 'Invalid image URL';
        return;
      }
      const images = readJSON(STORAGE_KEYS.images, {});
      const imageId = state.activeImage.dataset.imageId;
      if (!imageId) return;
      images[imageId] = normalized;
      writeJSON(STORAGE_KEYS.images, images);
      state.activeImage.classList.remove('image-fallback');
      delete state.activeImage.dataset.fallbackApplied;
      state.activeImage.src = normalized;
      closePopovers();
      await saveAll({ silent: true });
      showToast('Image updated');
    });
  }

  imageCancel?.addEventListener('click', closePopovers);

  if (linkApply) {
    linkApply.addEventListener('click', async () => {
      if (!state.activeLinkCardId) return;
      const normalized = normalizeUrl(linkUrlInput?.value.trim() || '');
      if (!normalized) {
        linkPopoverError.textContent = 'Invalid link URL';
        return;
      }
      await updateCardLink(state.activeLinkCardId, normalized);
      closePopovers();
      showToast('Link updated');
    });
  }

  linkCancel?.addEventListener('click', closePopovers);

  if (cardApply) {
    cardApply.addEventListener('click', async () => {
      if (!state.activeGridId) return;
      const title = cardTitleInput?.value.trim() || '';
      const bodyValue = cardBodyInput?.value.trim() || '';
      const meta = cardMetaInput?.value.trim() || '';
      const cta = cardCtaInput?.value.trim() || 'Read more';
      const href = normalizeUrl(cardHrefInput?.value.trim() || '');
      if (!title || !bodyValue || !href) {
        cardPopoverError.textContent = 'Please fill in headline, body, and a valid URL.';
        return;
      }
      await addCardToGrid(state.activeGridId, {
        title,
        body: bodyValue,
        meta,
        cta,
        href
      });
      closePopovers();
      showToast('Card added');
    });
  }

  cardCancel?.addEventListener('click', closePopovers);

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (isAdmin() && target.closest('.managed-image')) {
      const image = target.closest('.managed-image');
      if (image instanceof HTMLImageElement) {
        event.preventDefault();
        openImagePopover(image);
        return;
      }
    }

    const sectionToggle = target.closest('[data-section-toggle]');
    if (sectionToggle instanceof HTMLInputElement) {
      updateSectionVisibility(sectionToggle.dataset.sectionToggle, sectionToggle.checked);
      return;
    }

    const deleteSectionButton = target.closest('[data-delete-section]');
    if (deleteSectionButton instanceof HTMLElement) {
      deleteCustomSection(deleteSectionButton.dataset.deleteSection);
      showToast('Section deleted');
      return;
    }

    const addSectionButton = target.closest('[data-add-section-template]');
    if (addSectionButton instanceof HTMLElement) {
      addCustomSection(addSectionButton.dataset.addSectionTemplate);
      showToast('Section added');
      return;
    }

    const gridButton = target.closest('[data-open-card-popover], [data-grid-add]');
    if (gridButton instanceof HTMLElement) {
      const gridId = gridButton.dataset.openCardPopover || gridButton.dataset.gridAdd;
      if (gridId) openCardPopover(gridId, gridButton);
      return;
    }

    const cardActionButton = target.closest('[data-card-action]');
    if (cardActionButton instanceof HTMLElement) {
      const cardId = cardActionButton.dataset.cardId;
      const action = cardActionButton.dataset.cardAction;
      if (!cardId || !action) return;
      if (action === 'up' || action === 'down') {
        moveCard(cardId, action);
      } else if (action === 'delete') {
        deleteCard(cardId);
      } else if (action === 'link') {
        openLinkPopover(cardId, cardActionButton);
      }
      return;
    }

    if (
      !target.closest('.editor-popover') &&
      !target.closest('.managed-image') &&
      !target.closest('[data-open-card-popover]') &&
      !target.closest('[data-grid-add]') &&
      !target.closest('[data-card-action]')
    ) {
      closePopovers();
    }
  });

  document.addEventListener('focusout', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.matches('[contenteditable="true"]')) {
      window.setTimeout(() => {
        saveAll({ silent: true });
      }, 0);
    }
  });

  const menuToggle = document.querySelector('.menu-toggle');
  const navbar = document.querySelector('.navbar');
  const navLinks = document.querySelectorAll('.nav-links a');

  if (menuToggle && navbar) {
    menuToggle.addEventListener('click', () => {
      navbar.classList.toggle('nav-active');
      body.style.overflow = navbar.classList.contains('nav-active') ? 'hidden' : '';
    });
  }

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      navbar?.classList.remove('nav-active');
      body.style.overflow = '';
    });
  });

  supabase.channel('site-content-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'site_content' }, async () => {
      await syncFromSupabase();
    })
    .subscribe();

  supabase.auth.onAuthStateChange((_event, session) => {
    handleSession(session);
  });

  setAuthMode('signin');
  const { data: sessionData } = await supabase.auth.getSession();
  await handleSession(sessionData.session);
  renderAdminPanel();
});