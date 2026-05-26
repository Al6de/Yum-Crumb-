// === Yum&Crumb — script.js ===

// ─── Navigation ───────────────────────────────────────────────────────────────
var interests = [];

function navigateTo(pageId) {
  ['home', 'catalog', 'contact'].forEach(function(id) {
    var el = document.getElementById('page-' + id);
    if (el) el.style.display = id === pageId ? 'block' : 'none';
  });
  document.querySelectorAll('.nav-link').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.nav === pageId);
  });
  window.scrollTo({ top: 0, behavior: 'instant' });
  if (pageId === 'contact') renderInterests();
}

document.addEventListener('click', function(e) {
  var target = e.target.closest('[data-nav]');
  if (target) { e.preventDefault(); navigateTo(target.dataset.nav); }
});

// ─── Ribbon ───────────────────────────────────────────────────────────────────
var ribbonItems = [
  'Number cakes sur mesure', 'Sur commande uniquement', 'Livraison à Libourne',
  'Click & collect', 'Fait maison', 'Cookies servis tièdes',
  'Mille-feuille à la commande', 'Galette des Rois en janvier'
];
var ribbonTrack = document.getElementById('ribbon-track');
if (ribbonTrack) {
  var doubled = ribbonItems.concat(ribbonItems);
  ribbonTrack.innerHTML = doubled.map(function(t) { return '<span>' + t + '</span>'; }).join('');
}

// ─── Catalog filter ───────────────────────────────────────────────────────────
document.querySelectorAll('[data-filter]').forEach(function(chip) {
  chip.addEventListener('click', function() {
    document.querySelectorAll('[data-filter]').forEach(function(c) { c.classList.remove('active'); });
    chip.classList.add('active');
    var filter = chip.dataset.filter;
    document.querySelectorAll('.cat-card').forEach(function(card) {
      card.style.display = (filter === 'all' || card.dataset.cat === filter) ? '' : 'none';
    });
  });
});

// ─── Interests ────────────────────────────────────────────────────────────────
document.addEventListener('click', function(e) {
  var btn = e.target.closest('[data-iid]');
  if (!btn) return;
  var id = btn.dataset.iid, name = btn.dataset.iname, meta = btn.dataset.imeta;
  if (!interests.some(function(i) { return i.id === id; })) {
    interests.push({ id: id, name: name, meta: meta });
  }
  navigateTo('contact');
});

document.addEventListener('click', function(e) {
  var btn = e.target.closest('[data-remove]');
  if (!btn) return;
  interests = interests.filter(function(i) { return i.id !== btn.dataset.remove; });
  renderInterests();
});

function renderInterests() {
  var box = document.getElementById('interests-box');
  var list = document.getElementById('interests-list');
  var count = document.getElementById('interests-count');
  if (!box) return;
  if (interests.length === 0) { box.style.display = 'none'; return; }
  box.style.display = '';
  count.textContent = interests.length + ' pièce' + (interests.length > 1 ? 's' : '');
  list.innerHTML = interests.map(function(o) {
    return '<div class="order-line">' +
      '<span>' + o.name + '</span>' +
      '<span class="line-meta">' + (o.meta || '') + '</span>' +
      '<button type="button" class="remove-x" data-remove="' + o.id + '" title="Retirer">×</button>' +
      '</div>';
  }).join('');
}

// ─── Delivery address toggle ──────────────────────────────────────────────────
var deliverySelect = document.getElementById('delivery-select');
var addressField = document.getElementById('f-address');
if (deliverySelect && addressField) {
  deliverySelect.addEventListener('change', function() {
    addressField.style.display = this.value === 'delivery' ? '' : 'none';
  });
}

