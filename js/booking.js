/* ==========================================================================
   Niki Lash Studio — booking flow
   A self-contained, four-step booking widget.
   Call initBooking() once the DOM with the required markup is present.
   ========================================================================== */

(function (global) {
  'use strict';

  /* --- Editable data: swap these for the real team and real prices --- */
  const STYLISTS = [
    { id: 'niki', name: 'Niki', role: 'Lead artist', init: 'N' },
    { id: 'sara', name: 'Sara', role: 'Lash specialist', init: 'S' },
    { id: 'any',  name: 'No preference', role: 'First available', init: '\u2217' }
  ];

  const SERVICES = [
    { name: 'Lash extensions — natural',     meta: '45 min', mins: 45, price: 5 },
    { name: 'Lash extensions — full volume', meta: '75 min', mins: 75, price: 25 },
    { name: 'Brow & lash tinting',           meta: '30 min', mins: 30, price: 17 },
    { name: 'Henna & saree wrap',            meta: '60 min', mins: 60, price: 10 },
    { name: 'Lash removal & refill',         meta: '40 min', mins: 40, price: 15 },
    { name: 'Mink lashes',                   meta: '60 min', mins: 60, price: 30 }
  ];

  const TIMES = ['10:00', '11:00', '12:00', '1:00', '2:00', '3:00', '4:00', '5:00'];
  const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  function money(n) { return '$' + Math.round(n).toLocaleString(); }

  function initBooking(opts) {
    opts = opts || {};
    const root = opts.root || document;
    const panel = root.querySelector('#panel');
    const nextBtn = root.querySelector('#next');
    const backBtn = root.querySelector('#back');
    const runTotalEl = root.querySelector('#runtotal');
    if (!panel || !nextBtn || !backBtn) return null;

    let step = 0;
    const state = { services: [], stylist: null, date: null, time: null };
    if (opts.preselect) state.services.push(opts.preselect);

    // --- Multi-select helpers ---
    function isSelected(s) {
      return state.services.some(function (x) { return x.name === s.name; });
    }
    function toggleService(s) {
      const i = state.services.findIndex(function (x) { return x.name === s.name; });
      if (i === -1) state.services.push(s);
      else state.services.splice(i, 1);
    }
    function totalPrice() {
      return state.services.reduce(function (sum, s) { return sum + s.price; }, 0);
    }
    function totalMins() {
      return state.services.reduce(function (sum, s) { return sum + (s.mins || 0); }, 0);
    }
    function formatMins(m) {
      if (!m) return '';
      const h = Math.floor(m / 60), mm = m % 60;
      if (h && mm) return h + 'h ' + mm + 'm';
      if (h) return h + 'h';
      return mm + ' min';
    }

    const prefersReduced = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let lastShownPrice = 0;
    function countUp(el, from, to) {
      if (!el) return;
      if (prefersReduced || from === to) { el.textContent = money(to); return; }
      const start = performance.now();
      const dur = 350;
      function frame(now) {
        const t = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        const val = Math.round(from + (to - from) * eased);
        el.textContent = money(val);
        if (t < 1) requestAnimationFrame(frame);
        else el.textContent = money(to);
      }
      requestAnimationFrame(frame);
    }
    function pulse(el) {
      if (!el || prefersReduced) return;
      el.classList.remove('pulse');
      void el.offsetWidth;
      el.classList.add('pulse');
    }

    const now = new Date();
    let calMonth = now.getMonth();
    let calYear = now.getFullYear();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    function updateRun() {
      if (!runTotalEl) return;
      const to = totalPrice();
      countUp(runTotalEl, lastShownPrice, to);
      if (to !== lastShownPrice) pulse(runTotalEl);
      lastShownPrice = to;
    }

    function canAdvance() {
      if (step === 0) return state.services.length > 0;
      if (step === 1) return !!state.stylist;
      if (step === 2) return !!(state.date && state.time);
      return true;
    }

    function refreshNav() {
      backBtn.disabled = step === 0;
      nextBtn.textContent = step === 3 ? 'Confirm booking' : 'Continue';
      nextBtn.disabled = !canAdvance();
    }

    function setStepper() {
      root.querySelectorAll('[data-dot]').forEach(function (d) {
        const i = +d.dataset.dot;
        d.classList.remove('active', 'done');
        if (i < step) {
          d.classList.add('done');
          d.innerHTML = '<i class="ti ti-check" style="font-size:14px"></i>';
        } else {
          d.textContent = i + 1;
          if (i === step) d.classList.add('active');
        }
      });
      root.querySelectorAll('[data-line]').forEach(function (l) {
        l.classList.toggle('done', +l.dataset.line < step);
      });
      root.querySelectorAll('[data-lbl]').forEach(function (l) {
        l.classList.toggle('active', +l.dataset.lbl === step);
      });
    }

    function renderService() {
      const count = state.services.length;
      const hint = count
        ? count + ' selected · add more or continue'
        : 'Select one or more treatments';
      panel.innerHTML = '<div class="panel-title">Choose your treatments</div>' +
                        '<div class="opts" id="o"></div>' +
                        '<div class="svc-summary" id="sum"></div>';
      const wrap = panel.querySelector('#o');
      SERVICES.forEach(function (s) {
        const el = document.createElement('div');
        el.className = 'opt' + (isSelected(s) ? ' sel' : '');
        el.innerHTML = '<div class="opt-name">' + s.name + '</div>' +
                       '<div class="opt-meta">' + s.meta + '</div>' +
                       '<div class="opt-price">from ' + money(s.price) + '</div>';
        el.onclick = function () {
          toggleService(s);
          renderService();
          updateRun();
          refreshNav();
        };
        wrap.appendChild(el);
      });
      renderSummary(panel.querySelector('#sum'));
    }

    function renderSummary(box) {
      if (!box) return;
      if (!state.services.length) {
        box.innerHTML = '<div class="svc-summary-empty">Select one or more treatments to begin.</div>';
        return;
      }
      let html = '<div class="svc-summary-head">Your selection</div><ul class="svc-summary-list">';
      state.services.forEach(function (s) {
        html += '<li><button class="svc-chip-remove" data-rm="' + s.name + '" aria-label="Remove ' + s.name + '">' +
                '<i class="ti ti-x" style="font-size:13px"></i></button>' +
                '<span class="svc-chip-name">' + s.name + '</span>' +
                '<span class="svc-chip-price">' + money(s.price) + '</span></li>';
      });
      html += '</ul><div class="svc-summary-foot">' +
              '<span><i class="ti ti-clock" style="font-size:13px;vertical-align:-2px"></i> ' +
              formatMins(totalMins()) + ' total</span>' +
              '<span class="svc-summary-total">' + money(totalPrice()) + '</span></div>';
      box.innerHTML = html;
      box.querySelectorAll('[data-rm]').forEach(function (btn) {
        btn.onclick = function () {
          const target = SERVICES.find(function (x) { return x.name === btn.dataset.rm; });
          if (target) { toggleService(target); renderService(); updateRun(); refreshNav(); }
        };
      });
    }

    function renderStylist() {
      panel.innerHTML = '<div class="panel-title">Pick your artist</div><div class="stylists" id="o"></div>';
      const wrap = panel.querySelector('#o');
      STYLISTS.forEach(function (s) {
        const el = document.createElement('div');
        el.className = 'stylist' + (state.stylist && state.stylist.id === s.id ? ' sel' : '');
        el.innerHTML = '<div class="stylist-av">' + s.init + '</div>' +
                       '<div class="stylist-name">' + s.name + '</div>' +
                       '<div class="stylist-role">' + s.role + '</div>';
        el.onclick = function () { state.stylist = s; renderStylist(); refreshNav(); };
        wrap.appendChild(el);
      });
    }

    function renderDate() {
      const monthName = new Date(calYear, calMonth, 1)
        .toLocaleString('en-US', { month: 'long', year: 'numeric' });
      let html = '<div class="panel-title">Select a date &amp; time</div>';
      html += '<div class="cal-head"><div class="cal-month">' + monthName + '</div>' +
              '<div class="cal-nav">' +
              '<button class="cal-btn" id="pm" aria-label="Previous month"><i class="ti ti-chevron-left" style="font-size:15px"></i></button>' +
              '<button class="cal-btn" id="nm" aria-label="Next month"><i class="ti ti-chevron-right" style="font-size:15px"></i></button>' +
              '</div></div><div class="days">';
      DAY_NAMES.forEach(function (d) { html += '<div class="dayname">' + d + '</div>'; });

      const first = new Date(calYear, calMonth, 1).getDay();
      const dim = new Date(calYear, calMonth + 1, 0).getDate();
      for (let i = 0; i < first; i++) html += '<div class="day off"></div>';
      for (let d = 1; d <= dim; d++) {
        const dt = new Date(calYear, calMonth, d);
        const off = dt < today;
        const sel = state.date && state.date.d === d && state.date.m === calMonth && state.date.y === calYear;
        html += '<div class="day' + (off ? ' off' : '') + (sel ? ' sel' : '') + '" ' +
                (off ? '' : 'data-d="' + d + '"') + '>' + d + '</div>';
      }
      html += '</div><div class="panel-title" style="margin-top:4px">Available times</div><div class="times" id="t"></div>';
      panel.innerHTML = html;

      panel.querySelector('#pm').onclick = function () {
        calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; } renderDate();
      };
      panel.querySelector('#nm').onclick = function () {
        calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; } renderDate();
      };
      panel.querySelectorAll('[data-d]').forEach(function (el) {
        el.onclick = function () {
          state.date = { d: +el.dataset.d, m: calMonth, y: calYear };
          renderDate(); refreshNav();
        };
      });
      const tw = panel.querySelector('#t');
      TIMES.forEach(function (t) {
        const el = document.createElement('div');
        el.className = 'time' + (state.time === t ? ' sel' : '');
        el.textContent = t;
        el.onclick = function () { state.time = t; renderDate(); refreshNav(); };
        tw.appendChild(el);
      });
    }

    function renderConfirm() {
      const dateStr = state.date
        ? new Date(state.date.y, state.date.m, state.date.d)
            .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
        : '';
      let html = '<div class="panel-title">Review your booking</div>';

      // Services — one row each
      html += '<div class="confirm-row"><div class="confirm-label">Services</div><div class="confirm-val' +
              (state.services.length ? '' : ' empty') + '">';
      if (state.services.length) {
        html += '<div class="confirm-svc-list">';
        state.services.forEach(function (s) {
          html += '<div class="confirm-svc"><span>' + s.name + '</span><span>' + money(s.price) + '</span></div>';
        });
        html += '</div>';
      } else {
        html += 'Not selected';
      }
      html += '</div></div>';

      const rows = [
        ['Artist', state.stylist ? state.stylist.name : null],
        ['Date', dateStr || null],
        ['Time', state.time || null],
        ['Duration', state.services.length ? formatMins(totalMins()) : null]
      ];
      rows.forEach(function (r) {
        const empty = r[1] == null;
        html += '<div class="confirm-row"><div class="confirm-label">' + r[0] + '</div>' +
                '<div class="confirm-val' + (empty ? ' empty' : '') + '">' +
                (empty ? 'Not selected' : r[1]) + '</div></div>';
      });

      html += '<div class="total"><div class="total-label">Estimated total</div>' +
              '<div class="total-val" id="confirm-total">$0</div></div>';
      html += '<div style="font-size:12px;color:var(--slate);margin-top:16px;line-height:1.6">' +
              'Final pricing is confirmed at the studio based on your customized treatment. ' +
              'We\u2019ll text a reminder before your visit.</div>';
      panel.innerHTML = html;
      countUp(panel.querySelector('#confirm-total'), 0, totalPrice());
    }

    function render() {
      setStepper();
      if (step === 0) renderService();
      else if (step === 1) renderStylist();
      else if (step === 2) renderDate();
      else renderConfirm();
      refreshNav();
    }

    function go(newStep) {
      if (prefersReduced) { step = newStep; render(); return; }
      panel.classList.add('leaving');
      setTimeout(function () {
        step = newStep;
        render();
        panel.classList.remove('leaving');
      }, 200);
    }

    function showSuccess() {
      panel.innerHTML =
        '<div class="success">' +
        '<div class="success-check"><i class="ti ti-check" style="font-size:30px"></i></div>' +
        '<div class="success-title">You\u2019re booked!</div>' +
        '<div class="success-text">A confirmation has been sent. ' +
        'We can\u2019t wait to see you at Niki Lash Studio.</div></div>';
      nextBtn.disabled = true; backBtn.disabled = true;
      root.querySelectorAll('[data-dot]').forEach(function (d) {
        d.classList.remove('active'); d.classList.add('done');
        d.innerHTML = '<i class="ti ti-check" style="font-size:14px"></i>';
      });
      root.querySelectorAll('[data-line]').forEach(function (l) { l.classList.add('done'); });
    }

    nextBtn.onclick = function () {
      if (step === 3) { showSuccess(); return; }
      if (canAdvance()) go(step + 1);
    };
    backBtn.onclick = function () { if (step > 0) go(step - 1); };

    render();
    updateRun();

    return {
      selectService: function (name) {
        const found = SERVICES.find(function (s) { return s.name === name; });
        if (found && !isSelected(found)) { state.services.push(found); }
        step = 0; render(); updateRun();
      }
    };
  }

  global.NikiBooking = { init: initBooking, SERVICES: SERVICES };
})(window);