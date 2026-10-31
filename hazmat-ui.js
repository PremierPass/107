// Shared accessibility helpers for the hazmat reference pages.
// Makes chart cards keyboard-operable, turns the chart pop-ups into labeled
// dialogs, closes them with Escape, and returns focus to the card that opened them.
(function () {
  var lastOpener = null;

  function modalFor(key) { return document.getElementById('modal-' + key); }

  window.openClassModal = function (key) {
    var m = modalFor(key);
    if (!m) return;
    lastOpener = document.activeElement;
    m.classList.add('open');
    m.removeAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';
    var btn = m.querySelector('.modal-close');
    if (btn) btn.focus();
  };

  window.closeClassModal = function (key) {
    var m = modalFor(key);
    if (!m) return;
    m.classList.remove('open');
    m.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastOpener && lastOpener.focus) lastOpener.focus();
  };

  window.closeModal = function (event, key) {
    if (event.target === modalFor(key)) window.closeClassModal(key);
  };

  function setup() {
    // Cards that open a chart: make them buttons for keyboard and screen reader users.
    document.querySelectorAll('[onclick^="openClassModal"]').forEach(function (card) {
      if (card.tagName === 'BUTTON' || card.tagName === 'A') return;
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      var name = card.querySelector('.hclass-name, .ppe-name, .nfpa-name');
      var badge = card.querySelector('.ppe-badge');
      var label = [badge && badge.textContent, name && name.textContent].filter(Boolean).join(': ');
      if (label) card.setAttribute('aria-label', 'Open reference: ' + label.trim());
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
      });
    });
    // Pop-ups: label them as dialogs.
    document.querySelectorAll('.class-modal').forEach(function (m, i) {
      m.setAttribute('role', 'dialog');
      m.setAttribute('aria-modal', 'true');
      m.setAttribute('aria-hidden', 'true');
      var title = m.querySelector('.modal-header span');
      if (title) {
        if (!title.id) title.id = 'modal-title-' + i;
        m.setAttribute('aria-labelledby', title.id);
      }
      var close = m.querySelector('.modal-close');
      if (close) close.setAttribute('aria-label', 'Close');
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var open = document.querySelector('.class-modal.open');
    if (open) window.closeClassModal(open.id.replace(/^modal-/, ''));
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
  else setup();
})();
