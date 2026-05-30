(function(){
	var storageKey = 'waterworks-theme';
	var doc = document.documentElement;

	function getStoredTheme(){
		try {
			return localStorage.getItem(storageKey);
		} catch (error) {
			return null;
		}
	}

	function storeTheme(theme){
		try {
			localStorage.setItem(storageKey, theme);
		} catch (error) {}
	}

	function applyTheme(theme){
		var nextTheme = theme === 'light' ? 'light' : 'dark';
		if(nextTheme === 'light'){
			doc.setAttribute('data-theme', 'light');
		} else {
			doc.removeAttribute('data-theme');
		}

		var isLight = nextTheme === 'light';
		var toggles = document.querySelectorAll('.theme-toggle');
		for(var i = 0; i < toggles.length; i++){
			var toggle = toggles[i];
			var label = toggle.querySelector('.theme-toggle-label');
			toggle.setAttribute('aria-pressed', isLight ? 'true' : 'false');
			toggle.setAttribute('aria-label', isLight ? 'Switch to dark mode' : 'Switch to light mode');
			if(label){
				label.textContent = isLight ? 'Light' : 'Dark';
			}
		}
	}

	applyTheme(getStoredTheme() || 'dark');

	document.addEventListener('click', function(event){
		var toggle = event.target.closest('.theme-toggle');
		if(!toggle){ return; }
		var nextTheme = doc.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
		applyTheme(nextTheme);
		storeTheme(nextTheme);
	});
})();
