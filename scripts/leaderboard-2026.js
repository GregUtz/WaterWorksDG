(function () {
  'use strict';

  var snapshot = window.WW_LEADERBOARD_2026;
  if (!snapshot) {
    return;
  }

  var sourceStatus = document.querySelector('[data-source-status]');
  var statsRoot = document.querySelector('[data-season-stats]');
  var podiumRoot = document.querySelector('[data-podium]');
  var tableBody = document.querySelector('[data-leaderboard-body]');
  var resultsSummary = document.querySelector('[data-results-summary]');
  var controls = document.querySelector('[data-leaderboard-controls]');
  var searchInput = document.getElementById('player-search');
  var minimumRounds = document.getElementById('minimum-rounds');
  var sortSelect = document.getElementById('leaderboard-sort');
  var data = normalizeData(snapshot);

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function normalizeData(raw) {
    return {
      spreadsheetId: raw.spreadsheetId,
      syncedAt: raw.syncedAt,
      dates: raw.dates || [],
      players: (raw.players || []).map(function (player) {
        var scores = (player.scores || []).map(function (score) {
          return Number.isFinite(Number(score)) && score !== null && score !== '' ? Number(score) : null;
        });
        var numericScores = scores.filter(Number.isFinite);
        return {
          name: player.name,
          weeks: Number(player.weeks) || numericScores.length,
          average: Number(player.average) || average(numericScores),
          scores: scores,
          best: numericScores.length ? Math.min.apply(null, numericScores) : null,
          numericScores: numericScores
        };
      })
    };
  }

  function average(values) {
    if (!values.length) {
      return null;
    }
    return values.reduce(function (sum, value) { return sum + value; }, 0) / values.length;
  }

  function lastCompletedIndex() {
    for (var index = data.dates.length - 1; index >= 0; index -= 1) {
      if (data.players.some(function (player) { return Number.isFinite(player.scores[index]); })) {
        return index;
      }
    }
    return -1;
  }

  function shortDate(value) {
    var parts = String(value).split('/');
    if (parts.length < 2) {
      return value;
    }
    var date = new Date(Number(parts[2] || 2026), Number(parts[0]) - 1, Number(parts[1]));
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function recentForm(player) {
    var scores = player.numericScores;
    if (scores.length < 6) {
      return { className: 'building', label: 'Building', detail: scores.length + ' rounds' };
    }
    var recent = average(scores.slice(-3));
    var prior = average(scores.slice(-6, -3));
    var delta = recent - prior;
    if (delta <= -0.5) {
      return { className: 'improving', label: '↓ ' + Math.abs(delta).toFixed(1), detail: 'lower last 3' };
    }
    if (delta >= 0.5) {
      return { className: 'cooling', label: '↑ ' + delta.toFixed(1), detail: 'higher last 3' };
    }
    return { className: 'steady', label: 'Steady', detail: 'last 3 rounds' };
  }

  function rankedPlayers(players, sortKey) {
    return players.slice().sort(function (a, b) {
      if (sortKey === 'rounds') {
        return b.weeks - a.weeks || a.average - b.average || a.name.localeCompare(b.name);
      }
      if (sortKey === 'best') {
        return (a.best == null ? Infinity : a.best) - (b.best == null ? Infinity : b.best) || a.average - b.average;
      }
      if (sortKey === 'latest') {
        var latestIndex = lastCompletedIndex();
        var aLatest = a.scores[latestIndex];
        var bLatest = b.scores[latestIndex];
        return (aLatest == null ? Infinity : aLatest) - (bLatest == null ? Infinity : bLatest) || a.average - b.average;
      }
      if (sortKey === 'name') {
        return a.name.localeCompare(b.name);
      }
      return a.average - b.average || b.weeks - a.weeks || a.name.localeCompare(b.name);
    });
  }

  function renderStats() {
    var scoreCount = data.players.reduce(function (total, player) { return total + player.numericScores.length; }, 0);
    var qualified = data.players.filter(function (player) { return player.weeks >= 5; }).length;
    var leader = rankedPlayers(data.players, 'rounds')[0];
    var weeklyAttendance = data.dates.map(function (_, index) {
      return data.players.filter(function (player) { return Number.isFinite(player.scores[index]); }).length;
    }).filter(function (attendance) { return attendance > 0; });
    var averageAttendance = average(weeklyAttendance);
    var cards = [
      { value: data.players.length, label: 'Players recorded' },
      { value: scoreCount, label: 'Scores logged' },
      { value: qualified, label: 'Players with 5+ weeks' },
      { value: averageAttendance == null ? '—' : averageAttendance.toFixed(1), label: 'Average attendance' }
    ];
    statsRoot.innerHTML = cards.map(function (card) {
      return '<article class="leaderboard-stat"><strong>' + escapeHtml(card.value) + '</strong><span>' + escapeHtml(card.label) + '</span></article>';
    }).join('');
    if (leader) {
      statsRoot.setAttribute('aria-label', 'Season summary. Current participation leader is ' + leader.name + ' with ' + leader.weeks + ' weeks played.');
    }
  }

  function renderPodium() {
    var leaders = rankedPlayers(data.players, 'rounds').slice(0, 3);
    var order = [leaders[1], leaders[0], leaders[2]];
    podiumRoot.innerHTML = order.map(function (player, displayIndex) {
      if (!player) {
        return '';
      }
      var place = displayIndex === 1 ? 1 : (displayIndex === 0 ? 2 : 3);
      return '<article class="podium-card podium-place-' + place + '">' +
        '<span class="podium-rank">' + place + '</span>' +
        '<div><h3>' + escapeHtml(player.name) + '</h3><p><strong>' + player.weeks + '</strong> weeks · ' + player.average.toFixed(1) + ' average</p></div>' +
        '</article>';
    }).join('');
  }

  function renderScoreHistory(player) {
    var latestIndex = lastCompletedIndex();
    return data.dates.slice(0, latestIndex + 1).map(function (date, index) {
      var score = player.scores[index];
      return '<span class="history-score' + (Number.isFinite(score) ? '' : ' no-score') + '">' +
        '<small>' + escapeHtml(shortDate(date)) + '</small>' +
        '<strong>' + (Number.isFinite(score) ? score : '—') + '</strong>' +
        '</span>';
    }).join('');
  }

  function renderTable() {
    var query = searchInput.value.trim().toLowerCase();
    var min = Number(minimumRounds.value);
    var sortKey = sortSelect.value;
    var filtered = data.players.filter(function (player) {
      return player.weeks >= min && (!query || player.name.toLowerCase().indexOf(query) !== -1);
    });
    var players = rankedPlayers(filtered, sortKey);
    var latestIndex = lastCompletedIndex();

    resultsSummary.textContent = players.length + (players.length === 1 ? ' player' : ' players');
    if (!players.length) {
      tableBody.innerHTML = '<tr><td colspan="8" class="leaderboard-empty">No players match those filters.</td></tr>';
      return;
    }

    tableBody.innerHTML = players.map(function (player, index) {
      var form = recentForm(player);
      var latest = latestIndex >= 0 ? player.scores[latestIndex] : null;
      var detailId = 'player-detail-' + index;
      var lastFive = player.numericScores.slice(-5);
      return '<tr class="player-row">' +
        '<td class="rank-cell"><span>' + (index + 1) + '</span></td>' +
        '<th scope="row"><button type="button" class="player-name" data-detail-toggle="' + detailId + '" aria-expanded="false" aria-controls="' + detailId + '">' + escapeHtml(player.name) + '</button></th>' +
        '<td class="numeric-cell"><strong>' + player.weeks + '</strong></td>' +
        '<td class="numeric-cell average-cell"><strong>' + player.average.toFixed(1) + '</strong></td>' +
        '<td class="numeric-cell desktop-score-column">' + (player.best == null ? '—' : player.best) + '</td>' +
        '<td class="numeric-cell desktop-score-column">' + (latest == null ? '—' : latest) + '</td>' +
        '<td class="trend-cell"><span class="form-badge ' + form.className + '">' + form.label + '</span><small>' + form.detail + '</small></td>' +
        '<td class="details-cell"><button type="button" class="details-button" data-detail-toggle="' + detailId + '" aria-expanded="false" aria-controls="' + detailId + '" aria-label="Show weekly scores for ' + escapeHtml(player.name) + '"><i class="fa fa-chevron-down"></i></button></td>' +
        '</tr>' +
        '<tr class="player-detail-row" id="' + detailId + '" hidden><td colspan="8"><div class="player-detail-content">' +
          '<div class="player-detail-summary"><strong>Recent scores</strong><span>' + escapeHtml(lastFive.join(' · ') || 'No scores') + '</span></div>' +
          '<div class="score-history" aria-label="Weekly scores for ' + escapeHtml(player.name) + '">' + renderScoreHistory(player) + '</div>' +
        '</div></td></tr>';
    }).join('');
  }

  function toggleDetail(button) {
    var detailId = button.getAttribute('data-detail-toggle');
    var detail = document.getElementById(detailId);
    var expanded = button.getAttribute('aria-expanded') === 'true';
    document.querySelectorAll('[data-detail-toggle="' + detailId + '"]').forEach(function (control) {
      control.setAttribute('aria-expanded', String(!expanded));
    });
    detail.hidden = expanded;
  }

  function parseCsv(text) {
    var rows = [];
    var row = [];
    var value = '';
    var quoted = false;
    for (var index = 0; index < text.length; index += 1) {
      var character = text[index];
      if (quoted) {
        if (character === '"' && text[index + 1] === '"') {
          value += '"';
          index += 1;
        } else if (character === '"') {
          quoted = false;
        } else {
          value += character;
        }
      } else if (character === '"') {
        quoted = true;
      } else if (character === ',') {
        row.push(value);
        value = '';
      } else if (character === '\n') {
        row.push(value.replace(/\r$/, ''));
        rows.push(row);
        row = [];
        value = '';
      } else {
        value += character;
      }
    }
    if (value || row.length) {
      row.push(value);
      rows.push(row);
    }
    return rows;
  }

  function csvToData(text) {
    var rows = parseCsv(text);
    if (!rows.length || rows[0][0] !== 'Player') {
      throw new Error('Unexpected master sheet response');
    }
    var dates = rows[0].slice(3).filter(Boolean);
    var players = rows.slice(1).filter(function (row) { return row[0]; }).map(function (row) {
      return {
        name: row[0],
        weeks: Number(row[1]) || 0,
        average: Number(row[2]) || null,
        scores: dates.map(function (_, index) {
          var value = row[index + 3];
          return value && value !== '*' && Number.isFinite(Number(value)) ? Number(value) : null;
        })
      };
    });
    return normalizeData({ spreadsheetId: snapshot.spreadsheetId, dates: dates, players: players, syncedAt: new Date().toISOString() });
  }

  function refreshView() {
    renderStats();
    renderPodium();
    renderTable();
  }

  function loadLiveData() {
    var url = 'https://docs.google.com/spreadsheets/d/' + encodeURIComponent(snapshot.spreadsheetId) + '/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent(snapshot.sheet) + '&range=A1:AC963&_=' + Date.now();
    return fetch(url, { cache: 'no-store' })
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Master sheet unavailable');
        }
        return response.text();
      })
      .then(function (text) {
        data = csvToData(text);
        sourceStatus.textContent = 'Live master sheet · updated now';
        sourceStatus.classList.add('is-live');
        refreshView();
      })
      .catch(function () {
        sourceStatus.textContent = 'Master sheet snapshot · Jul 30';
      });
  }

  controls.addEventListener('input', renderTable);
  controls.addEventListener('change', renderTable);
  controls.addEventListener('reset', function () {
    window.setTimeout(renderTable, 0);
  });
  tableBody.addEventListener('click', function (event) {
    var button = event.target.closest('[data-detail-toggle]');
    if (button) {
      toggleDetail(button);
    }
  });

  sourceStatus.textContent = 'Master sheet snapshot · Jul 30';
  refreshView();
  loadLiveData();
}());