// ─── Form validation & submit ─────────────────────────────────────────────────
// ─── Formspree ────────────────────────────────────────────────────────────────
// ETAPES pour recevoir les emails sur Mlegal33@icloud.com :
//   1. Va sur https://formspree.io et cree un compte avec Mlegal33@icloud.com
//   2. Clique "New Form", nomme-le "YumCrumb Devis"
//   3. Copie l'identifiant (ex: xpzgkpqr) et remplace FORMSPREE_ID ci-dessous
var FORMSPREE_ID = 'xpqnozlz'; // <-- remplace ici
var devisForm = document.getElementById('devis-form');
if (devisForm) {
  devisForm.addEventListener('submit', function(e) {
    e.preventDefault();
    var data = new FormData(this);
    var valid = true;

    function check(fieldId, name, test, msg) {
      var field = document.getElementById(fieldId);
      if (!field) return;
      var val = (data.get(name) || '').trim();
      var errEl = field.querySelector('.err-msg');
      var hintEl = field.querySelector('.hint');
      if (!test(val)) {
        field.classList.add('err');
        if (!errEl) {
          errEl = document.createElement('span');
          errEl.className = 'err-msg';
          if (hintEl) field.insertBefore(errEl, hintEl); else field.appendChild(errEl);
        }
        errEl.textContent = msg;
        valid = false;
      } else {
        field.classList.remove('err');
        if (errEl) errEl.remove();
      }
    }

    check('f-firstName', 'firstName', function(v) { return v.length > 0; }, 'Requis');
    check('f-lastName',  'lastName',  function(v) { return v.length > 0; }, 'Requis');
    check('f-email',     'email',     function(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }, 'Email invalide');
    check('f-phone',     'phone',     function(v) { return v.length > 0; }, 'Requis');
    check('f-date',      'date',      function(v) {
      if (!v) return false;
      var d = new Date(v), min = new Date();
      min.setDate(min.getDate() + 2);
      return d >= min;
    }, 'Délai minimum 48h');
    check('f-servings', 'servings', function(v) { return v.length > 0; }, 'Indiquez un nombre approximatif');
    if (data.get('delivery') === 'delivery') {
      check('f-address', 'address', function(v) { return v.length > 0; }, 'Adresse requise pour la livraison');
    }
    if (interests.length === 0) {
      check('f-message', 'message', function(v) { return v.length > 0; }, 'Décrivez votre demande ou choisissez une création au catalogue');
    }

    if (!valid) return;

    var dateVal = data.get('date');
    var deliveryVal = data.get('delivery');
    var deliveryLbl = deliveryVal === 'delivery' ? 'Livraison a Libourne' : deliveryVal === 'collect' ? 'Click & collect' : 'Pas encore decide';
    var dateFr = new Date(dateVal).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Champs supplementaires visibles dans l'email de Martin
    data.set('_replyto', data.get('email'));
    data.set('_subject', 'Nouveau devis YumCrumb - ' + data.get('firstName') + ' ' + data.get('lastName'));
    data.set('date_souhaitee', dateFr);
    data.set('mode_recuperation', deliveryLbl);
    if (interests.length > 0) {
      data.set('creations_souhaitees', interests.map(function(i) { return i.name; }).join(', '));
    }

    var submitBtn = devisForm.querySelector('[type="submit"]');
    var originalHTML = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Envoi en cours...';

    fetch('https://formspree.io/f/' + FORMSPREE_ID, {
      method: 'POST',
      body: data,
      headers: { 'Accept': 'application/json' }
    })
    .then(function(res) {
      if (res.ok) {
        var ref = 'YC-' + Math.floor(100000 + Math.random() * 900000);
        document.getElementById('form-wrap').innerHTML =
          '<div class="form-step">Demande reçue</div>' +
          '<h2 class="form-title">Merci, votre demande est partie !</h2>' +
          '<div class="success-card">' +
            '<div class="seal">&#x2756;</div>' +
            '<div>' +
              '<h3>Réponse sous 24 heures.</h3>' +
              '<p>Martin reviendra vers vous par email avec un devis personnalisé pour le <strong>' + dateFr + '</strong> (' + deliveryLbl + ').</p>' +
              '<p>Pour toute question urgente : <strong>07 66 01 86 41</strong>.</p>' +
              '<div class="ref">Référence · ' + ref + '</div>' +
            '</div>' +
          '</div>';
        interests = [];
      } else {
        return res.json().then(function(j) { throw new Error(j.error || 'Erreur'); });
      }
    })
    .catch(function() {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHTML;
      var box = devisForm.querySelector('.send-error');
      if (!box) {
        box = document.createElement('p');
        box.className = 'send-error';
        box.style.cssText = 'color:oklch(0.55 0.18 25);font-size:13px;margin:12px 0 0;font-family:var(--font-mono)';
        devisForm.querySelector('.submit-row').before(box);
      }
      box.textContent = FORMSPREE_ID === 'FORMSPREE_ID'
        ? 'Identifiant Formspree manquant — lis le commentaire dans script.js.'
        : 'Envoi impossible. Reessaie ou contacte Martin directement au 07 66 01 86 41.';
    });
  });
}

