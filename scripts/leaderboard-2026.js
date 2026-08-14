(function () {
  'use strict';

  var snapshot = window.WW_LEADERBOARD_2026;
  if (!snapshot) {
    return;
  }

  var statsRoot = document.querySelector('[data-season-stats]');
  var tableBody = document.querySelector('[data-leaderboard-body]');
  var resultsSummary = document.querySelector('[data-results-summary]');
  var controls = document.querySelector('[data-leaderboard-controls]');
  var searchInput = document.getElementById('player-search');
  var minimumRounds = document.getElementById('minimum-rounds');
  var sortSelect = document.getElementById('leaderboard-sort');
  var filterToggle = document.querySelector('[data-leaderboard-filter-toggle]');
  var filterSummary = document.querySelector('[data-leaderboard-filter-summary]');
  var mobileControlsQuery = window.matchMedia('(max-width: 700px)');
  var data = normalizeData(snapshot);
  var eventUrlsByDate = {
    '4/2/2026': 'https://udisc.com/events/kcdg-summer-weeklies-water-works-thursdays-UJOsXR/leaderboard',
    '4/9/2026': 'https://udisc.com/events/kcdg-summer-weeklies-water-works-thursdays-ZFlCcA/leaderboard',
    '4/16/2026': 'https://udisc.com/events/kcdg-summer-weeklies-water-works-thursdays-DW96C9/leaderboard',
    '4/23/2026': 'https://udisc.com/events/kcdg-summer-weeklies-water-works-thursdays-j8zf0V/leaderboard',
    '4/30/2026': 'https://udisc.com/events/kcdg-summer-weeklies-water-works-thursdays-zaoEh1/leaderboard',
    '5/7/2026': 'https://udisc.com/events/kcdg-summer-weeklies-water-works-thursdays-YkOSPa/leaderboard',
    '5/14/2026': 'https://udisc.com/events/kcdg-summer-weeklies-water-works-thursdays-SfDOOx/leaderboard',
    '5/21/2026': 'https://udisc.com/events/kcdg-summer-weeklies-water-works-thursdays-L9Mjhn/leaderboard',
    '5/28/2026': 'https://udisc.com/events/kcdg-summer-weeklies-water-works-thursdays-OsIIho/leaderboard',
    '6/4/2026': 'https://udisc.com/events/kcdg-summer-weeklies-water-works-thursdays-foTdQt/leaderboard',
    '6/11/2026': 'https://udisc.com/events/kcdg-summer-weeklies-water-works-thursdays-bm7VF2/leaderboard',
    '6/18/2026': 'https://udisc.com/events/kcdg-summer-weeklies-water-works-thursdays-YG4mgB/leaderboard',
    '7/2/2026': 'https://udisc.com/events/kcdg-summer-weeklies-water-works-thursdays-NczbJd/leaderboard',
    '7/9/2026': 'https://udisc.com/events/kcdg-summer-weeklies-water-works-thursdays-Lv4NIl/leaderboard',
    '7/16/2026': 'https://udisc.com/events/kcdg-summer-weeklies-water-works-thursdays-MESu8q/leaderboard',
    '7/23/2026': 'https://udisc.com/events/kcdg-summer-weeklies-water-works-thursdays-TgFwtc/leaderboard',
    '7/30/2026': 'https://udisc.com/events/kcdg-summer-weeklies-water-works-thursdays-RtpEfc/leaderboard',
    '8/6/2026': 'https://udisc.com/events/kcdg-summer-weeklies-water-works-thursdays-QzQeuA/leaderboard',
    '8/13/2026': 'https://udisc.com/events/kcdg-summer-weeklies-water-works-thursdays-lGoJMi/leaderboard'
  };

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
          if (String(score).trim().toUpperCase() === 'DNF') {
            return 'DNF';
          }
          return Number.isFinite(Number(score)) && score !== null && score !== '' ? Number(score) : null;
        });
        var numericScores = scores.filter(Number.isFinite);
        var attendanceWeeks = scores.filter(countsAsAttendance).length;
        return {
          name: player.name,
          weeks: attendanceWeeks || Number(player.weeks) || numericScores.length,
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

  function countsAsAttendance(score) {
    return Number.isFinite(score) || score === 'DNF';
  }

  function lastCompletedIndex() {
    for (var index = data.dates.length - 1; index >= 0; index -= 1) {
      if (data.players.some(function (player) { return countsAsAttendance(player.scores[index]); })) {
        return index;
      }
    }
    return -1;
  }

  function completedWeekCount() {
    return data.dates.reduce(function (total, _, index) {
      var completed = data.players.some(function (player) {
        return countsAsAttendance(player.scores[index]);
      });
      return total + (completed ? 1 : 0);
    }, 0);
  }

  // 2026 qualifying schedule after the cancelled June 25 league:
  // calendar weeks 19–26 require 12, 13, 14, 14, 15, 16, 16, and 17 counted appearances.
  function qualifyingWeekCutoff() {
    return Math.ceil(completedWeekCount() * 2 / 3);
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
    if (scores.length < 4) {
      return { className: 'building', label: 'Building', detail: scores.length + ' rounds' };
    }
    var recent = average(scores.slice(-2));
    var prior = average(scores.slice(-4, -2));
    var delta = recent - prior;
    if (delta <= -0.5) {
      return { className: 'improving', label: '↓ ' + Math.abs(delta).toFixed(1), detail: 'lower last 2' };
    }
    if (delta >= 0.5) {
      return { className: 'cooling', label: '↑ ' + delta.toFixed(1), detail: 'higher last 2' };
    }
    return { className: 'steady', label: 'Steady', detail: 'last 2 rounds' };
  }

  function rankedPlayers(players, sortKey) {
    return players.slice().sort(function (a, b) {
      if (sortKey === 'cut') {
        var cutoff = qualifyingWeekCutoff();
        var aQualified = a.weeks >= cutoff;
        var bQualified = b.weeks >= cutoff;
        if (aQualified !== bQualified) {
          return aQualified ? -1 : 1;
        }
        if (aQualified) {
          return a.average - b.average || b.weeks - a.weeks || a.name.localeCompare(b.name);
        }
        return b.weeks - a.weeks || a.average - b.average || a.name.localeCompare(b.name);
      }
      if (sortKey === 'rounds') {
        return b.weeks - a.weeks || a.average - b.average || a.name.localeCompare(b.name);
      }
      if (sortKey === 'best') {
        return (a.best == null ? Infinity : a.best) - (b.best == null ? Infinity : b.best) || a.average - b.average;
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
      return data.players.filter(function (player) { return countsAsAttendance(player.scores[index]); }).length;
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

  function renderScoreHistory(player) {
    var latestIndex = lastCompletedIndex();
    return data.dates.slice(0, latestIndex + 1).map(function (date, index) {
      return { date: date, index: index };
    }).filter(function (week) {
      return data.players.some(function (seasonPlayer) {
        return countsAsAttendance(seasonPlayer.scores[week.index]);
      });
    }).map(function (week) {
      var score = player.scores[week.index];
      var eventUrl = eventUrlsByDate[week.date];
      var isDnf = score === 'DNF';
      var scoreClass = Number.isFinite(score) || isDnf ? '' : ' no-score';
      if (isDnf) {
        scoreClass += ' dnf';
      }
      var scoreMarkup = '<small>' + escapeHtml(shortDate(week.date)) + '</small>' +
        '<strong>' + (Number.isFinite(score) ? score : (isDnf ? 'DNF' : '—')) + '</strong>';
      if (!eventUrl) {
        return '<span class="history-score' + scoreClass + '">' + scoreMarkup + '</span>';
      }
      return '<a class="history-score' + scoreClass + '" href="' + escapeHtml(eventUrl) + '" target="_blank" rel="noopener" aria-label="Open the ' + escapeHtml(shortDate(week.date)) + ' UDisc event for ' + escapeHtml(player.name) + '">' +
        scoreMarkup + '</a>';
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
    var completedWeeks = completedWeekCount();
    var cutLineWeeks = qualifyingWeekCutoff();
    var aboveLineCount = players.filter(function (player) {
      return player.weeks >= cutLineWeeks;
    }).length;

    resultsSummary.textContent = players.length + (players.length === 1 ? ' player' : ' players');
    if (!players.length) {
      tableBody.innerHTML = '<tr><td colspan="7" class="leaderboard-empty">No players match those filters.</td></tr>';
      return;
    }

    tableBody.innerHTML = players.map(function (player, index) {
      var form = recentForm(player);
      var detailId = 'player-detail-' + index;
      var lastFive = player.numericScores.slice(-5);
      var cutLine = sortKey === 'cut' && index === aboveLineCount ?
        '<tr class="cut-line-divider"><td colspan="7"><div class="cut-line-label"><strong>Qualifying line</strong><span>⅔ Minimum · ' + cutLineWeeks + ' of ' + completedWeeks + ' weeks required</span></div></td></tr>' : '';
      return cutLine + '<tr class="player-row">' +
        '<td class="rank-cell"><span>' + (index + 1) + '</span></td>' +
        '<th scope="row"><button type="button" class="player-name" data-detail-toggle="' + detailId + '" aria-expanded="false" aria-controls="' + detailId + '">' + escapeHtml(player.name) + '</button></th>' +
        '<td class="numeric-cell"><strong>' + player.weeks + '</strong></td>' +
        '<td class="numeric-cell average-cell"><strong>' + player.average.toFixed(1) + '</strong></td>' +
        '<td class="numeric-cell desktop-score-column">' + (player.best == null ? '—' : player.best) + '</td>' +
        '<td class="trend-cell"><span class="form-badge ' + form.className + '">' + form.label + '</span><small>' + form.detail + '</small></td>' +
        '<td class="details-cell"><button type="button" class="details-button" data-detail-toggle="' + detailId + '" aria-expanded="false" aria-controls="' + detailId + '" aria-label="Show weekly scores for ' + escapeHtml(player.name) + '"><i class="fa fa-chevron-down"></i></button></td>' +
        '</tr>' +
        '<tr class="player-detail-row" id="' + detailId + '" hidden><td colspan="7"><div class="player-detail-content">' +
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

  function refreshView() {
    renderStats();
    renderTable();
    updateFilterSummary();
  }

  function updateFilterSummary() {
    var query = searchInput.value.trim();
    var playerLabel = query ? '“' + query + '”' : 'All players';
    var minimumLabel = minimumRounds.options[minimumRounds.selectedIndex].text;
    var viewLabel = sortSelect.options[sortSelect.selectedIndex].text;
    var labels = [playerLabel];
    if (minimumRounds.value !== '0') {
      labels.push(minimumLabel);
    }
    labels.push(viewLabel);
    filterSummary.textContent = labels.join(' · ');
  }

  function setFiltersExpanded(expanded) {
    filterToggle.setAttribute('aria-expanded', String(expanded));
    controls.hidden = mobileControlsQuery.matches && !expanded;
  }

  function syncResponsiveFilters() {
    setFiltersExpanded(!mobileControlsQuery.matches);
  }

  controls.addEventListener('input', function () {
    renderTable();
    updateFilterSummary();
  });
  controls.addEventListener('change', function () {
    renderTable();
    updateFilterSummary();
  });
  controls.addEventListener('reset', function () {
    window.setTimeout(function () {
      renderTable();
      updateFilterSummary();
    }, 0);
  });
  filterToggle.addEventListener('click', function () {
    setFiltersExpanded(filterToggle.getAttribute('aria-expanded') !== 'true');
  });
  if (mobileControlsQuery.addEventListener) {
    mobileControlsQuery.addEventListener('change', syncResponsiveFilters);
  } else {
    mobileControlsQuery.addListener(syncResponsiveFilters);
  }
  tableBody.addEventListener('click', function (event) {
    var button = event.target.closest('[data-detail-toggle]');
    if (button) {
      toggleDetail(button);
    }
  });

  syncResponsiveFilters();
  refreshView();
}());
