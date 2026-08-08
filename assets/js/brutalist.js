(function () {
	"use strict";

	var root = document.documentElement;
	var lightBtn = document.getElementById("themeLight");
	var darkBtn = document.getElementById("themeDark");
	var menuBtn = document.getElementById("menuBtn");
	var sidebar = document.getElementById("sidebar");
	var backdrop = document.getElementById("backdrop");
	var mobileBar = document.querySelector(".mobile-bar");
	var storageKey = "neel-brutalist-theme";
	var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	var revealObserver = null;

	function setTheme(theme) {
		root.setAttribute("data-theme", theme);
		if (lightBtn) lightBtn.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
		if (darkBtn) darkBtn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
		try { localStorage.setItem(storageKey, theme); } catch (e) {}
	}

	var saved = null;
	try { saved = localStorage.getItem(storageKey); } catch (e) {}
	var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
	setTheme(saved === "light" || saved === "dark" ? saved : (prefersDark ? "dark" : "light"));

	if (lightBtn) lightBtn.addEventListener("click", function () { setTheme("light"); });
	if (darkBtn) darkBtn.addEventListener("click", function () { setTheme("dark"); });

	function syncHeaderHeight() {
		var h = 0;
		if (mobileBar && getComputedStyle(mobileBar).display !== "none") {
			h = mobileBar.offsetHeight;
		}
		root.style.setProperty("--header-h", h + "px");
		return h;
	}

	syncHeaderHeight();
	window.addEventListener("resize", syncHeaderHeight);
	window.addEventListener("orientationchange", function () {
		setTimeout(syncHeaderHeight, 100);
	});

	function isMobileNav() {
		return window.matchMedia("(max-width: 900px)").matches;
	}

	function closeMenu() {
		if (!sidebar) return;
		sidebar.classList.remove("is-open");
		if (backdrop) {
			backdrop.classList.remove("is-open");
			backdrop.hidden = true;
		}
		if (menuBtn) menuBtn.setAttribute("aria-expanded", "false");
		document.body.classList.remove("menu-open");
	}

	function openMenu() {
		if (!sidebar) return;
		sidebar.classList.add("is-open");
		if (backdrop) {
			backdrop.hidden = false;
			// Force reflow so opacity transition runs
			void backdrop.offsetWidth;
			backdrop.classList.add("is-open");
		}
		if (menuBtn) menuBtn.setAttribute("aria-expanded", "true");
		document.body.classList.add("menu-open");
	}

	if (menuBtn) {
		menuBtn.addEventListener("click", function (e) {
			e.preventDefault();
			e.stopPropagation();
			if (sidebar.classList.contains("is-open")) closeMenu();
			else openMenu();
		});
	}

	if (backdrop) {
		backdrop.addEventListener("click", function (e) {
			e.preventDefault();
			closeMenu();
		});
	}

	document.addEventListener("keydown", function (e) {
		if (e.key === "Escape") closeMenu();
	});

	window.addEventListener("resize", function () {
		if (!isMobileNav()) closeMenu();
		syncHeaderHeight();
	});

	function revealElement(el) {
		if (!el) return;
		el.classList.add("is-visible");
		if (revealObserver) {
			try { revealObserver.unobserve(el); } catch (e) {}
		}
	}

	function revealTarget(target) {
		if (!target) return;
		revealElement(target);
		var kids = target.querySelectorAll(".reveal");
		for (var i = 0; i < kids.length; i++) revealElement(kids[i]);
	}

	function scrollToSection(target, updateHash) {
		if (!target) return;

		revealTarget(target);
		closeMenu();

		var offset = syncHeaderHeight() + 12;
		var behavior = reduceMotion ? "auto" : "smooth";

		function doScroll() {
			var top = Math.max(
				0,
				target.getBoundingClientRect().top + window.pageYOffset - offset
			);

			try {
				window.scrollTo({ top: top, behavior: behavior });
			} catch (e) {
				window.scrollTo(0, top);
			}

			if (updateHash && target.id) {
				try {
					history.pushState(null, "", "#" + target.id);
				} catch (err) {
					location.hash = target.id;
				}
			}
		}

		// Body overflow unlock needs a tick in Chrome device emulation
		setTimeout(doScroll, 50);
	}

	function handleNavClick(e) {
		var href = this.getAttribute("href");
		if (!href || href.charAt(0) !== "#") return;

		var id = href.slice(1);
		if (!id) return;

		var target = document.getElementById(id);
		if (!target) return;

		e.preventDefault();
		e.stopPropagation();
		scrollToSection(target, true);
	}

	var navLinks = document.querySelectorAll('.nav-list a[href^="#"]');
	for (var i = 0; i < navLinks.length; i++) {
		navLinks[i].addEventListener("click", handleNavClick);
	}

	function initReveals() {
		var nodes = document.querySelectorAll(".reveal");
		if (!nodes.length) return;

		if (reduceMotion || !("IntersectionObserver" in window)) {
			for (var i = 0; i < nodes.length; i++) nodes[i].classList.add("is-visible");
			return;
		}

		revealObserver = new IntersectionObserver(function (entries) {
			for (var j = 0; j < entries.length; j++) {
				if (entries[j].isIntersecting) revealElement(entries[j].target);
			}
		}, {
			root: null,
			rootMargin: "0px 0px -5% 0px",
			threshold: 0.05
		});

		for (var k = 0; k < nodes.length; k++) revealObserver.observe(nodes[k]);

		if (location.hash) {
			var initial = document.getElementById(location.hash.slice(1));
			if (initial) {
				revealTarget(initial);
				setTimeout(function () {
					scrollToSection(initial, false);
				}, 80);
			}
		}
	}

	function initActiveNav() {
		var sections = document.querySelectorAll("main .section[id]");
		var links = document.querySelectorAll('.nav-list a[href^="#"]');
		if (!sections.length || !links.length) return;

		function setActive(id) {
			for (var i = 0; i < links.length; i++) {
				var match = links[i].getAttribute("href") === "#" + id;
				links[i].classList.toggle("is-active", match);
			}
		}

		if (!("IntersectionObserver" in window)) {
			setActive(sections[0].id);
			return;
		}

		var navObserver = new IntersectionObserver(function (entries) {
			var best = null;
			var bestRatio = 0;
			for (var i = 0; i < entries.length; i++) {
				if (entries[i].isIntersecting && entries[i].intersectionRatio >= bestRatio) {
					best = entries[i];
					bestRatio = entries[i].intersectionRatio;
				}
			}
			if (best && best.target.id) setActive(best.target.id);
		}, {
			root: null,
			rootMargin: "-25% 0px -55% 0px",
			threshold: [0.05, 0.2, 0.4]
		});

		for (var s = 0; s < sections.length; s++) navObserver.observe(sections[s]);
	}

	initReveals();
	initActiveNav();
})();