// ─── Tweaks panel ─────────────────────────────────────────────────────────────
var PALETTES = {
  honey:  { label: 'Crème & Miel',   swatches: ['#F4ECD8','#1F1B16','#F2B83C','#C67A1F'], vars: { '--cream': 'oklch(0.95 0.022 80)', '--cream-soft': 'oklch(0.92 0.028 75)', '--paper': 'oklch(0.97 0.014 85)', '--ink': 'oklch(0.18 0.025 50)', '--ink-soft': 'oklch(0.36 0.03 55)', '--honey': 'oklch(0.80 0.16 85)', '--honey-deep': 'oklch(0.68 0.18 75)', '--line': 'oklch(0.84 0.025 70)' } },
  butter: { label: 'Beurre & Noir',        swatches: ['#F8F0D8','#1A1814','#F5CE4A','#DD9B1A'], vars: { '--cream': 'oklch(0.97 0.028 95)', '--cream-soft': 'oklch(0.94 0.034 95)', '--paper': 'oklch(0.98 0.018 95)', '--ink': 'oklch(0.15 0.02 60)', '--ink-soft': 'oklch(0.34 0.025 60)', '--honey': 'oklch(0.86 0.15 95)', '--honey-deep': 'oklch(0.72 0.17 90)', '--line': 'oklch(0.86 0.03 90)' } },
  ember:  { label: 'Braise',               swatches: ['#F0E5D6','#241A14','#E4884A','#C45A1A'], vars: { '--cream': 'oklch(0.94 0.018 50)', '--cream-soft': 'oklch(0.91 0.025 45)', '--paper': 'oklch(0.96 0.014 55)', '--ink': 'oklch(0.20 0.04 30)', '--ink-soft': 'oklch(0.38 0.05 30)', '--honey': 'oklch(0.72 0.18 50)', '--honey-deep': 'oklch(0.58 0.20 40)', '--line': 'oklch(0.83 0.03 50)' } },
  matcha: { label: 'Matcha',               swatches: ['#EEEFE0','#1C261B','#F2B83C','#7A8A4C'], vars: { '--cream': 'oklch(0.95 0.022 105)', '--cream-soft': 'oklch(0.91 0.028 110)', '--paper': 'oklch(0.97 0.016 105)', '--ink': 'oklch(0.22 0.05 145)', '--ink-soft': 'oklch(0.40 0.05 140)', '--honey': 'oklch(0.80 0.16 85)', '--honey-deep': 'oklch(0.66 0.17 75)', '--line': 'oklch(0.83 0.03 110)' } }
};
var FONTS = {
  bricolage: '"Bricolage Grotesque", system-ui, sans-serif',
  familjen:  '"Familjen Grotesk", system-ui, sans-serif',
  anton:     '"Anton", system-ui, sans-serif',
  archivo:   '"Archivo Black", system-ui, sans-serif'
};

var currentPalette = 'honey';
var currentFont = 'bricolage';
var showRibbon = true;

function applyPalette(key) {
  currentPalette = key;
  Object.keys(PALETTES[key].vars).forEach(function(k) {
    document.documentElement.style.setProperty(k, PALETTES[key].vars[k]);
  });
}
function applyFont(key) {
  currentFont = key;
  document.documentElement.style.setProperty('--font-display', FONTS[key]);
}

// Build tweaks panel
var panel = document.createElement('div');
panel.id = 'tweaks-panel';
panel.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:9000;width:280px;max-height:calc(100vh - 32px);display:flex;flex-direction:column;background:rgba(250,249,247,.95);color:#29261b;backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:.5px solid rgba(255,255,255,.6);border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.2);font:11.5px/1.4 system-ui,sans-serif;overflow:hidden';

