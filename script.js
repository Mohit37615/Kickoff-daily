// ----- SAMPLE DATA (used for anything that isn't real yet) -----

// Your hand-picked priority stories. Edit these yourself.
const featured = [
  { title: "Sample top story", summary: "Your pinned story goes here.", link: "#" }
];

const scores = [
  { home: "Team A", away: "Team B", homeScore: 2, awayScore: 1, status: "Full time" },
  { home: "Team C", away: "Team D", homeScore: 0, awayScore: 0, status: "Live 34'" },
  { home: "Team E", away: "Team F", homeScore: "-", awayScore: "-", status: "Starts 8:00 PM" }
];

const lineup = {
  match: "Team A vs Team B",
  homeName: "Team A",
  awayName: "Team B",
  home: ["Player 1", "Player 2", "Player 3", "Player 4", "Player 5", "Player 6",
         "Player 7", "Player 8", "Player 9", "Player 10", "Player 11"],
  away: ["Player 1", "Player 2", "Player 3", "Player 4", "Player 5", "Player 6",
         "Player 7", "Player 8", "Player 9", "Player 10", "Player 11"]
};

// Backup samples, only used if data/news.json is missing
const international = [
  { title: "Sample international headline", summary: "A national team story.", link: "#" }
];

const club = [
  { title: "Sample club headline", summary: "A club story.", link: "#" }
];

const leagues = [
  { title: "Premier League", summary: "England", link: "#" },
  { title: "La Liga", summary: "Spain", link: "#" },
  { title: "Serie A", summary: "Italy", link: "#" },
  { title: "Bundesliga", summary: "Germany", link: "#" },
  { title: "Ligue 1", summary: "France", link: "#" },
  { title: "MLS", summary: "USA", link: "#" },
  { title: "Saudi Pro League", summary: "Saudi Arabia", link: "#" },
  { title: "ISL", summary: "India", link: "#" }
];

// ----- FUNCTIONS THAT BUILD THE PAGE -----
// Each one first checks that its box exists on the current page.

function showNews(list, boxId) {
  const box = document.getElementById(boxId);
  if (!box) return;

  list.forEach(function (item) {
    const photo = item.image
      ? `<img src="${item.image}" alt="" loading="lazy" onerror="this.style.display='none'">`
      : `<div class="no-photo">⚽</div>`;
    const source = item.source ? `<span class="source">${item.source}</span>` : "";

    box.innerHTML += `
      <a class="news-card" href="${item.link}" target="_blank">
        ${photo}
        <div class="news-text">
          <h3>${item.title}</h3>
          <p>${item.summary}</p>
          ${source}
        </div>
      </a>
    `;
  });
}

function showScores(list) {
  const box = document.getElementById("scoreboard");
  if (!box) return;

  list.forEach(function (m) {
    box.innerHTML += `
      <div class="score-card">
        <span>${m.home}</span>
        <div>
          <div class="score">${m.homeScore} - ${m.awayScore}</div>
          <div class="status">${m.status}</div>
        </div>
        <span>${m.away}</span>
      </div>
    `;
  });
}

function showLineup(data) {
  const box = document.getElementById("lineup-box");
  if (!box) return;

  let homeList = "";
  data.home.forEach(function (p) { homeList += `<li>${p}</li>`; });

  let awayList = "";
  data.away.forEach(function (p) { awayList += `<li>${p}</li>`; });

  box.innerHTML = `
    <h3>${data.match}</h3>
    <div class="lineup-teams">
      <div class="lineup-team">
        <h4>${data.homeName}</h4>
        <ul>${homeList}</ul>
      </div>
      <div class="lineup-team">
        <h4>${data.awayName}</h4>
        <ul>${awayList}</ul>
      </div>
    </div>
  `;
}

// ----- LOAD REAL NEWS -----

async function loadNews() {
  try {
    const response = await fetch("data/news.json");
    return await response.json();
  } catch (error) {
    return null;   // no file yet, so the samples are used
  }
}

function showUpdated(news) {
  const box = document.getElementById("updated");
  if (box && news) box.textContent = "Last updated: " + news.updated;
}

// ----- RUN EVERYTHING -----

async function startPage() {
  const news = await loadNews();

  showNews(featured, "featured");
  showScores(scores);
  showLineup(lineup);
  showNews(news ? news.latest : [], "latest-news");
  showNews(news ? news.international : international, "international-news");
  showNews(news ? news.club : club, "club-news");
  showNews(leagues, "league-list");
  showUpdated(news);
}

startPage();