/* ================================================
   THE UPSIDE PROTOCOL — script.js  (v2)
   Timer · Step Tracking · Validation · Animations
   ================================================ */

(function () {
  "use strict";

  /* ── Constants ──────────────────────────────── */
  const TOTAL_SECONDS  = 45 * 60;
  const TIMER_KEY      = "upsideEndTime";
  const WARN_THRESHOLD = 5 * 60;
  const FAIL_PAGE      = "fail.html";

  // Steps that must be complete before accessing each page
  const ACCESS_RULES = {
    "dashboard.html": [],
    "clue1.html":     [],
    "morse.html":     [1, 2, 3],
    "breach.html":    [1, 2, 3, 4]
  };

  /* ── Utilities ──────────────────────────────── */
  function pad(n)  { return String(n).padStart(2, "0"); }
  function fmt(s)  { return pad(Math.floor(s / 60)) + ":" + pad(s % 60); }
  function page()  { return window.location.pathname.split("/").pop() || "index.html"; }

  function setV(id, visible) {
    const el = document.getElementById(id);
    if (el) el.style.display = visible ? "block" : "none";
  }

  /* ── Step storage ───────────────────────────── */
  function stepDone(n) { return localStorage.getItem("escStep" + n) === "1"; }
  function stepSet(n)  { localStorage.setItem("escStep" + n, "1"); }

  /* ── Timer ──────────────────────────────────── */
  function initTimer() {
    const pg = page();

    // Pages that don't need the timer widget or guard
    if (pg === "index.html" || pg === "" || pg === "fail.html") return;

    const endTime = parseInt(localStorage.getItem(TIMER_KEY), 10);
    if (!endTime || isNaN(endTime)) {
      window.location.href = "index.html";
      return;
    }

    // Step-based access guard
    const required = ACCESS_RULES[pg] || [];
    for (const n of required) {
      if (!stepDone(n)) {
        window.location.href = "dashboard.html";
        return;
      }
    }

    // Start countdown
    tick(endTime);
    const iv = setInterval(function () {
      if (!tick(endTime)) clearInterval(iv);
    }, 1000);
  }

  function tick(endTime) {
    const rem = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
    const el  = document.getElementById("timer");
    if (el) {
      el.textContent = "⏱ " + fmt(rem);
      el.classList.toggle("warning", rem <= WARN_THRESHOLD);
    }
    if (rem <= 0) {
      localStorage.removeItem(TIMER_KEY);
      window.location.href = FAIL_PAGE;
      return false;
    }
    return true;
  }

  /* ── Public: start mission (index.html) ──────── */
  window.startMission = function () {
    const endTime = Date.now() + TOTAL_SECONDS * 1000;
    localStorage.setItem(TIMER_KEY, endTime);
    // Reset any previous run's step data
    for (let i = 1; i <= 5; i++) localStorage.removeItem("escStep" + i);
    window.location.href = "dashboard.html";
  };

  /* ── Public: answer validation ──────────────── */
  window.checkAnswer = function (inputId, msgId, answer, onSuccess) {
    const inp = document.getElementById(inputId);
    const msg = document.getElementById(msgId);
    if (!inp || !msg) return;

    const val     = inp.value.trim().toUpperCase().replace(/\s+/g, " ");
    const correct = String(answer).trim().toUpperCase();

    if (val === correct) {
      msg.textContent = "✔ ACCESS GRANTED";
      msg.className   = "msg success";
      inp.disabled    = true;
      if (typeof onSuccess === "function") setTimeout(onSuccess, 600);
    } else {
      msg.textContent = "✘ SIGNAL REJECTED — TRY AGAIN";
      msg.className   = "msg error";
      inp.value = "";
      inp.focus();
    }
  };

  /* ── Public: mark a step complete ──────────── */
  window.markStep = function (n) { stepSet(n); };

  /* ── Public: dashboard refresh ─────────────── */
  window.refreshDashboard = function () {
    // Update checkboxes
    for (let i = 1; i <= 5; i++) {
      const row = document.getElementById("step" + i);
      if (!row) continue;
      const cb   = row.querySelector(".checkbox");
      const done = stepDone(i);
      row.classList.toggle("done", done);
      if (cb) cb.textContent = done ? "✔" : "[ ]";
    }
    // Show exactly the right action button
    setV("btnGoClue1",      !stepDone(2));
    setV("btnConfirmDrive", stepDone(2) && !stepDone(3));
    setV("btnGoMorse",      stepDone(3) && !stepDone(4));
    setV("btnGoBreach",     stepDone(4) && !stepDone(5));
    setV("msgMissionDone",  stepDone(5));
  };

  /* ── Public: story animation (index.html) ───── */
  window.runStory = function (lines, onComplete) {
    const box = document.getElementById("storyContainer");
    if (!box) return;
    lines.forEach(function (text, i) {
      setTimeout(function () {
        const p = document.createElement("p");
        p.className   = "story-line";
        p.textContent = text;
        box.appendChild(p);
        // Double-rAF to trigger CSS transition
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { p.classList.add("visible"); });
        });
        if (i === lines.length - 1 && typeof onComplete === "function") {
          setTimeout(onComplete, 1200);
        }
      }, 500 + i * 3000);
    });
  };

  /* ── Public: breach shutdown animation ─────── */
  window.runBreachSequence = function (onComplete) {
    const box   = document.getElementById("breachOutput");
    const steps = ["Stabilizing Signal...", "Closing Gate...", "Rebooting Core..."];
    if (!box) return;
    steps.forEach(function (text, i) {
      setTimeout(function () {
        const p = document.createElement("p");
        p.className   = "breach-line";
        p.textContent = text;
        box.appendChild(p);
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { p.classList.add("visible"); });
        });
        if (i === steps.length - 1 && typeof onComplete === "function") {
          setTimeout(onComplete, 1500);
        }
      }, i * 1800);
    });
  };

  /* ── Enter key fires the verify button ──────── */
  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      const btn = document.querySelector(".verify-btn");
      if (btn) btn.click();
    }
  });

  /* ── Boot ───────────────────────────────────── */
  document.addEventListener("DOMContentLoaded", initTimer);

})();
