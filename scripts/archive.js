(function(){
	'use strict';

	var monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
	var monthButtons = {
		April: 'button-mint',
		May: 'button-blue',
		June: 'button-dark2',
		July: 'button-red',
		August: 'button-teal',
		September: 'button-dark'
	};

	function escapeHtml(value){
		return String(value || '').replace(/[&<>"']/g, function(character){
			return {
				'&': '&amp;',
				'<': '&lt;',
				'>': '&gt;',
				'"': '&quot;',
				"'": '&#39;'
			}[character];
		});
	}

	function formatShortDate(dateValue){
		var parts = dateValue.split('-');
		return Number(parts[1]) + '/' + Number(parts[2]);
	}

	function monthName(dateValue){
		return monthNames[Number(dateValue.split('-')[1]) - 1];
	}

	function fancyboxOptions(width){
		return '{"type" : "iframe", "iframe" : {"preload" : false, "css" : {"width" : "' + width + '"}}}';
	}

	function isEmbeddableSheet(url){
		return /\/pubhtml\?/.test(url || '');
	}

	function isGoogleSheet(url){
		return /^https:\/\/docs\.google\.com\/spreadsheets\/d\//.test(url || '');
	}

	function sheetEmbedUrl(url){
		if(isEmbeddableSheet(url)){
			return url;
		}
		var match = String(url || '').match(/^(https:\/\/docs\.google\.com\/spreadsheets\/d\/[^/]+)/);
		if(!match){
			return url;
		}
		var gid = String(url).match(/[?&]gid=([^&]+)/);
		return match[1] + '/preview' + (gid ? '?gid=' + gid[1] : '');
	}

	function renderSeasonMenu(years, currentYear){
		return years.map(function(year){
			var classes = year === currentYear ? 'default-link active-item' : 'default-link';
			return '<a href="' + year + '.html" class="' + classes + '">' + year + '</a>';
		}).join('');
	}

	function renderSeasonNav(years, currentYear){
		var chronologicalYears = years.slice().sort(function(a, b){
			return a - b;
		});
		var currentIndex = chronologicalYears.indexOf(currentYear);
		var previousYear = chronologicalYears[currentIndex - 1];
		var nextYear = chronologicalYears[currentIndex + 1];
		var previous = previousYear ? '<a href="' + previousYear + '.html" class="default-link season-nav-link season-nav-prev" aria-label="View ' + previousYear + ' historical scores"><i class="fa fa-chevron-left"></i><span>' + previousYear + '</span></a>' : '<span class="season-nav-link season-nav-empty">Previous</span>';
		var next = nextYear ? '<a href="' + nextYear + '.html" class="default-link season-nav-link season-nav-next" aria-label="View ' + nextYear + ' historical scores"><span>' + nextYear + '</span><i class="fa fa-chevron-right"></i></a>' : '<span class="season-nav-link season-nav-empty">Next</span>';

		return previous + '<span class="season-nav-current" aria-current="page">' + currentYear + '</span>' + next;
	}

	function renderToolbar(season){
		var actions = [];
		if(season.masterUrl){
			if(isGoogleSheet(season.masterUrl)){
				actions.push('<a href="' + escapeHtml(sheetEmbedUrl(season.masterUrl)) + '" class="button button-s button-dark" data-fancybox data-options=\'' + fancyboxOptions('1398px') + '\'><i class="fa fa-bar-chart"></i> ' + season.year + ' Master Sheet</a>');
			} else {
				actions.push('<a href="' + escapeHtml(season.masterUrl) + '" class="button button-s button-dark" target="_blank" rel="noopener"><i class="fa fa-bar-chart"></i> ' + season.year + ' Master Sheet</a>');
			}
		} else {
			actions.push('<span class="button button-s button-disabled"><i class="fa fa-bar-chart"></i> Master Sheet Pending</span>');
		}
		return actions.join(' ');
	}

	function renderWeek(week, buttonClass, index, season){
		var columnClass = index % 2 === 1 ? 'one-half last-column' : 'one-half';
		var date = '<span class="scorecard-date">' + formatShortDate(week.date) + '</span>';
		var label = 'Week ' + week.week;
		if(week.url){
			if(isGoogleSheet(week.url)){
				return '<div class="' + columnClass + '"><a href="' + escapeHtml(sheetEmbedUrl(week.url)) + '" class="button button-s ' + buttonClass + '" data-fancybox data-options=\'' + fancyboxOptions('720px') + '\'>' + label + '</a> ' + date + '</div>';
			}
			if(season.scoreSource === 'UDisc'){
				return '<div class="' + columnClass + '"><a href="' + escapeHtml(week.url) + '" class="button button-s ' + buttonClass + '" target="_blank" rel="noopener">' + label + '</a> ' + date + '</div>';
			}
			return '<div class="' + columnClass + '"><a href="' + escapeHtml(week.url) + '" class="button button-s ' + buttonClass + '" target="_blank" rel="noopener">' + label + '</a> ' + date + '</div>';
		}
		return '<div class="' + columnClass + '"><span class="button button-s button-disabled">' + label + '</span> ' + date + '<span class="scorecard-note">Link pending</span></div>';
	}

	function renderArchiveList(season){
		var groups = {};
		season.weeks.forEach(function(week){
			var month = monthName(week.date);
			if(!groups[month]){
				groups[month] = [];
			}
			groups[month].push(week);
		});

		return Object.keys(groups).map(function(month){
			var buttonClass = monthButtons[month] || 'button-dark';
			var weeks = groups[month].map(function(week, index){
				return renderWeek(week, buttonClass, index, season);
			}).join('');
			return [
				'<div class="toggle">',
				'<h5 class="toggle-title ultrabold uppercase">' + month + '</h5>',
				'<a href="#' + month.toLowerCase() + '" class="toggle-classic toggle-trigger"><i class="fa fa-chevron-down"></i></a>',
				'<div class="toggle-content" style="display: none;">' + weeks + '</div>',
				'</div>',
				'<div class="decoration half-bottom"></div>'
			].join('');
		}).join('');
	}

	function toggleArchiveSection(event){
		var control = event.target.closest('.archive-page .toggle-trigger, .archive-page .toggle-title');
		if(!control){
			return;
		}
		var section = control.closest('.toggle');
		if(!section){
			return;
		}
		var content = section.querySelector('.toggle-content');
		if(!content){
			return;
		}
		event.preventDefault();
		event.stopImmediatePropagation();
		section.classList.toggle('toggle-active');
		content.style.display = content.style.display === 'none' || !content.style.display ? 'block' : 'none';
	}

	function setText(selector, value){
		var node = document.querySelector(selector);
		if(node){
			node.textContent = value;
		}
	}

	function renderArchive(){
		var data = window.WW_ARCHIVE_DATA;
		var currentYear = Number(document.body.getAttribute('data-season'));
		if(!data || !data.seasons[currentYear]){
			return;
		}

		var season = data.seasons[currentYear];
		setText('[data-season-title]', season.year + ' WaterWorks Summer League');
		setText('[data-season-note]', season.note || '');

		var menu = document.querySelector('[data-season-menu]');
		if(menu){
			menu.innerHTML = renderSeasonMenu(data.years, currentYear);
		}

		var nav = document.querySelector('[data-season-nav]');
		if(nav){
			nav.innerHTML = renderSeasonNav(data.years, currentYear);
		}

		var toolbar = document.querySelector('[data-archive-toolbar]');
		if(toolbar){
			toolbar.innerHTML = renderToolbar(season);
		}

		var list = document.querySelector('[data-archive-list]');
		if(list){
			list.innerHTML = renderArchiveList(season);
		}
	}

	document.addEventListener('DOMContentLoaded', renderArchive);
	document.addEventListener('click', toggleArchiveSection, true);
})();
