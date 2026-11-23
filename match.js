// ===== FAKE SAMPLE DATA. Replace the names with real ones. =====

// Makes 11 sample players (we will replace with real lineups later)
function makeSquad(team) {
  const list = [];
  for (let i = 1; i <= 11; i++) {
    list.push({ no: i, name: team + " P" + i });
  }
  return list;
}

const matches = [
  { home: "Team A", away: "Team B", hs: 2, as: 1, status: "Full time",
    time: "Today 1:30 AM", league: "Sample League", stadium: "Sample Stadium", referee: "Sample Referee",
    homeForm: "3-4-1-2", awayForm: "4-3-3" },
  { home: "Team C", away: "Team D", hs: 0, as: 0, status: "Live 34'",
    time: "Today 4:00 AM", league: "Sample League", stadium: "Sample Arena", referee: "Sample Referee",
    homeForm: "4-4-2", awayForm: "4-2-3-1" },
  { home: "Team E", away: "Team F", hs: "-", as: "-", status: "Not started",
    time: "Today 8:00 PM", league: "Sample League", stadium: "Sample Park", referee: "Sample Referee",
    homeForm: "4-3-3", awayForm: "3-5-2" }
];

const standings = [
  { team: "Team A", p: 12, w: 9, d: 2, l: 1, pts: 29 },
  { team: "Team C", p: 12, w: 8, d: 2, l: 2, pts: 26 },
  { team: "Team B", p: 12, w: 7, d: 3, l: 2, pts: 24 },
  { team: "Team D", p: 12, w: 6, d: 3, l: 3, pts: 21 },
  { team: "Team E", p: 12, w: 4, d: 4, l: 4, pts: 16 },
  { team: "Team F", p: 12, w: 3, d: 2, l: 7, pts: 11 }
];

const pastMatches = [
  "Team A 1 - 0 Team C",
  "Team B 2 - 2 Team D",
  "Team E 0 - 3 Team A",
  "Team F 1 - 2 Team B"
];

let current = 0;        // which match is open
let teamSide = "home";  // which team's lineup is showing

// ===== BUILDING THE PAGE =====

function showMatchList() {
  let html = "";
  matches.forEach(function (m, i) {
    const active = i === current ? "active" : "";
    html += `<button class="match-chip ${active}" onclick="openMatch(${i})">${m.home} ${m.hs}-${m.as} ${m.away}</button>`;
  });
  document.getElementById("match-list").innerHTML = html;
}

function showHeader() {
  const m = matches[current];
  document.getElementById("match-header").innerHTML = `
    <div class="team-box"><div class="crest">${m.home[0]}</div>${m.home}</div>
    <div>
      <div class="mid-score">${m.hs} - ${m.as}</div>
      <div class="status">${m.status}</div>
    </div>
    <div class="team-box"><div class="crest">${m.away[0]}</div>${m.away}</div>
  `;
}

function showDetails() {
  const m = matches[current];
  document.getElementById("details").innerHTML = `
    <div class="info-row"><span>Kick-off</span><span>${m.time}</span></div>
    <div class="info-row"><span>Competition</span><span>${m.league}</span></div>
    <div class="info-row"><span>Stadium</span><span>${m.stadium}</span></div>
    <div class="info-row"><span>Referee</span><span>${m.referee}</span></div>
  `;
}

function showLineups() {
  const m = matches[current];
  const name = teamSide === "home" ? m.home : m.away;
  const formation = teamSide === "home" ? m.homeForm : m.awayForm;
  const players = makeSquad(name);

  // Split the 11 players into rows using the formation, e.g. 4-3-3
  const rows = [[players[0]]];
  let start = 1;
  formation.split("-").forEach(function (n) {
    rows.push(players.slice(start, start + Number(n)));
    start += Number(n);
  });

  let pitch = "";
  rows.forEach(function (row) {
    pitch += '<div class="pitch-row">';
    row.forEach(function (p) {
      pitch += `
        <div class="player">
          <div class="tip">${p.name} (No. ${p.no})</div>
          <div class="dot">${p.no}</div>
          <div class="pname">${p.name}</div>
        </div>`;
    });
    pitch += "</div>";
  });

  document.getElementById("lineups").innerHTML = `
    <div class="team-toggle">
      <button class="${teamSide === "home" ? "active" : ""}" onclick="pickTeam('home')">${m.home}</button>
      <button class="${teamSide === "away" ? "active" : ""}" onclick="pickTeam('away')">${m.away}</button>
    </div>
    <div class="formation">Formation: ${formation}</div>
    <div class="pitch">${pitch}</div>
  `;
}

function showStandings() {
  const m = matches[current];
  let rows = "";
  standings.forEach(function (t, i) {
    const hl = (t.team === m.home || t.team === m.away) ? "highlight" : "";
    rows += `<tr class="${hl}"><td>${i + 1}</td><td>${t.team}</td><td>${t.p}</td><td>${t.w}</td><td>${t.d}</td><td>${t.l}</td><td><b>${t.pts}</b></td></tr>`;
  });
  document.getElementById("standings").innerHTML = `
    <table>
      <tr><th>#</th><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>Pts</th></tr>
      ${rows}
    </table>
  `;
}

function showPastMatches() {
  let html = "";
  pastMatches.forEach(function (r) {
    html += `<div class="info-row">${r}</div>`;
  });
  document.getElementById("matches").innerHTML = html;
}

// ===== CLICK ACTIONS =====

function showAll() {
  showMatchList();
  showHeader();
  showDetails();
  showLineups();
  showStandings();
  showPastMatches();
}

function openMatch(i) {
  current = i;
  showAll();
}

function pickTeam(side) {
  teamSide = side;
  showLineups();
}

// Tabs: click a tab to show its panel
document.querySelectorAll(".tab").forEach(function (btn) {
  btn.addEventListener("click", function () {
    document.querySelectorAll(".tab").forEach(function (b) { b.classList.remove("active"); });
    document.querySelectorAll(".panel").forEach(function (p) { p.classList.remove("active"); });
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

showAll();