panel.innerHTML = [
  '<div id="twk-hd" style="display:flex;align-items:center;justify-content:space-between;padding:10px 8px 10px 14px;cursor:move;user-select:none;border-bottom:.5px solid rgba(0,0,0,.08)">',
    '<b style="font-size:12px;font-weight:600">Tweaks</b>',
    '<button id="twk-close" style="appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);width:22px;height:22px;border-radius:6px;cursor:pointer;font-size:14px;line-height:1;padding:0">&#x2715;</button>',
  '</div>',
  '<div style="padding:6px 14px 16px;display:flex;flex-direction:column;gap:10px;overflow-y:auto">',
    '<div style="font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:rgba(41,38,27,.45);padding-top:8px">Palette de couleurs</div>',
    '<div id="twk-palettes" style="display:grid;grid-template-columns:1fr 1fr;gap:8px"></div>',
    '<div style="font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:rgba(41,38,27,.45);padding-top:6px">Police des titres</div>',
    '<select id="twk-font" style="appearance:none;width:100%;height:28px;padding:0 8px;border:.5px solid rgba(0,0,0,.12);border-radius:7px;background:rgba(255,255,255,.7);color:inherit;font:inherit;cursor:pointer">',
      '<option value="bricolage">Bricolage — défaut</option>',
      '<option value="familjen">Familjen — sobre</option>',
      '<option value="anton">Anton — condensé</option>',
      '<option value="archivo">Archivo Black — lourd</option>',
    '</select>',
    '<div style="font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:rgba(41,38,27,.45);padding-top:6px">Mise en page</div>',
    '<div style="display:flex;align-items:center;justify-content:space-between">',
      '<span style="font-weight:500;color:rgba(41,38,27,.72)">Style des cartes</span>',
      '<div id="twk-cards" style="display:flex;gap:4px">',
        '<button data-cs="minimal" style="padding:4px 10px;border:1px solid var(--ink);border-radius:999px;background:var(--ink);color:var(--cream);font:inherit;font-size:11px;cursor:pointer">Minimal</button>',
        '<button data-cs="framed" style="padding:4px 10px;border:1px solid var(--ink);border-radius:999px;background:transparent;color:var(--ink);font:inherit;font-size:11px;cursor:pointer">Encadré</button>',
      '</div>',
    '</div>',
    '<div style="display:flex;align-items:center;justify-content:space-between">',
      '<span style="font-weight:500;color:rgba(41,38,27,.72)">Bandeau défilant</span>',
      '<button id="twk-ribbon" style="position:relative;width:32px;height:18px;border:0;border-radius:999px;background:#34c759;cursor:pointer;padding:0;flex-shrink:0">',
        '<i id="twk-ribbon-knob" style="position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s;transform:translateX(14px)"></i>',
      '</button>',
    '</div>',
  '</div>'
].join('');
document.body.appendChild(panel);

// Palette buttons
var palettesContainer = document.getElementById('twk-palettes');
Object.keys(PALETTES).forEach(function(key) {
  var pal = PALETTES[key];
  var btn = document.createElement('button');
  btn.dataset.pk = key;
  btn.style.cssText = 'border:1px solid rgba(0,0,0,.12);border-radius:8px;padding:6px;background:#fff;cursor:pointer;text-align:left;display:flex;flex-direction:column;gap:6px';
  var swatchHtml = pal.swatches.map(function(c) { return '<div style="flex:1;background:' + c + '"></div>'; }).join('');
  btn.innerHTML = '<div style="display:flex;height:24px;border-radius:4px;overflow:hidden">' + swatchHtml + '</div><div style="font-size:11px;font-weight:500">' + pal.label + '</div>';
  btn.addEventListener('click', function() {
    applyPalette(key);
    document.querySelectorAll('[data-pk]').forEach(function(b) {
      b.style.border = b.dataset.pk === key ? '2px solid #111' : '1px solid rgba(0,0,0,.12)';
    });
  });
  palettesContainer.appendChild(btn);
});
document.querySelector('[data-pk="honey"]').style.border = '2px solid #111';

// Font select
document.getElementById('twk-font').addEventListener('change', function() { applyFont(this.value); });

// Card style
document.getElementById('twk-cards').addEventListener('click', function(e) {
  var btn = e.target.closest('[data-cs]');
  if (!btn) return;
  var style = btn.dataset.cs;
  document.documentElement.dataset.cardStyle = style;
  document.querySelectorAll('[data-cs]').forEach(function(b) {
    if (b.dataset.cs === style) {
      b.style.background = 'var(--ink)'; b.style.color = 'var(--cream)';
    } else {
      b.style.background = 'transparent'; b.style.color = 'var(--ink)';
    }
  });
});

// Ribbon toggle
document.getElementById('twk-ribbon').addEventListener('click', function() {
  showRibbon = !showRibbon;
  document.documentElement.dataset.ribbon = showRibbon ? 'on' : 'off';
  this.style.background = showRibbon ? '#34c759' : 'rgba(0,0,0,.15)';
  document.getElementById('twk-ribbon-knob').style.transform = showRibbon ? 'translateX(14px)' : 'translateX(0)';
});

// Close
document.getElementById('twk-close').addEventListener('click', function(e) {
  e.stopPropagation();
  panel.style.display = 'none';
});

// Drag
var hd = document.getElementById('twk-hd');
hd.addEventListener('mousedown', function(e) {
  if (e.target.id === 'twk-close') return;
  var r = panel.getBoundingClientRect();
  var startX = e.clientX, startY = e.clientY;
  var startRight = window.innerWidth - r.right;
  var startBottom = window.innerHeight - r.bottom;
  function onMove(ev) {
    var nr = Math.max(0, startRight - (ev.clientX - startX));
    var nb = Math.max(0, startBottom - (ev.clientY - startY));
    panel.style.right = nr + 'px';
    panel.style.bottom = nb + 'px';
  }
  function onUp() {
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  }
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
});
