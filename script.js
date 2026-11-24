// ================= HELPERS =================
const $ = (id) => document.getElementById(id);

// Makes text safe to put inside HTML
function esc(text) {
  return String(text == null ? "" : text).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

// Reads a data file. Gives back null if it is missing.
async function loadJSON(path) {
  try {
    const response = await fetch(path + "?v=" + Date.now());
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    return null;
  }
}

function timeAgo(seconds) {
  if (!seconds) return "";
  const diff = Date.now() / 1000 - seconds;
  if (diff < 3600) return Math.max(1, Math.round(diff / 60)) + "m ago";
  if (diff < 86400) return Math.round(diff / 3600) + "h ago";
  return Math.round(diff / 86400) + "d ago";
}

// BBC photos come small. Ask for a bigger copy and fall back if it fails.
function bigImage(url) {
  return (url || "").replace(/\/ace\/standard\/\d+\//, "/ace/standard/976/");
}

function picture(url, cls) {
  if (!url) return `<div class="${cls} ph"></div>`;
  const fallback = esc(url);
  return `<img class="${cls}" src="${esc(bigImage(url))}" alt="" loading="lazy"
    onerror="if(this.dataset.f!=='1'){this.dataset.f='1';this.src='${fallback}'}else{this.style.display='none'}">`;
}

function logo(url) {
  return url ? `<img class="logo" src="${esc(url)}" alt="" loading="lazy" onerror="this.style.display='none'">` : "";
}

// ================= HEADER AND FOOTER =================
const PAGES = [
  ["home", "Home", "index.html"],
  ["international", "International", "international.html"],
  ["club", "Club", "club.html"],
  ["leagues", "Leagues", "leagues.html"],
  ["scores", "Scores", "scores.html"]
];

function buildHeader() {
  const page = document.body.dataset.page;
  const links = PAGES.map(function (p) {
    return `<a href="${p[2]}" class="${p[0] === page ? "on" : ""}">${p[1]}</a>`;
  }).join("");
  $("site-header").innerHTML = `
    <header class="topbar">
      <a class="brand" href="index.html">KICKOFF<span>DAILY</span></a>
      <nav>${links}</nav>
    </header>`;
}

function buildFooter(news) {
  const updated = news && news.updated ? "News last updated: " + esc(news.updated) + ". " : "";
  $("site-footer").innerHTML = `<footer>${updated}Headlines from BBC Sport, Sky Sports, The Guardian and ESPN. Click a story to read it on the original site.</footer>`;
}

// ================= NEWS =================
function newsCard(item) {
  return `
    <a class="card" href="${esc(item.link)}" target="_blank" rel="noopener">
      <div class="thumb">${picture(item.image, "thumb-img")}<span class="chip">${esc(item.source || "")}</span></div>
      <div class="card-body">
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.summary)}</p>
        <span class="meta">${timeAgo(item.time)}</span>
      </div>
    </a>`;
}

function showNews(list, boxId) {
  const box = $(boxId);
  if (!box) return;
  box.innerHTML = list && list.length
    ? list.map(newsCard).join("")
    : `<p class="empty" style="grid-column:1/-1">No stories yet. Check back soon.</p>`;
}

// ================= TOP STORY SLIDER =================
function buildHero(items) {
  const box = $("hero");
  if (!box) return;
  if (!items.length) { box.remove(); return; }

  const slides = items.map(function (it, i) {
    return `
      <a class="slide${i === 0 ? " on" : ""}" href="${esc(it.link)}" target="_blank" rel="noopener">
        ${picture(it.image, "slide-bg")}
        <div class="slide-shade"></div>
        <div class="slide-text">
          <span class="tag">TOP STORY</span>
          <h2>${esc(it.title)}</h2>
          <p>${esc(it.summary)}</p>
          <span class="meta">${esc(it.source || "")} ${it.time ? "· " + timeAgo(it.time) : ""}</span>
        </div>
      </a>`;
  }).join("");

  const dots = items.map(function (_, i) {
    return `<button class="dot${i === 0 ? " on" : ""}" data-i="${i}" aria-label="Story ${i + 1}"></button>`;
  }).join("");

  box.innerHTML = slides +
    `<button class="arrow prev" aria-label="Previous">‹</button>
     <button class="arrow next" aria-label="Next">›</button>
     <div class="dots">${dots}</div>`;

  const slideEls = Array.from(box.querySelectorAll(".slide"));
  const dotEls = Array.from(box.querySelectorAll(".dot"));
  let current = 0;
  let timer;

  function go(n) {
    current = (n + slideEls.length) % slideEls.length;
    slideEls.forEach(function (s, i) { s.classList.toggle("on", i === current); });
    dotEls.forEach(function (d, i) { d.classList.toggle("on", i === current); });
  }
  function play() { clearInterval(timer); timer = setInterval(function () { go(current + 1); }, 6000); }

  box.querySelector(".prev").onclick = function () { go(current - 1); play(); };
  box.querySelector(".next").onclick = function () { go(current + 1); play(); };
  dotEls.forEach(function (d) { d.onclick = function () { go(Number(d.dataset.i)); play(); }; });
  box.addEventListener("mouseenter", function () { clearInterval(timer); });
  box.addEventListener("mouseleave", play);

  // Swipe on phones
  let startX = 0;
  box.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
  box.addEventListener("touchend", function (e) {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) { go(dx < 0 ? current + 1 : current - 1); play(); }
  });

  if (items.length > 1) play();
}

// ================= MATCHES =================
function localTime(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function statusInfo(m) {
  const s = m.status;
  if (["1H", "2H", "ET", "P", "LIVE", "BT"].indexOf(s) > -1) return { text: m.minute ? m.minute + "'" : "LIVE", live: true };
  if (s === "HT") return { text: "HT", live: true };
  if (["FT", "AET", "PEN"].indexOf(s) > -1) return { text: "FT", live: false };
  if (s === "PST") return { text: "Postponed", live: false };
  if (s === "CANC") return { text: "Cancelled", live: false };
  return { text: localTime(m.kickoff), live: false };
}

function scoreText(m) {
  return m.hs == null ? "–" : m.hs + " – " + m.as;
}

function matchRow(m) {
  const st = statusInfo(m);
  return `
    <a class="match" href="match.html?id=${encodeURIComponent(m.id)}">
      <span class="m-status${st.live ? " live" : ""}">${esc(st.text)}</span>
      <span class="m-team">${logo(m.homeLogo)}<span>${esc(m.home)}</span></span>
      <span class="m-score">${scoreText(m)}</span>
      <span class="m-team away"><span>${esc(m.away)}</span>${logo(m.awayLogo)}</span>
    </a>`;
}

function miniCard(m) {
  const st = statusInfo(m);
  return `
    <a class="mini" href="match.html?id=${encodeURIComponent(m.id)}">
      <span class="m-status${st.live ? " live" : ""}">${esc(st.text)}</span>
      <div class="row"><span>${logo(m.homeLogo)}${esc(m.home)}</span><span>${m.hs == null ? "" : m.hs}</span></div>
      <div class="row"><span>${logo(m.awayLogo)}${esc(m.away)}</span><span>${m.as == null ? "" : m.as}</span></div>
    </a>`;
}

function showScoresPage(scores) {
  const box = $("scores-list");
  if (!box) return;
  const matches = scores && scores.matches ? scores.matches : [];
  if (!matches.length) {
    box.innerHTML = `<p class="empty">No matches to show right now. Scores refresh every hour.</p>`;
    return;
  }
  const groups = {};
  matches.forEach(function (m) {
    if (!groups[m.league]) groups[m.league] = { logo: m.leagueLogo, list: [] };
    groups[m.league].list.push(m);
  });
  box.innerHTML = Object.keys(groups).map(function (name) {
    const g = groups[name];
    g.list.sort(function (a, b) { return String(a.kickoff).localeCompare(String(b.kickoff)); });
    return `<section class="league-block">
      <div class="league-head">${logo(g.logo)}${esc(name)}</div>
      ${g.list.map(matchRow).join("")}
    </section>`;
  }).join("");
}

// ================= STANDINGS =================
function tableHTML(rows, highlight) {
  const body = rows.map(function (r) {
    const hl = highlight && highlight.indexOf(r.team) > -1 ? "hl" : "";
    return `<tr class="${hl}">
      <td>${r.rank}</td>
      <td class="team-cell">${logo(r.logo)}${esc(r.team)}</td>
      <td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gd}</td>
      <td class="pts">${r.pts}</td>
    </tr>`;
  }).join("");
  return `<div class="table-wrap"><table>
    <tr><th>#</th><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th></tr>
    ${body}
  </table></div>`;
}

function showLeaguesPage(standings) {
  const tabs = $("league-tabs");
  const table = $("league-table");
  if (!tabs || !table) return;
  const leagues = standings && standings.leagues ? standings.leagues : [];
  if (!leagues.length) {
    table.innerHTML = `<p class="empty">League tables are not available yet.</p>`;
    return;
  }
  function pick(i) {
    tabs.innerHTML = leagues.map(function (l, n) {
      return `<button class="tab${n === i ? " on" : ""}" data-i="${n}">${esc(l.name)}</button>`;
    }).join("");
    Array.from(tabs.querySelectorAll(".tab")).forEach(function (b) {
      b.onclick = function () { pick(Number(b.dataset.i)); };
    });
    table.innerHTML = tableHTML(leagues[i].rows, null);
  }
  pick(0);
}

// ================= MATCH PAGE =================
function pitchHTML(side) {
  if (!side || !side.startXI || side.startXI.length < 11) {
    return `<p class="empty">Lineup not announced yet. Lineups usually appear about an hour before kick-off.</p>`;
  }
  const parts = (side.formation || "").split("-").map(Number).filter(function (n) { return n > 0; });
  const total = parts.reduce(function (a, b) { return a + b; }, 0);
  const rows = [[side.startXI[0]]];
  if (total === 10) {
    let i = 1;
    parts.forEach(function (n) { rows.push(side.startXI.slice(i, i + n)); i += n; });
  } else {
    rows.push(side.startXI.slice(1));
  }
  // Goalkeeper at the bottom, attackers at the top
  const pitchRows = rows.slice().reverse().map(function (row) {
    return `<div class="pitch-row">${row.map(function (p) {
      return `<div class="player">
        <div class="tip">${esc(p.name)} · ${esc(p.pos || "")}</div>
        <div class="dot-no">${esc(p.no)}</div>
        <div class="p-name">${esc(p.name)}</div>
      </div>`;
    }).join("")}</div>`;
  }).join("");

  const subs = (side.subs || []).map(function (p) {
    return `<span class="sub"><b>${esc(p.no)}</b>${esc(p.name)}</span>`;
  }).join("");

  return `<div class="formation">Formation: ${esc(side.formation || "-")}</div>
    <div class="pitch">${pitchRows}</div>
    ${subs ? `<h3 style="margin:22px 0 4px">Substitutes</h3><div class="subs">${subs}</div>` : ""}`;
}

function showMatchPage(scores, standings) {
  const head = $("match-head");
  if (!head) return;
  const id = new URLSearchParams(location.search).get("id");
  const matches = scores && scores.matches ? scores.matches : [];
  const m = matches.find(function (x) { return String(x.id) === String(id); });
  if (!m) {
    head.innerHTML = `<p class="empty" style="grid-column:1/-1">Match not found. Only current matches are listed. <a href="scores.html" style="color:var(--accent)">Back to scores</a></p>`;
    return;
  }
  const st = statusInfo(m);
  head.innerHTML = `
    <div class="mh-team">${logo(m.homeLogo)}<span>${esc(m.home)}</span></div>
    <div><div class="mh-score">${scoreText(m)}</div><div class="mh-status${st.live ? " live" : ""}">${esc(st.text)}</div></div>
    <div class="mh-team">${logo(m.awayLogo)}<span>${esc(m.away)}</span></div>`;
  $("match-comp").textContent = m.league || "";
  document.title = m.home + " vs " + m.away + " | Kickoff Daily";

  let side = "home";
  function drawLineups() {
    const lineups = m.lineups || {};
    $("tab-lineups").innerHTML = `
      <div class="team-toggle">
        <button class="tab${side === "home" ? " on" : ""}" data-side="home">${esc(m.home)}</button>
        <button class="tab${side === "away" ? " on" : ""}" data-side="away">${esc(m.away)}</button>
      </div>${pitchHTML(lineups[side])}`;
    Array.from($("tab-lineups").querySelectorAll("[data-side]")).forEach(function (b) {
      b.onclick = function () { side = b.dataset.side; drawLineups(); };
    });
  }
  drawLineups();

  const league = standings && standings.leagues
    ? standings.leagues.find(function (l) { return String(l.id) === String(m.leagueId); }) : null;
  $("tab-standings").innerHTML = league
    ? tableHTML(league.rows, [m.home, m.away])
    : `<p class="empty">No table available for this competition.</p>`;

  const kick = m.kickoff ? new Date(m.kickoff).toLocaleString([], { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "-";
  $("tab-details").innerHTML = `
    <div class="info-row"><span>Kick-off</span><span>${esc(kick)}</span></div>
    <div class="info-row"><span>Competition</span><span>${esc(m.league || "-")}</span></div>
    <div class="info-row"><span>Venue</span><span>${esc(m.venue || "-")}</span></div>
    <div class="info-row"><span>Referee</span><span>${esc(m.referee || "-")}</span></div>`;

  Array.from(document.querySelectorAll("[data-tab]")).forEach(function (btn) {
    btn.onclick = function () {
      Array.from(document.querySelectorAll("[data-tab]")).forEach(function (b) { b.classList.remove("on"); });
      Array.from(document.querySelectorAll(".tab-panel")).forEach(function (p) { p.hidden = true; });
      btn.classList.add("on");
      $("tab-" + btn.dataset.tab).hidden = false;
    };
  });
}

// ================= START =================
async function init() {
  buildHeader();
  const page = document.body.dataset.page;
  const news = await loadJSON("data/news.json");
  const scores = await loadJSON("data/scores.json");
  const standings = await loadJSON("data/standings.json");

  if (page === "home") {
    const featured = (await loadJSON("data/featured.json")) || [];
    const latest = news && news.latest ? news.latest : [];
    const heroItems = featured.concat(latest.filter(function (i) { return i.image; })).slice(0, 5);
    buildHero(heroItems);
    const used = heroItems.map(function (i) { return i.link; });
    showNews(latest.filter(function (i) { return used.indexOf(i.link) === -1; }), "latest-news");

    const today = scores && scores.matches ? scores.matches.slice(0, 12) : [];
    if (today.length) {
      $("today-strip").innerHTML = today.map(miniCard).join("");
    } else if ($("today-section")) {
      $("today-section").remove();
    }
  }
  if (page === "international") showNews(news && news.international, "international-news");
  if (page === "club") showNews(news && news.club, "club-news");
  if (page === "leagues") showLeaguesPage(standings);
  if (page === "scores") showScoresPage(scores);
  if (page === "match") showMatchPage(scores, standings);

  buildFooter(news);
}

init();
