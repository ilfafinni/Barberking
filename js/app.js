/* BarberKing · App (página pública)
   ------------------------------------------------------------------
   Render dinámico de servicios, barberos, galería, testimonios,
   calendario de disponibilidad y reserva por WhatsApp.
------------------------------------------------------------------ */
(function () {
  'use strict';

  const S = window.BKStore;
  const cfg = S.getConfig();

  /* ---------- iconos ---------- */
  const ICON = {
    clock:
      '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    scissors:
      '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.9 15.1M14.5 14.5L20 20M8.9 8.9L12 12"/></svg>',
    razor:
      '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="14" width="10" height="7" rx="2"/><path d="M10 14V7a2 2 0 0 1 4 0v7"/></svg>',
    crown:
      '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8l4 4 5-6 5 6 4-4-2 11H5z"/><circle cx="12" cy="19" r="1.5"/></svg>',
    star:
      '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.4 6H21l-5 4 2 7-6-4.5L6 20l2-7-5-4h6.6z"/></svg>',
    palette:
      '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 0-4h-1.5a1.5 1.5 0 0 1 0-3H15a4 4 0 0 0 4-4c0-3.9-3.1-7-7-7z"/><circle cx="7.5" cy="10" r="1"/><circle cx="10.5" cy="6.5" r="1"/><circle cx="14.5" cy="6.5" r="1"/></svg>',
    starFilled:
      '<svg viewBox="0 0 24 24" fill="#d4a848" stroke="none"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2-6.2 3.2L6.9 14.2l-5-4.9 6.9-1z"/></svg>',
    phone:
      '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-12 7.6L3 21l1.9-6A8.4 8.4 0 1 1 21 11.5z"/></svg>',
  };

  const SERVICE_ICONS = {
    'svc-corte': ICON.scissors,
    'svc-barba': ICON.razor,
    'svc-combo': ICON.scissors,
    'svc-kids': ICON.star,
    'svc-rey': ICON.crown,
    'svc-color': ICON.palette,
  };
  const DEFAULT_SERVICE_ICON = ICON.scissors;

  /* ---------- utilidades ---------- */

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }
  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function initials(name) {
    return (name || '?')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(function (w) {
        return w[0].toUpperCase();
      })
      .join('');
  }

  function pad(n) {
    return (n < 10 ? '0' : '') + n;
  }

  function timeToLabel(min) {
    var h = Math.floor(min / 60);
    var m = min % 60;
    return pad(h) + ':' + pad(m);
  }

  function isPastTime(min, dateKey, todayKey) {
    if (dateKey !== todayKey) return false;
    var now = new Date();
    var nowMin = now.getHours() * 60 + now.getMinutes();
    return min <= nowMin;
  }

  function padKey(n) {
    return (n < 10 ? '0' : '') + n;
  }
  function dateKey(d) {
    return d.getFullYear() + '-' + padKey(d.getMonth() + 1) + '-' + padKey(d.getDate());
  }

  const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const MONTHS = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];

  function formatLongDate(key) {
    var parts = key.split('-');
    var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return DAY_NAMES[d.getDay()] + ' ' + d.getDate() + ' de ' + MONTHS[d.getMonth()];
  }

  /* ---------- estado de reserva ---------- */

  const booking = {
    serviceId: null,
    barberId: '',
    dateKey: null,
    time: null,
  };

  /* ---------- mount helpers ---------- */

  function mount(id, html) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ---------- secciones públicas ---------- */

  function renderStats() {
    var stats = cfg.stats || [];
    mount(
      'statsBand',
      stats
        .map(function (s) {
          return (
            '<div class="stat"><b>' +
            esc(s.value) +
            esc(s.suffix || '') +
            '</b><span>' +
            esc(s.label) +
            '</span></div>'
          );
        })
        .join('')
    );
  }

  function renderServices() {
    var services = S.getServices();
    var items = services.map(function (s) {
      var icon = SERVICE_ICONS[s.id] || DEFAULT_SERVICE_ICON;
      return (
        '<article class="card service-card' +
        (s.featured ? ' is-featured' : '') +
        '">' +
        (s.featured ? '<span class="service-badge">Más pedido</span>' : '') +
        '<div class="service-icon" aria-hidden="true">' +
        icon +
        '</div>' +
        '<h3>' +
        esc(s.name) +
        '</h3>' +
        '<p class="service-desc">' +
        esc(s.desc || '') +
        '</p>' +
        '<div class="service-foot">' +
        '<span class="service-price">' +
        S.formatCLP(s.price) +
        '</span>' +
        '<span class="service-duration" title="Duración estimada">' +
        ICON.clock +
        esc(s.duration || 60) +
        ' min</span>' +
        '</div>' +
        '<div style="margin-top:14px;">' +
        '<a class="link-arrow" href="#reserva" data-pick-service="' +
        esc(s.id) +
        '">Reservar este servicio <span aria-hidden="true">→</span></a>' +
        '</div>' +
        '</article>'
      );
    });
    mount('servicesGrid', items.join(''));
  }

  function renderBarbers() {
    var barbers = S.getBarbers();
    var services = S.getServices();
    if (!barbers.length) {
      mount(
        'barbersGrid',
        '<div class="empty-state" style="grid-column:1/-1;">Sin barberos por el momento. Regresa pronto.</div>'
      );
      return;
    }
    var items = barbers.map(function (b) {
      var chips = (b.services || [])
        .map(function (id) {
          var svc = services.find(function (s) {
            return s.id === id;
          });
          return svc ? '<span class="chip">' + esc(svc.name) + '</span>' : '';
        })
        .join('');
      return (
        '<article class="card barber-card">' +
        '<div class="barber-avatar" aria-hidden="true">' +
        initials(b.name) +
        '</div>' +
        '<h3>' +
        esc(b.name) +
        '</h3>' +
        '<p class="barber-role">' +
        esc(b.specialty || '') +
        '</p>' +
        '<p class="barber-bio">' +
        esc(b.bio || '') +
        '</p>' +
        (chips ? '<div class="barber-chips">' + chips + '</div>' : '') +
        '<a class="btn btn-ghost btn-sm" href="#reserva" data-pick-barber="' +
        esc(b.id) +
        '">Pedir turno con ' +
        esc(b.name.split(' ')[0]) +
        '</a>' +
        '</article>'
      );
    });
    mount('barbersGrid', items.join(''));
  }

  function renderGallery() {
    var g = cfg.gallery || [];
    mount(
      'galleryGrid',
      g
        .map(function (item) {
          return (
            '<figure class="gallery-item"><img src="' +
            esc(item.src) +
            '" alt="' +
            esc(item.alt) +
            '" loading="lazy" decoding="async"></figure>'
          );
        })
        .join('')
    );
  }

  function renderTestimonials() {
    var items = (cfg.testimonials || []).map(function (t) {
      return (
        '<article class="card testi-card">' +
        '<div class="testi-stars" aria-label="Calificación 5 de 5">' +
        ICON.starFilled +
        ICON.starFilled +
        ICON.starFilled +
        ICON.starFilled +
        ICON.starFilled +
        '</div>' +
        '<blockquote>“' +
        esc(t.text) +
        '”</blockquote>' +
        '<div class="testi-who">' +
        '<span class="testi-avatar" aria-hidden="true">' +
        initials(t.name) +
        '</span>' +
        '<div><b>' +
        esc(t.name) +
        '</b><span>Servicio: ' +
        esc(t.service) +
        '</span></div>' +
        '</div>' +
        '</article>'
      );
    });
    mount('testiGrid', items.join(''));
  }

  /* ---------- datos de contacto ---------- */

  function waUrl(text) {
    return (
      'https://wa.me/' +
      encodeURIComponent(S.getConfig().business.waNumber || '')
    ) + (text ? '?text=' + encodeURIComponent(text) : '');
  }

  function applyContacts() {
    var biz = S.getConfig().business;
    var hours = S.getConfig().hours;

    setText('contactAddress', biz.address);
    setText('contactPhone', biz.phoneDisplay + ' · Respuesta en minutos');
    setText('contactHours', timeToLabel(hours.open) + ' a ' + timeToLabel(hours.close));
    setText('contactIgLink', biz.instagram);

    var ig = biz.instagramUrl || 'https://www.instagram.com/';
    $('#contactIgLink').setAttribute('href', ig);
    $('#ctaIg').setAttribute('href', ig);
    $('#footerIg').setAttribute('href', ig);

    setText('footerPhone', biz.phoneDisplay);
    setText('footerAddress', biz.address);
    setText(
      'footerHours',
      '<li>Lun — Sáb: ' +
        timeToLabel(hours.open) +
        ' a ' +
        timeToLabel(hours.close) +
        '</li><li>Domingo: Cerrado</li>'
    );

    var waHref = waUrl(
      'Hola ' + biz.name + '! Quisiera consultar por un turno.'
    );
    $('#waFab').setAttribute('href', waHref);
    $('#footerWa').setAttribute('href', waHref);

    $('#year').textContent = String(new Date().getFullYear());
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = esc(text);
  }

  /* ---------- reserva: chips de servicio ---------- */

  function renderServiceChoices() {
    var services = S.getServices();
    var items = services.map(function (s) {
      return (
        '<button type="button" class="choice" data-choice-service="' +
        esc(s.id) +
        '" aria-pressed="' +
        (booking.serviceId === s.id ? 'true' : 'false') +
        '">' +
        esc(s.name) +
        ' <span class="choice-price">' +
        S.formatCLP(s.price) +
        '</span></button>'
      );
    });
    mount('svcChoices', items.join(''));
  }

  function renderBarberChoices() {
    var barbers = S.getBarbers();
    var items = [
      '<button type="button" class="choice' +
        (booking.barberId === '' ? ' is-pressed' : '') +
        '" data-choice-barber="" aria-pressed="' +
        (booking.barberId === '' ? 'true' : 'false') +
        '">Indistinto</button>',
    ];
    items = items.concat(
      barbers.map(function (b) {
        return (
          '<button type="button" class="choice" data-choice-barber="' +
          esc(b.id) +
          '" aria-pressed="' +
          (booking.barberId === b.id ? 'true' : 'false') +
          '">' +
          esc(b.name) +
          '</button>'
        );
      })
    );
    mount('barChoices', items.join(''));
  }

  /* ---------- reserva: días ---------- */

  function availableDays() {
    var days = [];
    var start = new Date();
    for (var i = 0; i < 28; i++) {
      var d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      if (S.isActiveDay(d.getDay())) days.push(d);
    }
    return days;
  }

  function renderDays() {
    var days = availableDays().slice(0, 14);
    var today = dateKey(new Date());
    var items = days.map(function (d) {
      var key = dateKey(d);
      var isBefore = key < today;
      return (
        '<button type="button" class="day-slot' +
        (isBefore ? ' is-disabled' : '') +
        '" data-day="' +
        key +
        '" aria-pressed="' +
        (booking.dateKey === key ? 'true' : 'false') +
        '"' +
        (isBefore ? ' disabled' : '') +
        '>' +
        '<span>' +
        DAY_SHORT[d.getDay()] +
        '</span><b>' +
        d.getDate() +
        '</b><span>' +
        MONTHS[d.getMonth()].slice(0, 3) +
        '</span></button>'
      );
    });
    mount('daysStrip', items.join(''));
  }

  /* ---------- reserva: horas ---------- */

  function renderTimes() {
    var hours = S.getConfig().hours;
    var times = [];
    var occupied = [];
    var today = dateKey(new Date());

    if (booking.dateKey) {
      occupied = S.occupiedSlots(booking.dateKey);
    }

    var t = hours.open;
    while (t + hours.slot <= hours.close) {
      times.push(t);
      t += hours.slot;
    }

    if (!times.length) {
      mount(
        'timeGrid',
        '<p class="hint" style="grid-column:1/-1;">No hay horarios configurados para este día.</p>'
      );
      return;
    }

    var items = times.map(function (min) {
      var label = timeToLabel(min);
      var isOcc = booking.dateKey && occupied.indexOf(label) !== -1;
      var isPast = booking.dateKey && isPastTime(min, booking.dateKey, today);
      var disabled = isOcc || isPast;
      var sub = isOcc ? '<span class="occ-label">Ocupado</span>' : '';
      return (
        '<button type="button" class="time-slot" data-time="' +
        label +
        '" aria-pressed="' +
        (booking.time === label ? 'true' : 'false') +
        '"' +
        (disabled ? ' disabled' : '') +
        '>' +
        label +
        sub +
        '</button>'
      );
    });

    mount('timeGrid', items.join(''));
  }

  /* ---------- resumen ---------- */

  function selectedService() {
    if (!booking.serviceId) return null;
    return S.getServices().find(function (s) {
      return s.id === booking.serviceId;
    });
  }

  function selectedBarber() {
    if (!booking.barberId) return null;
    return S.getBarbers().find(function (b) {
      return b.id === booking.barberId;
    });
  }

  function renderSummary() {
    var svc = selectedService();
    var barber = selectedBarber();
    var rows = [];
    var total = null;

    if (svc) {
      rows.push('<li><span>Servicio</span><b>' + esc(svc.name) + '</b></li>');
      total = svc.price;
    }
    if (barber) {
      rows.push('<li><span>Barbero</span><b>' + esc(barber.name) + '</b></li>');
    }
    if (booking.dateKey) {
      rows.push('<li><span>Día</span><b>' + esc(formatLongDate(booking.dateKey)) + '</b></li>');
    }
    if (booking.time) {
      rows.push('<li><span>Hora</span><b>' + esc(booking.time) + '</b></li>');
    }

    var hasAll = !!(svc && booking.dateKey && booking.time);
    var priceEl = $('#resumePrice');

    if (rows.length) {
      mount('resumeList', rows.join(''));
      $('#resumeEmpty').hidden = true;
      if (total != null) {
        $('#resumeTotal').hidden = false;
        priceEl.textContent = S.formatCLP(total);
      } else {
        $('#resumeTotal').hidden = true;
      }
    } else {
      mount('resumeList', '');
      $('#resumeEmpty').hidden = false;
      $('#resumeTotal').hidden = true;
    }

    var canConfirm = hasAll;
    $('#confirmBtn').disabled = !canConfirm;
  }

  /* ---------- reserva: eventos ---------- */

  function bindBookingEvents() {
    $('#svcChoices').addEventListener('click', function (e) {
      var b = e.target.closest('[data-choice-service]');
      if (!b) return;
      booking.serviceId = b.getAttribute('data-choice-service');
      renderServiceChoices();
      renderSummary();
    });

    $('#barChoices').addEventListener('click', function (e) {
      var b = e.target.closest('[data-choice-barber]');
      if (!b) return;
      booking.barberId = b.getAttribute('data-choice-barber') || '';
      renderBarberChoices();
      renderSummary();
    });

    $('#daysStrip').addEventListener('click', function (e) {
      var d = e.target.closest('.day-slot[data-day]');
      if (!d || d.disabled) return;
      booking.dateKey = d.getAttribute('data-day');
      booking.time = null;
      renderDays();
      renderTimes();
      renderSummary();
    });

    $('#timeGrid').addEventListener('click', function (e) {
      var t = e.target.closest('[data-time]');
      if (!t || t.disabled) return;
      booking.time = t.getAttribute('data-time');
      renderTimes();
      renderSummary();
    });

    ['bkName', 'bkPhone'].forEach(function (id) {
      $('#' + id).addEventListener('input', renderSummary);
    });

    $('#resetBooking').addEventListener('click', function (e) {
      e.preventDefault();
      booking.serviceId = null;
      booking.barberId = '';
      booking.dateKey = null;
      booking.time = null;
      renderServiceChoices();
      renderBarberChoices();
      renderDays();
      renderTimes();
      renderSummary();
      toast('Selección reiniciada', 'info');
    });

    $('#bookingForm').addEventListener('submit', confirmBooking);
    $('#confirmBtn').addEventListener('click', confirmBooking);
  }

  function confirmBooking(e) {
    if (e) e.preventDefault();
    var name = $('#bkName').value.trim();
    var phone = $('#bkPhone').value.trim();
    if (!name) {
      $('#bkName').focus();
      toast('Escribe tu nombre para continuar.', 'error');
      return;
    }
    if (!phone) {
      $('#bkPhone').focus();
      toast('Escribe tu WhatsApp para enviarte la confirmación.', 'error');
      return;
    }
    var svc = selectedService();

    if (!(booking.dateKey && booking.time && svc)) {
      toast('Completa servicio, día y hora para reservar.', 'error');
      return;
    }

    var barber = selectedBarber();
    var biz = S.getConfig().business;

    var lines = [
      '*Nueva reserva — ' + biz.name + '*',
      '',
      '• Servicio: ' + svc.name,
      '• Barbero: ' + (barber ? barber.name : 'Indistinto'),
      '• Día: ' + formatLongDate(booking.dateKey),
      '• Hora: ' + booking.time,
      '• Valor estimado: ' + S.formatCLP(svc.price),
      '',
      '• Nombre: ' + name,
      '• WhatsApp: ' + phone,
    ];
    var text = lines.join('\n');

    window.open(waUrl(text), '_blank', 'noopener');

    S.addReservation({
      date: booking.dateKey,
      time: booking.time,
      service: svc.name,
      serviceId: svc.id,
      barber: barber ? barber.name : 'Indistinto',
      name: name,
      phone: phone,
      status: 'pendiente',
      source: 'web',
      price: svc.price,
    });

    booking.serviceId = null;
    booking.barberId = '';
    booking.dateKey = null;
    booking.time = null;
    renderServiceChoices();
    renderBarberChoices();
    renderDays();
    renderTimes();
    renderSummary();
    toast('Excelente! Tu reserva se abrió en WhatsApp. Envíala para confirmar.', 'success');
  }

  /* ---------- pick desde cards ---------- */

  function bindPickButtons() {
    document.addEventListener('click', function (e) {
      var svc = e.target.closest('[data-pick-service]');
      if (svc) {
        e.preventDefault();
        booking.serviceId = svc.getAttribute('data-pick-service');
        renderServiceChoices();
        renderSummary();
        scrollToSection('reserva');
        return;
      }
      var bar = e.target.closest('[data-pick-barber]');
      if (bar) {
        e.preventDefault();
        booking.barberId = bar.getAttribute('data-pick-barber');
        renderBarberChoices();
        renderSummary();
        scrollToSection('reserva');
      }
    });
  }

  function scrollToSection(id) {
    var el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(function () {
        var f = el.querySelector('input, select, textarea, button');
        if (f) f.focus({ preventScroll: true });
      }, 400);
    }
  }

  /* ---------- header / navegación ---------- */

  function bindNav() {
    var toggle = $('#navToggle');
    var panel = $('#navPanel');
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      panel.classList.toggle('is-open', !open);
      toggle.setAttribute('aria-label', open ? 'Abrir menú' : 'Cerrar menú');
    });
    $$('#navPanel a').forEach(function (a) {
      a.addEventListener('click', function () {
        toggle.setAttribute('aria-expanded', 'false');
        panel.classList.remove('is-open');
      });
    });
  }

  function bindScrollSpy() {
    var links = {};
    $$('.nav-link').forEach(function (a) {
      var id = a.getAttribute('href').replace('#', '');
      if (id && id !== 'inicio') links[id] = a;
    });
    var sections = $$('main section[id]');

    function onScroll() {
      var pos = window.scrollY + 140;
      var current = null;
      sections.forEach(function (sec) {
        if (sec.offsetTop <= pos) current = sec.id;
      });
      $$('.nav-link').forEach(function (a) {
        var active = a.getAttribute('href') === '#inicio' && (!current || current === 'inicio');
        if (current && a.getAttribute('href') === '#' + current) active = true;
        a.classList.toggle('is-active', active);
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- reveal on scroll ---------- */

  function initReveal() {
    var targets = $$(
      'main .section-head, main .services-grid, main .barbers-grid, main .gallery-grid, main .testi-grid, main .booking-wrap, main .contact-grid, main .faq-list, main .cta-band, main .about-grid, main .stats-band'
    );
    targets.forEach(function (el) {
      el.classList.add('reveal');
    });

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      $$('.reveal').forEach(function (el) {
        el.classList.add('is-in');
      });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    $$('.reveal').forEach(function (el) {
      io.observe(el);
    });
  }

  /* ---------- marquee ---------- */

  function initMarquee() {
    var track = $('#marqueeTrack');
    if (track && track.dataset.dup !== '1') {
      track.innerHTML += track.innerHTML;
      track.dataset.dup = '1';
    }
  }

  /* ---------- toast ---------- */

  function toast(msg, kind) {
    var region = $('#toastRegion');
    var t = document.createElement('div');
    t.className = 'toast' + (kind === 'error' ? ' is-error' : kind === 'success' ? ' is-success' : '');
    t.textContent = msg;
    region.appendChild(t);
    setTimeout(function () {
      t.style.opacity = '0';
      t.style.transition = 'opacity .3s ease';
      setTimeout(function () {
        t.remove();
      }, 320);
    }, 3600);
  }

  /* ---------- temas de color ---------- */

  const THEMES = ['a', 'b', 'c', 'd'];
  const THEME_KEY = 'barberking.v1.theme';

  function readThemeFromUrl() {
    try {
      var m = /[?&]theme=([a-d])/i.exec(window.location.search);
      return m ? m[1].toLowerCase() : null;
    } catch (e) {
      return null;
    }
  }

  function readStoredTheme() {
    try {
      return window.localStorage.getItem(THEME_KEY);
    } catch (e) {
      return null;
    }
  }

  function applyTheme(theme, persist) {
    if (THEMES.indexOf(theme) === -1) theme = 'a';
    document.documentElement.setAttribute('data-theme', theme);
    $$('[data-theme-set]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.getAttribute('data-theme-set') === theme));
    });
    if (persist) {
      try {
        window.localStorage.setItem(THEME_KEY, theme);
      } catch (e) {
        /* sin persistencia: el tema igual se aplica en esta vista */
      }
    }
  }

  function initTheme() {
    // Se aplica lo antes posible para evitar el parpadeo del color por defecto.
    var initial = readThemeFromUrl() || readStoredTheme() || 'a';
    applyTheme(initial, false);

    document.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('[data-theme-set]') : null;
      if (!btn) return;
      applyTheme(btn.getAttribute('data-theme-set'), true);
    });
  }

  /* ---------- barra de progreso de scroll ---------- */

  function initScrollProgress() {
    var bar = $('#scrollProgress');
    if (!bar) return;
    var ticking = false;
    function update() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - doc.clientHeight;
      var pct = max > 0 ? Math.min(1, Math.max(0, doc.scrollTop / max)) : 0;
      bar.style.transform = 'scaleX(' + pct + ')';
      ticking = false;
    }
    window.addEventListener(
      'scroll',
      function () {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      },
      { passive: true }
    );
    window.addEventListener('resize', update);
    update();
  }

  /* ---------- glow dorado que sigue al cursor en el hero ---------- */

  function initHeroGlow() {
    var hero = $('#inicio');
    var glow = hero && hero.querySelector('.hero-glow');
    if (!hero || !glow) return;
    if (window.matchMedia('(hover: none)').matches) return;
    var raf = null;
    hero.addEventListener(
      'pointermove',
      function (e) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          var r = hero.getBoundingClientRect();
          var x = ((e.clientX - r.left) / r.width) * 100;
          var y = ((e.clientY - r.top) / r.height) * 100;
          glow.style.setProperty('--glow-x', x + '%');
          glow.style.setProperty('--glow-y', y + '%');
          raf = null;
        });
      },
      { passive: true }
    );
  }

  /* ---------- router público / admin ---------- */

  function applyRoute() {
    var isAdmin = window.location.hash.indexOf('#/admin') === 0;
    document.body.classList.toggle('admin-mode', isAdmin);
    if (isAdmin && window.BKAdmin && typeof window.BKAdmin.refresh === 'function') {
      window.BKAdmin.refresh();
    }
  }

  /* ---------- init ---------- */

  function rerender() {
    renderStats();
    renderServices();
    renderBarbers();
    renderGallery();
    renderTestimonials();
    renderServiceChoices();
    renderBarberChoices();
    renderDays();
    renderTimes();
    renderSummary();
  }

  function init() {
    initTheme();
    applyContacts();
    rerender();
    bindBookingEvents();
    bindPickButtons();
    bindNav();
    bindScrollSpy();
    initScrollProgress();
    initHeroGlow();
    initReveal();
    initMarquee();
    window.addEventListener('hashchange', applyRoute);
  }

  window.BKApp = {
    init: init,
    rerender: rerender,
    toast: toast,
    formatCLP: S.formatCLP,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();