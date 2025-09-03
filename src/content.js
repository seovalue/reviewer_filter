(() => {
  const STATE = {
    currentUser: '__ALL__',
    usernames: [],
    isInteracting: false,
  };

  const SELECT_ID = 'rf-select';
  const BOX_ID = 'rf-filter-box';
  const CONTAINER_ID = 'rf-container';
  const ALL_VALUE = '__ALL__';
  let observer = null;

  // Simple debounce
  const debounce = (fn, wait = 200) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  };

  const arraysEqual = (a, b) => {
    if (a === b) return true;
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  };

  function isPRPage() {
    return /\/pull\//.test(location.pathname);
  }

  function getDiscussionRoot() {
    // Prefer PR conversation bucket, fallback to files tab or repo content
    return (
      document.querySelector('#discussion_bucket') ||
      document.querySelector('#files') ||
      document.querySelector('#diffs') ||
      document.querySelector('#repo-content-pjax-container') ||
      document.body
    );
  }

  function ensureUI() {
    if (document.getElementById(BOX_ID)) return;

    const box = document.createElement('div');
    box.id = BOX_ID;

    const label = document.createElement('label');
    label.setAttribute('for', SELECT_ID);
    label.textContent = 'Filter reviews:';

    const select = document.createElement('select');
    select.id = SELECT_ID;
    select.innerHTML = '';

    const allOpt = document.createElement('option');
    allOpt.value = ALL_VALUE;
    allOpt.textContent = 'All reviewers';
    select.appendChild(allOpt);

    select.addEventListener('focus', () => {
      STATE.isInteracting = true;
    });
    select.addEventListener('pointerdown', () => {
      STATE.isInteracting = true;
    });
    select.addEventListener('change', () => {
      STATE.currentUser = select.value;
      applyFilter(STATE.currentUser);
      // keep interacting until blur closes the native menu
    });
    select.addEventListener('blur', () => {
      STATE.isInteracting = false;
      // resume and refresh once after interaction ends
      refresh();
    });

    box.appendChild(label);
    box.appendChild(select);

    document.body.appendChild(box);
  }

  function collectUsernames() {
    // Focus on conversation comments that have authors
    const root = getDiscussionRoot();
    const nodes = root.querySelectorAll(
      '.timeline-comment-header-text .author, .js-comment .author, .review-comment .author'
    );
    const set = new Set();
    nodes.forEach((a) => {
      const name = (a.textContent || '').trim();
      if (name) set.add(name);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  function dropdownIsActive() {
    const select = document.getElementById(SELECT_ID);
    return STATE.isInteracting || (!!select && document.activeElement === select);
  }

  function updateSelectOptions(usernames) {
    const select = document.getElementById(SELECT_ID);
    if (!select) return;

    // Only rebuild if list actually changed and dropdown isn't in use
    if (dropdownIsActive()) return; // avoid flicker while user interacts
    if (arraysEqual(usernames, STATE.usernames)) return;

    const prev = select.value || STATE.currentUser || ALL_VALUE;

    // Preserve first option (All reviewers)
    select.innerHTML = '';
    const allOpt = document.createElement('option');
    allOpt.value = ALL_VALUE;
    allOpt.textContent = 'All reviewers';
    select.appendChild(allOpt);

    usernames.forEach((u) => {
      const opt = document.createElement('option');
      opt.value = u;
      opt.textContent = u;
      select.appendChild(opt);
    });

    // Restore previous selection if still valid
    if (prev !== ALL_VALUE && usernames.includes(prev)) {
      select.value = prev;
      STATE.currentUser = prev;
    } else {
      select.value = ALL_VALUE;
      STATE.currentUser = ALL_VALUE;
    }

    STATE.usernames = usernames;
  }

  function getCommentContainers() {
    const root = getDiscussionRoot();
    const containers = new Set();

    // Conversation tab: timeline items that have an author (actual comments)
    const timelineItems = Array.from(root.querySelectorAll('.js-timeline-item'));
    timelineItems.forEach((el) => {
      if (el.querySelector('a.author')) containers.add(el);
    });

    // Files changed tab: inline review threads / comments containers
    const inlineThreads = root.querySelectorAll('.js-inline-comments-container, .review-thread, .js-resolvable-thread-toggler-container');
    inlineThreads.forEach((el) => containers.add(el));

    return Array.from(containers);
  }

  // Return elements that represent a single visible comment block
  function getCommentBlocks() {
    const root = getDiscussionRoot();
    const blocks = new Set();

    // Generic GitHub comment blocks often carry one of these classes
    // Use multiple selectors to be resilient to slight DOM changes
    const nodes = root.querySelectorAll(
      '.js-comment, .review-comment, .timeline-comment, .js-inline-comment, .js-resolvable-thread-comment'
    );
    nodes.forEach((el) => {
      // Heuristic: ensure it actually has a comment author header
      if (el.querySelector('.timeline-comment-header-text a.author, header a.author, a.author')) {
        blocks.add(el);
      }
    });

    return Array.from(blocks);
  }

  function getBlockAuthor(block) {
    const a = block.querySelector('.timeline-comment-header-text a.author, header a.author, a.author');
    return a ? (a.textContent || '').trim() : '';
  }

  // Heuristic: PR description is the first timeline item with a comment block
  function getPRDescriptionContainers() {
    const root = getDiscussionRoot();
    const items = Array.from(root.querySelectorAll('.js-timeline-item'));
    for (const el of items) {
      if (el.querySelector('.timeline-comment, .js-comment, .review-comment')) {
        return [el];
      }
    }
    return [];
  }

  function containerHasAuthor(container, username) {
    // Match by exact author text; robust and simple
    const authors = container.querySelectorAll('a.author');
    for (const a of authors) {
      if ((a.textContent || '').trim() === username) return true;
    }
    return false;
  }

  function applyFilter(username) {
    const containers = getCommentContainers();
    const blocks = getCommentBlocks();
    const prDescContainers = getPRDescriptionContainers();

    if (username === ALL_VALUE) {
      // Show everything
      blocks.forEach((b) => b.classList.remove('rf-hidden'));
      containers.forEach((c) => c.classList.remove('rf-hidden'));
      return;
    }

    // Hide/show individual comment blocks by exact author match
    blocks.forEach((b) => {
      const author = getBlockAuthor(b);
      if (author === username) {
        b.classList.remove('rf-hidden');
      } else {
        b.classList.add('rf-hidden');
      }
    });

    // Then hide any containers that no longer contain a visible comment block
    containers.forEach((c) => {
      const visibleChild = c.querySelector(
        '.js-comment:not(.rf-hidden), .review-comment:not(.rf-hidden), .timeline-comment:not(.rf-hidden), .js-inline-comment:not(.rf-hidden), .js-resolvable-thread-comment:not(.rf-hidden)'
      );
      if (visibleChild) {
        c.classList.remove('rf-hidden');
      } else {
        c.classList.add('rf-hidden');
      }
    });

    // Always keep PR description visible (container and its blocks)
    prDescContainers.forEach((c) => {
      c.classList.remove('rf-hidden');
      const descBlocks = c.querySelectorAll(
        '.js-comment, .review-comment, .timeline-comment, .js-inline-comment, .js-resolvable-thread-comment'
      );
      descBlocks.forEach((b) => b.classList.remove('rf-hidden'));
    });
  }

  const refresh = debounce(() => {
    if (!isPRPage()) return;
    if (dropdownIsActive()) return; // pause updates during interaction
    ensureUI();
    const users = collectUsernames();
    updateSelectOptions(users);
    applyFilter(STATE.currentUser);
  }, 200);

  function startObserver() {
    if (observer) observer.disconnect();
    const root = getDiscussionRoot();
    if (!root) return;
    observer = new MutationObserver(() => {
      if (dropdownIsActive()) return; // avoid flicker while menu is open
      refresh();
    });
    observer.observe(root, { subtree: true, childList: true });
  }

  function init() {
    if (!isPRPage()) return;
    ensureUI();
    startObserver();
    refresh();

    // PJAX navigation: reattach observer and refresh
    document.addEventListener('pjax:end', () => {
      startObserver();
      refresh();
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
