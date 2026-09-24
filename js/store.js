/* BarberKing · Store
   ------------------------------------------------------------------
   Capa de persistencia: guarda en localStorage del navegador.
   Cada confirmación de reserva viaja por WhatsApp al número del local
   (fuente de verdad del negocio). El panel admin registra esas
   reservas para bloquear los horarios en el calendario público.
------------------------------------------------------------------ */
(function () {
  'use strict';

  const PREFIX = 'barberking.v1.';

  const KEY = {
    config: PREFIX + 'config',
    passcode: PREFIX + 'passcode',
    barbers: PREFIX + 'barbers',
    services: PREFIX + 'services',
    reservations: PREFIX + 'reservations',
  };

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (err) {
      console.warn('Store read falló para ' + key, err);
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.warn('Store write falló para ' + key, err);
      return false;
    }
  }

  /* ---------- utilidades ---------- */

  function uid(prefix) {
    return (
      (prefix || 'id') +
      '-' +
      Date.now().toString(36) +
      '-' +
      Math.random().toString(36).slice(2, 7)
    );
  }

  function deepMerge(base, over) {
    const out = Array.isArray(base) ? base.slice() : Object.assign({}, base);
    for (const key of Object.keys(over || {})) {
      const overVal = over[key];
      if (
        overVal !== null &&
        typeof overVal === 'object' &&
        !Array.isArray(overVal) &&
        typeof out[key] === 'object' &&
        !Array.isArray(out[key])
      ) {
        out[key] = deepMerge(out[key], overVal);
      } else {
        out[key] = overVal;
      }
    }
    return out;
  }

  function formatCLP(value) {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(value || 0);
  }

  /* Hash simple para el passcode (NOTA: es client-side, no es seguridad
     real a nivel servidor; sirve para ordenar el acceso desde la UI). */
  function hashPasscode(code) {
    const salt = 'barberking·sal1';
    const str = salt + ':' + (code || '');
    let h = 5381;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    }
    return 'h' + (h >>> 0).toString(36);
  }

  /* ----- API pública ----- */

  const Store = {
    defaults: window.BK_DEFAULTS,

    formatCLP,

    /* generador de fechas */
    isActiveDay(dayIndex) {
      const cfg = Store.getConfig();
      return (cfg.hours.days || []).indexOf(dayIndex) !== -1;
    },
    getOpen() {
      return Store.getConfig().hours.open;
    },
    getClose() {
      return Store.getConfig().hours.close;
    },
    getSlot() {
      return Store.getConfig().hours.slot;
    },

    /* config */
    getConfig() {
      const over = read(KEY.config, {});
      return deepMerge(this.defaults, over);
    },
    updateConfig(patch) {
      const cur = read(KEY.config, {});
      write(KEY.config, deepMerge(cur, patch));
    },

    /* passcode */
    getPasscodeHash() {
      const h = read(KEY.passcode, null);
      return h === null ? hashPasscode(this.defaults.admin.passcode) : h;
    },
    verifyPasscode(code) {
      return hashPasscode(code) === this.getPasscodeHash();
    },
    setPasscode(code) {
      write(KEY.passcode, hashPasscode(code));
    },

    /* barberos */
    getBarbers() {
      const list = read(KEY.barbers, null);
      return list === null ? this.defaults.barbers.slice() : list;
    },
    saveBarbers(list) {
      write(KEY.barbers, list);
    },
    addBarber(barber) {
      const list = this.getBarbers();
      list.push(Object.assign({ id: uid('bar'), services: [] }, barber));
      this.saveBarbers(list);
      return list;
    },
    removeBarber(id) {
      const list = this.getBarbers().filter((b) => b.id !== id);
      this.saveBarbers(list);
      return list;
    },
    updateBarber(id, patch) {
      const list = this.getBarbers().map((b) => (b.id === id ? Object.assign({}, b, patch) : b));
      this.saveBarbers(list);
      return list;
    },

    /* servicios */
    getServices() {
      const list = read(KEY.services, null);
      return list === null ? this.defaults.services.slice() : list;
    },
    saveServices(list) {
      write(KEY.services, list);
    },
    addService(service) {
      const list = this.getServices();
      list.push(Object.assign({ id: uid('svc') }, service));
      this.saveServices(list);
      return list;
    },
    removeService(id) {
      const list = this.getServices().filter((s) => s.id !== id);
      this.saveServices(list);
      return list;
    },
    updateService(id, patch) {
      const list = this.getServices().map((s) => (s.id === id ? Object.assign({}, s, patch) : s));
      this.saveServices(list);
      return list;
    },

    /* reservas */
    getReservations() {
      return read(KEY.reservations, []);
    },
    saveReservations(list) {
      write(KEY.reservations, list);
    },
    addReservation(data) {
      const list = this.getReservations();
      const item = Object.assign(
        {
          id: uid('rsv'),
          createdAt: new Date().toISOString(),
          status: 'pendiente',
          source: 'web',
        },
        data
      );
      list.push(item);
      this.saveReservations(list);
      return item;
    },
    removeReservation(id) {
      const list = this.getReservations().filter((r) => r.id !== id);
      this.saveReservations(list);
      return list;
    },
    updateReservation(id, patch) {
      const list = this.getReservations().map((r) =>
        r.id === id ? Object.assign({}, r, patch) : r
      );
      this.saveReservations(list);
      return list;
    },

    /* slots ocupados para una fecha (los cancelados no cuentan) */
    occupiedSlots(dateKey) {
      return this.getReservations()
        .filter((r) => r.date === dateKey && r.status !== 'cancelado' && r.time)
        .map((r) => r.time);
    },

    isSlotOccupied(dateKey, time) {
      return this.occupiedSlots(dateKey).indexOf(time) !== -1;
    },

    resetAll() {
      ['config', 'passcode', 'barbers', 'services', 'reservations'].forEach((k) =>
        localStorage.removeItem(PREFIX + k)
      );
    },
  };

  window.BKStore = Store;
})();