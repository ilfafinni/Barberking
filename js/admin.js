/* BarberKing · Panel Admin
   ------------------------------------------------------------------
   Gestión de reservas, peluqueros, servicios y ajustes del local.
   Persistencia 100% local (localStorage) + WhatsApp como canal
   de confirmación. El admin registra aquí las reservas que llegan
   por WhatsApp para bloquear los horarios en el calendario público.
------------------------------------------------------------------ */
(function () {
  'use strict';

  const S = window.BKStore;
  const APP = window.BKApp;
  const SESSION_KEY = 'barberking.admin.session';

  let editingBarberId = null;
  let editingServiceId = null;

  /* ---------- helpers ---------- */

  function $(sel) {
    return document.querySelector(sel);
  }
  function $$(sel) {
    return Array.prototype.slice.call(document.querySelectorAll(sel));
  }

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function toast(msg, kind) {
    if (APP && APP.toast) APP.toast(msg, kind);
  }

  function pad(n) {
    return (n < 10 ? '0' : '') + n;
  }
  function timeToLabel(min) {
    return pad(Math.floor(min / 60)) + ':' + pad(min % 60);
  }
  function minutesToTime(str) {
    var parts = String(str || '10:00').split(':');
    return Number(parts[0]) * 60 + Number(parts[1]);
  }

  function formatDate(key) {
    if (!key) return '—';
    var p = key.split('-');
    var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    return d.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' });
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

  /* ---------- sesión ---------- */

  function isLogged() {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  }
  function setLogged(v) {
    if (v) sessionStorage.setItem(SESSION_KEY, '1');
    else sessionStorage.removeItem(SESSION_KEY);
  }

  /* ---------- route / refresh ---------- */

  function refresh() {
    if (!isLogged()) {
      $('#adminLogin').hidden = false;
      $('#adminPanel').hidden = true;
      $('#logoutBtn').hidden = true;
      return;
    }
    $('#adminLogin').hidden = true;
    $('#adminPanel').hidden = false;
    $('#logoutBtn').hidden = false;
    renderKpis();
    renderRsvTable();
    renderBarbersAdmin();
    renderServicesAdmin();
    fillSettings();
    fillAddRsvSelects();
  }

  /* ---------- tabs ---------- */

  function bindTabs() {
    $$('.admin-nav [data-admin-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tab = btn.getAttribute('data-admin-tab');
        $$('.admin-nav [data-admin-tab]').forEach(function (b) {
          b.setAttribute('aria-pressed', String(b === btn));
        });
        $$('.admin-section').forEach(function (sec) {
          sec.classList.toggle('is-active', sec.getAttribute('data-admin-section') === tab);
        });
      });
    });
  }

  /* ---------- KPIs ---------- */

  function renderKpis() {
    var rsvs = S.getReservations();
    var today = dateKeyNow();
    var pend = rsvs.filter(function (r) {
      return r.status === 'pendiente';
    }).length;
    var conf = rsvs.filter(function (r) {
      return r.status === 'confirmado';
    });
    var todayCount = conf.filter(function (r) {
      return r.date === today;
    }).length;
    var revenue = conf.reduce(function (acc, r) {
      return acc + (Number(r.price) || 0);
    }, 0);

    var kpis = $('.kpis');
    if (!kpis) return;
    kpis.innerHTML =
      '<div class="kpi"><b>' +
      String(pend) +
      '</b><span>Pendientes</span></div>' +
      '<div class="kpi"><b>' +
      String(todayCount) +
      '</b><span>Confirmadas hoy</span></div>' +
      '<div class="kpi"><b>' +
      String(conf.length) +
      '</b><span>Confirmadas total</span></div>' +
      '<div class="kpi"><b>' +
      S.formatCLP(revenue) +
      '</b><span>Facturado (conf.)</span></div>';
  }

  function dateKeyNow() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  /* ---------- reservas ---------- */

  function statusBadge(status) {
    var map = { pendiente: 'badge-pendiente', confirmado: 'badge-confirmado', cancelado: 'badge-cancelado' };
    return '<span class="badge ' + (map[status] || '') + '">' + esc(status) + '</span>';
  }

  function renderRsvTable(filter) {
    filter = filter || ($('#rsvFilter') ? $('#rsvFilter').value : 'all');
    var rsvs = S.getReservations().slice().sort(function (a, b) {
      return (b.date + b.time).localeCompare(a.date + a.time);
    });
    if (filter !== 'all') rsvs = rsvs.filter(function (r) {
      return r.status === filter;
    });

    var wrap = $('#rsvTableWrap');
    if (!wrap) return;

    if (!rsvs.length) {
      wrap.innerHTML =
        '<div class="empty-state" style="margin:0;border-radius:var(--r-lg);">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>' +
        'No hay reservas en esta vista. Al enviar una reserva desde la página pública, aparecerá aquí en este navegador.</div>';
      return;
    }

    var rows = rsvs
      .map(function (r) {
        return (
          '<tr>' +
          '<td class="nowrap"><b>' +
          esc(formatDate(r.date)) +
          '</b><br><span style="color:var(--faint);font-size:.85rem;">' +
          esc(r.createdAt ? new Date(r.createdAt).toLocaleString('es-CL') : '') +
          '</span></td>' +
          '<td class="nowrap">' +
          esc(r.time) +
          '</td>' +
          '<td><b>' +
          esc(r.name) +
          '</b><br><a href="https://wa.me/' +
          esc(String(r.phone).replace(/[^0-9]/g, '')) +
          '" target="_blank" rel="noopener noreferrer" style="font-size:.85rem;">' +
          esc(r.phone) +
          '</a></td>' +
          '<td>' +
          esc(r.service) +
          '<br><span style="color:var(--faint);font-size:.85rem;">' +
          S.formatCLP(r.price) +
          '</span></td>' +
          '<td>' +
          esc(r.barber || '—') +
          '</td>' +
          '<td>' +
          statusBadge(r.status) +
          '</td>' +
          '<td><div class="row-actions">' +
          (r.status === 'pendiente'
            ? '<button class="mini-btn ok" data-rsv-confirm="' + r.id + '">Confirmar</button>' +
              '<button class="mini-btn danger" data-rsv-cancel="' + r.id + '">Cancelar</button>'
            : r.status === 'cancelado'
              ? '<button class="mini-btn" data-rsv-confirm="' + r.id + '">Reactivar</button>'
              : '<button class="mini-btn" data-rsv-pend="' + r.id + '">→ Pendiente</button>') +
          '<button class="mini-btn danger" data-rsv-del="' + r.id + '">Borrar</button>' +
          '</div></td>' +
          '</tr>'
        );
      })
      .join('');

    wrap.innerHTML =
      '<table class="tbl"><thead><tr>' +
      '<th>Fecha</th><th>Hora</th><th>Cliente</th><th>Servicio</th><th>Barbero</th><th>Estado</th><th>Acciones</th>' +
      '</tr></thead><tbody>' +
      rows +
      '</tbody></table>';
  }

  function bindRsvTable() {
    $('#rsvTableWrap').addEventListener('click', function (e) {
      var t = e.target;
      var id;
      if ((id = t.getAttribute('data-rsv-confirm'))) {
        S.updateReservation(id, { status: 'confirmado' });
        toast('Reserva confirmada y horario bloqueado.', 'success');
      } else if ((id = t.getAttribute('data-rsv-cancel'))) {
        S.updateReservation(id, { status: 'cancelado' });
        toast('Reserva cancelada.', 'info');
      } else if ((id = t.getAttribute('data-rsv-pend'))) {
        S.updateReservation(id, { status: 'pendiente' });
        toast('Reserva movida a pendiente.', 'info');
      } else if ((id = t.getAttribute('data-rsv-del'))) {
        if (window.confirm('¿Borrar esta reserva de forma permanente?')) {
          S.removeReservation(id);
          toast('Reserva eliminada.', 'info');
        } else return;
      } else return;
      renderKpis();
      renderRsvTable();
      if (window.BKApp) window.BKApp.rerender();
    });

    var filter = $('#rsvFilter');
    if (filter) filter.addEventListener('change', function () {
      renderRsvTable();
    });
  }

  /* formulario agregar reserva */

  function fillAddRsvSelects() {
    var svcSel = $('#aService');
    var barSel = $('#aBarber');
    var timeSel = $('#aTime');
    if (!svcSel || !barSel || !timeSel) return;

    svcSel.innerHTML = S.getServices()
      .map(function (s) {
        return '<option value="' + esc(s.id) + '">' + esc(s.name) + ' · ' + S.formatCLP(s.price) + '</option>';
      })
      .join('');

    barSel.innerHTML =
      '<option value="">Indistinto</option>' +
      S.getBarbers()
        .map(function (b) {
          return '<option value="' + esc(b.id) + '">' + esc(b.name) + '</option>';
        })
        .join('');

    var hours = S.getConfig().hours;
    var opts = [];
    var t = hours.open;
    while (t + hours.slot <= hours.close) {
      opts.push('<option value="' + timeToLabel(t) + '">' + timeToLabel(t) + '</option>');
      t += hours.slot;
    }
    timeSel.innerHTML = opts.join('');
  }

  function bindAddRsv() {
    var toggle = $('#addRsvToggle');
    var form = $('#addRsvForm');
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      form.style.display = open ? 'none' : 'block';
    });
    $('#aCancel').addEventListener('click', function () {
      form.style.display = 'none';
      toggle.setAttribute('aria-expanded', 'false');
    });

    $('#addRsvFormEl').addEventListener('submit', function (e) {
      e.preventDefault();
      var svcId = $('#aService').value;
      var svc = S.getServices().find(function (s) {
        return s.id === svcId;
      });
      var barberId = $('#aBarber').value;
      var barber = S.getBarbers().find(function (b) {
        return b.id === barberId;
      });
      var res = S.addReservation({
        date: $('#aDate').value,
        time: $('#aTime').value,
        service: svc ? svc.name : '—',
        serviceId: svcId,
        barber: barber ? barber.name : 'Indistinto',
        name: $('#aName').value.trim(),
        phone: $('#aPhone').value.trim(),
        status: 'pendiente',
        source: 'admin',
        price: svc ? svc.price : null,
      });
      if (res) {
        toast('Reserva registrada y horario bloqueado en el calendario.', 'success');
        e.target.reset();
        form.style.display = 'none';
        toggle.setAttribute('aria-expanded', 'false');
        renderKpis();
        renderRsvTable();
        if (window.BKApp) window.BKApp.rerender();
      }
    });
  }

  function exportReservations() {
    var data = S.getReservations();
    downloadJson('barberking-reservas.json', data);
    toast('Archivo de reservas exportado.', 'success');
  }

  /* ---------- peluqueros ---------- */

  function renderBarbersAdmin() {
    var list = S.getBarbers();
    var wrap = $('#barAdminList');
    if (!wrap) return;
    if (!list.length) {
      wrap.innerHTML =
        '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round"><circle cx="9" cy="8" r="4"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>No hay peluqueros. Agrega el primero.</div>';
      return;
    }
    wrap.innerHTML = list
      .map(function (b) {
        var chips = (b.services || [])
          .map(function (id) {
            var s = S.getServices().find(function (x) {
              return x.id === id;
            });
            return s ? '<span class="chip">' + esc(s.name) + '</span>' : '';
          })
          .join('');
        return (
          '<div class="card" style="padding:18px 20px;margin-bottom:12px;">' +
          '<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;">' +
          '<span class="avatar-edit">' +
          initials(b.name) +
          '</span>' +
          '<div style="flex:1;min-width:200px;">' +
          '<b style="font-size:1.05rem;">' +
          esc(b.name) +
          '</b>' +
          '<div style="color:var(--gold);font-size:.86rem;font-weight:600;">' +
          esc(b.specialty || '') +
          '</div>' +
          '<div style="color:var(--muted);font-size:.88rem;margin-top:4px;">' +
          esc(b.bio || '') +
          '</div>' +
          (chips ? '<div class="barber-chips" style="justify-content:flex-start;margin-top:10px;">' + chips + '</div>' : '') +
          '</div>' +
          '<div class="row-actions">' +
          '<button class="mini-btn" data-bar-edit="' + b.id + '">Editar</button>' +
          '<button class="mini-btn danger" data-bar-del="' + b.id + '">Quitar</button>' +
          '</div>' +
          '</div></div>'
        );
      })
      .join('');
  }

  function bindBarbersAdmin() {
    $('#barAdminList').addEventListener('click', function (e) {
      var t = e.target;
      var id;
      if ((id = t.getAttribute('data-bar-del'))) {
        if (window.confirm('¿Quitar a este peluquero de la página pública? Esta acción no se puede deshacer.')) {
          S.removeBarber(id);
          toast('Peluquero eliminado.', 'info');
          renderBarbersAdmin();
          if (window.BKApp) window.BKApp.rerender();
        }
      } else if ((id = t.getAttribute('data-bar-edit'))) {
        openBarberEdit(id);
      }
    });

    var toggle = $('#addBarToggle');
    var form = $('#addBarForm');
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      form.style.display = open ? 'none' : 'block';
      if (!open) $('#addBarFormEl').reset();
      editingBarberId = null;
      $('#addBarFormEl #bName').value = '';
      $('#addBarFormEl #bSpecialty').value = '';
      $('#addBarFormEl #bBio').value = '';
    });
    $('#bCancel').addEventListener('click', function () {
      form.style.display = 'none';
      toggle.setAttribute('aria-expanded', 'false');
    });

    $('#addBarFormEl').addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('#bName').value.trim();
      var specialty = $('#bSpecialty').value.trim();
      var bio = $('#bBio').value.trim();
      if (!name || !specialty) return;
      if (editingBarberId) {
        S.updateBarber(editingBarberId, { name: name, specialty: specialty, bio: bio });
        toast('Peluquero actualizado.', 'success');
        editingBarberId = null;
      } else {
        S.addBarber({ name: name, specialty: specialty, bio: bio });
        toast('Peluquero agregado a la página.', 'success');
      }
      e.target.reset();
      form.style.display = 'none';
      toggle.setAttribute('aria-expanded', 'false');
      renderBarbersAdmin();
      if (window.BKApp) window.BKApp.rerender();
    });
  }

  function openBarberEdit(id) {
    var b = S.getBarbers().find(function (x) {
      return x.id === id;
    });
    if (!b) return;
    editingBarberId = id;
    var toggle = $('#addBarToggle');
    var form = $('#addBarForm');
    toggle.setAttribute('aria-expanded', 'true');
    form.style.display = 'block';
    $('#bName').value = b.name;
    $('#bSpecialty').value = b.specialty || '';
    $('#bBio').value = b.bio || '';
    $('#bName').focus();
  }

  /* ---------- servicios (admin) ---------- */

  function renderServicesAdmin() {
    var list = S.getServices();
    var wrap = $('#svcAdminList');
    if (!wrap) return;
    if (!list.length) {
      wrap.innerHTML =
        '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M4.5 3.5h15"/><path d="M6 7.5a6 6 0 0 0 12 0"/><path d="M8 7.5l-3 13h14l-3-13"/></svg>No hay servicios. Agrega el primero.</div>';
      return;
    }
    wrap.innerHTML =
      '<div class="table-wrap"><table class="tbl"><thead><tr>' +
      '<th>Servicio</th><th>Descripción</th><th>Duración</th><th>Precio</th><th>Acciones</th>' +
      '</tr></thead><tbody>' +
      list
        .map(function (s) {
          return (
            '<tr>' +
            '<td><b>' +
            esc(s.name) +
            '</b></td>' +
            '<td style="color:var(--muted);">' +
            esc(s.desc || '') +
            '</td>' +
            '<td class="nowrap">' +
            esc(s.duration) +
            ' min</td>' +
            '<td class="nowrap" style="color:var(--gold-2);font-weight:700;">' +
            S.formatCLP(s.price) +
            '</td>' +
            '<td><div class="row-actions">' +
            '<button class="mini-btn" data-svc-edit="' + s.id + '">Editar</button>' +
            '<button class="mini-btn danger" data-svc-del="' + s.id + '">Quitar</button>' +
            '</div></td></tr>'
          );
        })
        .join('') +
      '</tbody></table></div>';
  }

  function bindServicesAdmin() {
    $('#svcAdminList').addEventListener('click', function (e) {
      var t = e.target;
      var id;
      if ((id = t.getAttribute('data-svc-del'))) {
        if (window.confirm('¿Quitar este servicio de la página pública?')) {
          S.removeService(id);
          toast('Servicio eliminado.', 'info');
          renderServicesAdmin();
          if (window.BKApp) window.BKApp.rerender();
        }
      } else if ((id = t.getAttribute('data-svc-edit'))) {
        openServiceEdit(id);
      }
    });

    var toggle = $('#addSvcToggle');
    var form = $('#addSvcForm');
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      form.style.display = open ? 'none' : 'block';
      if (!open) e_resetServiceForm();
    });
    $('#sCancel').addEventListener('click', function () {
      form.style.display = 'none';
      toggle.setAttribute('aria-expanded', 'false');
    });

    $('#addSvcFormEl').addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('#sName').value.trim();
      var price = Number($('#sPrice').value);
      var duration = Number($('#sDuration').value);
      var desc = $('#sDesc').value.trim();
      if (!name || isNaN(price) || !desc) return;
      if (editingServiceId) {
        S.updateService(editingServiceId, { name: name, price: price, duration: duration, desc: desc });
        toast('Servicio actualizado.', 'success');
        editingServiceId = null;
      } else {
        S.addService({ name: name, price: price, duration: duration, desc: desc });
        toast('Servicio agregado.', 'success');
      }
      e.target.reset();
      form.style.display = 'none';
      toggle.setAttribute('aria-expanded', 'false');
      renderServicesAdmin();
      fillAddRsvSelects();
      if (window.BKApp) window.BKApp.rerender();
    });
  }

  function e_resetServiceForm() {
    $('#addSvcFormEl').reset();
    editingServiceId = null;
  }

  function openServiceEdit(id) {
    var s = S.getServices().find(function (x) {
      return x.id === id;
    });
    if (!s) return;
    editingServiceId = id;
    var toggle = $('#addSvcToggle');
    var form = $('#addSvcForm');
    toggle.setAttribute('aria-expanded', 'true');
    form.style.display = 'block';
    $('#sName').value = s.name;
    $('#sPrice').value = s.price;
    $('#sDuration').value = s.duration;
    $('#sDesc').value = s.desc || '';
    $('#sName').focus();
  }

  /* ---------- ajustes ---------- */

  const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  function fillSettings() {
    var cfg = S.getConfig();
    var biz = cfg.business;
    var hours = cfg.hours;

    $('#cName').value = biz.name;
    $('#cTagline').value = biz.tagline || '';
    $('#cPhone').value = biz.phoneDisplay;
    $('#cWa').value = biz.waNumber;
    $('#cAddress').value = biz.address;
    $('#cIg').value = biz.instagram;

    var openInput = $('#cOpen');
    var closeInput = $('#cClose');
    openInput.value = timeToLabel(hours.open);
    closeInput.value = timeToLabel(hours.close);
    $('#cSlot').value = hours.slot;

    var box = $('#cDays');
    box.innerHTML = DAY_LABELS.map(function (label, i) {
      var on = hours.days.indexOf(i) !== -1;
      return (
        '<button type="button" class="choice" data-dayidx="' +
        i +
        '" aria-pressed="' +
        (on ? 'true' : 'false') +
        '">' +
        label +
        '</button>'
      );
    }).join('');
  }

  function bindSettings() {
    $('#cDays').addEventListener('click', function (e) {
      var b = e.target.closest('[data-dayidx]');
      if (!b) return;
      var pressed = b.getAttribute('aria-pressed') === 'true';
      b.setAttribute('aria-pressed', String(!pressed));
    });

    $('#settingsForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var days = $$('#cDays [data-dayidx]')
        .filter(function (b) {
          return b.getAttribute('aria-pressed') === 'true';
        })
        .map(function (b) {
          return Number(b.getAttribute('data-dayidx'));
        });

      if (!days.length) {
        toast('Debes seleccionar al menos un día de atención.', 'error');
        return;
      }

      S.updateConfig({
        business: {
          name: $('#cName').value.trim(),
          tagline: $('#cTagline').value.trim(),
          phoneDisplay: $('#cPhone').value.trim(),
          waNumber: $('#cWa').value.trim().replace(/[^0-9]/g, ''),
          address: $('#cAddress').value.trim(),
          instagram: $('#cIg').value.trim(),
        },
        hours: {
          open: minutesToTime($('#cOpen').value),
          close: minutesToTime($('#cClose').value),
          slot: Number($('#cSlot').value) || 60,
          days: days,
        },
      });
      toast('Ajustes guardados y página pública actualizada.', 'success');
      if (window.BKApp) window.BKApp.rerender();
    });

    $('#passcodeForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var p = $('#pNew').value;
      var c = $('#pConfirm').value;
      if (p.length < 6) {
        toast('La contraseña debe tener al menos 6 caracteres.', 'error');
        return;
      }
      if (p !== c) {
        toast('Las contraseñas no coinciden.', 'error');
        return;
      }
      S.setPasscode(p);
      e.target.reset();
      toast('Contraseña actualizada.', 'success');
    });

    $('#exportAll').addEventListener('click', function () {
      var data = {
        meta: { app: 'barberking', version: 1, exported: new Date().toISOString() },
        config: readRaw('config'),
        passcode: readRaw('passcode'),
        barbers: S.getBarbers(),
        services: S.getServices(),
        reservations: S.getReservations(),
      };
      downloadJson('barberking-backup.json', data);
      toast('Backup descargado. Guárdalo en un lugar seguro.', 'success');
    });

    $('#importAll').addEventListener('click', function () {
      $('#importFile').click();
    });
    $('#importFile').addEventListener('change', function () {
      var file = this.files && this.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var data = JSON.parse(reader.result);
          applyImport(data);
        } catch (err) {
          toast('Archivo de backup inválido.', 'error');
        }
      };
      reader.readAsText(file);
    });

    $('#resetAll').addEventListener('click', function () {
      if (window.confirm('¿Restablecer todos los datos a los valores por defecto? Se borrarán reservas, barberos, servicios y ajustes guardados en este navegador.')) {
        S.resetAll();
        window.location.hash = '#inicio';
        window.location.reload();
      }
    });
  }

  function readRaw(key) {
    try {
      var raw = localStorage.getItem('barberking.v1.' + key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function applyImport(data) {
    var keys = [
      ['config', 'config'],
      ['passcode', 'passcode'],
      ['barbers', 'barbers'],
      ['services', 'services'],
      ['reservations', 'reservations'],
    ];
    keys.forEach(function (pair) {
      var v = data && data[pair[0]];
      if (v != null) localStorage.setItem('barberking.v1.' + pair[1], JSON.stringify(v));
    });
    toast('Backup importado correctamente.', 'success');
    if (window.BKApp) window.BKApp.rerender();
    refresh();
  }

  function downloadJson(name, data) {
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 500);
  }

  /* ---------- login / logout ---------- */

  function bindAuth() {
    $('#loginForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var code = $('#loginPass').value;
      if (S.verifyPasscode(code)) {
        setLogged(true);
        $('#loginPass').value = '';
        $('#loginError').hidden = true;
        refresh();
        toast('Bienvenido al panel admin.', 'success');
      } else {
        $('#loginError').hidden = false;
        $('#loginPass').value = '';
        $('#loginPass').focus();
      }
    });

    $('#logoutBtn').addEventListener('click', function () {
      setLogged(false);
      window.location.hash = '#inicio';
      refresh();
    });
  }

  /* ---------- init ---------- */

  function init() {
    bindTabs();
    bindAuth();
    bindRsvTable();
    bindAddRsv();
    bindBarbersAdmin();
    bindServicesAdmin();
    bindSettings();

    $('#exportRsv').addEventListener('click', exportReservations);
    $('#addRsvToggle').setAttribute('aria-expanded', 'false');

    $('#goSite').addEventListener('click', function () {
      window.location.hash = '#inicio';
    });

    window.BKAdmin = { refresh: refresh };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();