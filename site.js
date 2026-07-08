(function () {
  var data = window.ADCS_DATA || {};
  var languages = data.languages || [
    { code: "ru", label: "RU", suffix: "" },
    { code: "kk", label: "KZ", suffix: "-kz" },
    { code: "en", label: "EN", suffix: "-en" }
  ];
  var menuItems = data.menuItems || [];
  var routes = data.routes || menuItems;
  var translations = data.translations || {};

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function getCurrentFile() {
    var file = window.location.pathname.split("/").pop();
    return file || "index.html";
  }

  function getLanguageFromFile(file) {
    if (/-kz\.html$/.test(file)) return "kk";
    if (/-en\.html$/.test(file)) return "en";
    return "ru";
  }

  function getBaseFile(file) {
    return file.replace(/^\.\//, "").replace(/-(kz|en)(?=\.html$)/, "");
  }

  function getRouteByFile(file) {
    var baseFile = getBaseFile(file);
    return routes.find(function (route) {
      return route.href.replace(/^\.\//, "") === baseFile;
    }) || routes.find(function (route) {
      return route.key === "home";
    }) || { key: "home", href: "./index.html" };
  }

  function localizeHref(href, lang) {
    var language = languages.find(function (item) {
      return item.code === lang;
    }) || languages[0];
    var suffix = language.suffix || "";
    var parts = String(href).split("#");
    var file = parts[0].replace(/^\.\//, "");
    var hash = parts[1] ? "#" + parts[1] : "";
    if (!/\.html$/.test(file)) return href;
    return "./" + file.replace(/-(kz|en)?\.html$/, ".html").replace(/\.html$/, suffix + ".html") + hash;
  }

  function getMenuLabel(key, lang) {
    var dictionary = translations[lang] || translations.ru || {};
    var fallback = translations.ru || {};
    return (dictionary.menu && dictionary.menu[key]) ||
      (fallback.menu && fallback.menu[key]) ||
      key;
  }

  function getUiLabel(key, lang) {
    var dictionary = translations[lang] || translations.ru || {};
    var fallback = translations.ru || {};
    return dictionary[key] || fallback[key] || "";
  }

  var currentFile = getCurrentFile();
  var currentLang = getLanguageFromFile(currentFile);
  var currentRoute = getRouteByFile(currentFile);

  function linkButton(label, href, modifier) {
    return '<a class="button ' + (modifier || "button-secondary") + '" href="' + escapeHtml(localizeHref(href, currentLang)) + '">' + escapeHtml(label) + '</a>';
  }

  function renderMainNavigation() {
    document.documentElement.lang = currentLang === "kk" ? "kk" : currentLang;

    document.querySelectorAll(".main-nav").forEach(function (nav) {
      nav.setAttribute("aria-label", getUiLabel("navLabel", currentLang));
      nav.innerHTML = menuItems.map(function (item) {
        var isActive = item.key === currentRoute.key;
        return '<a' +
          (isActive ? ' class="is-active" aria-current="page"' : "") +
          ' href="' + escapeHtml(localizeHref(item.href, currentLang)) + '">' +
          escapeHtml(getMenuLabel(item.key, currentLang)) +
          '</a>';
      }).join("");
    });

    document.querySelectorAll(".language-switch").forEach(function (nav) {
      nav.setAttribute("aria-label", getUiLabel("languageLabel", currentLang));
      nav.innerHTML = languages.map(function (language) {
        var isActive = language.code === currentLang;
        return '<a' +
          (isActive ? ' class="is-active" aria-current="true"' : "") +
          ' href="' + escapeHtml(localizeHref(currentRoute.href, language.code) + window.location.hash) + '">' +
          escapeHtml(language.label) +
          '</a>';
      }).join("");
    });

    document.querySelectorAll(".site-logo").forEach(function (logo) {
      logo.setAttribute("href", localizeHref("index.html", currentLang));
    });
  }

  function renderFooterNavigation() {
    document.querySelectorAll(".site-footer").forEach(function (footer) {
      var existing = footer.querySelector(".footer-nav");
      if (existing) existing.remove();

      var nav = document.createElement("nav");
      nav.className = "footer-nav";
      nav.setAttribute("aria-label", getUiLabel("navLabel", currentLang));
      nav.innerHTML = menuItems.map(function (item) {
        return '<a href="' + escapeHtml(localizeHref(item.href, currentLang)) + '">' +
          escapeHtml(getMenuLabel(item.key, currentLang)) +
          '</a>';
      }).join("");
      footer.insertBefore(nav, footer.firstChild);
    });
  }

  function localizePageLinks() {
    document.querySelectorAll('a[href]').forEach(function (link) {
      if (link.closest(".language-switch")) return;
      var href = link.getAttribute("href");
      if (!href || href.charAt(0) === "#") return;
      if (/^(https?:|mailto:|tel:)/.test(href)) return;
      if (href.indexOf(".html") === -1) return;
      link.setAttribute("href", localizeHref(href, currentLang));
    });
  }

  function renderStats(container) {
    container.className += " stats-grid";
    container.innerHTML = (data.stats || []).map(function (item) {
      return '<article class="stat-card"><strong>' + escapeHtml(item.value) + '</strong><span>' + escapeHtml(item.label) + '</span></article>';
    }).join("");
  }

  function renderSportCategories(container) {
    var sports = data.sports || [];
    container.className += " card-grid";
    container.innerHTML = (data.sportCategories || []).map(function (category) {
      var names = sports.filter(function (sport) {
        return sport.category === category.id;
      }).map(function (sport) {
        return sport.title;
      }).slice(0, 8).join(", ");

      return '<article class="data-card">' +
        '<span class="tag">' + escapeHtml(category.title) + '</span>' +
        '<h3>' + escapeHtml(category.title) + '</h3>' +
        '<p>' + escapeHtml(category.description) + '</p>' +
        '<p class="card-note">' + escapeHtml(names) + '</p>' +
        linkButton("Смотреть каталог", "sports.html", "button-secondary") +
      '</article>';
    }).join("");
  }

  function renderSportsCatalog(container) {
    var categories = data.sportCategories || [];
    var sports = data.sports || [];
    var filters = '<div class="filter-bar" role="group" aria-label="Фильтр видов спорта">' +
      '<button class="is-active" type="button" data-filter="all">Все</button>' +
      categories.map(function (category) {
        return '<button type="button" data-filter="' + escapeHtml(category.id) + '">' + escapeHtml(category.title) + '</button>';
      }).join("") +
      '</div>';

    var cards = '<div class="catalog-grid">' + sports.map(function (sport) {
      var category = categories.find(function (item) {
        return item.id === sport.category;
      });
      return '<article class="data-card sport-card" data-category="' + escapeHtml(sport.category) + '">' +
        '<span class="tag">' + escapeHtml(category ? category.title : "Вид спорта") + '</span>' +
        '<h3>' + escapeHtml(sport.title) + '</h3>' +
        '<dl class="mini-spec">' +
          '<div><dt>Для кого</dt><dd>' + escapeHtml(sport.audience) + '</dd></div>' +
          '<div><dt>Формат</dt><dd>' + escapeHtml(sport.format) + '</dd></div>' +
          '<div><dt>Что получает компания</dt><dd>' + escapeHtml(sport.value) + '</dd></div>' +
        '</dl>' +
        '<div class="card-actions">' + linkButton("Запросить регламент", "contacts.html#request", "button-secondary") + '</div>' +
      '</article>';
    }).join("") + '</div>';

    container.innerHTML = filters + cards;

    container.querySelectorAll("[data-filter]").forEach(function (button) {
      button.addEventListener("click", function () {
        var filter = button.getAttribute("data-filter");
        container.querySelectorAll("[data-filter]").forEach(function (item) {
          item.classList.toggle("is-active", item === button);
        });
        container.querySelectorAll(".sport-card").forEach(function (card) {
          card.hidden = filter !== "all" && card.getAttribute("data-category") !== filter;
        });
      });
    });
  }

  function renderEvents(container) {
    var limit = Number(container.getAttribute("data-limit") || 0);
    var events = (data.events || []).slice(0, limit || undefined);
    container.className += " card-grid";
    container.innerHTML = events.map(function (event) {
      var id = event.id || event.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      return '<article class="data-card" id="' + escapeHtml(id) + '">' +
        '<span class="tag">' + escapeHtml(event.status) + '</span>' +
        '<h3>' + escapeHtml(event.title) + '</h3>' +
        '<p>' + escapeHtml(event.description) + '</p>' +
        '<div class="card-actions">' +
          linkButton("Подробнее", event.detailsUrl, "button-secondary") +
          linkButton("Оставить заявку", event.registerUrl, "button-primary") +
        '</div>' +
      '</article>';
    }).join("");
  }

  function renderPartners(container) {
    container.className += " card-grid";
    container.innerHTML = (data.partnerPackages || []).map(function (item) {
      return '<article class="data-card">' +
        '<span class="tag">Партнерский статус</span>' +
        '<h3>' + escapeHtml(item.title) + '</h3>' +
        '<p>' + escapeHtml(item.description) + '</p>' +
        '<p class="card-note">' + escapeHtml(item.value) + '</p>' +
        linkButton("Запросить партнерский пакет", "contacts.html#request", "button-primary") +
      '</article>';
    }).join("");
  }

  function renderPricing(container) {
    container.className += " card-grid";
    container.innerHTML = (data.pricingPackages || []).map(function (item) {
      return '<article class="data-card">' +
        '<span class="tag">' + escapeHtml(item.status) + '</span>' +
        '<h3>' + escapeHtml(item.title) + '</h3>' +
        '<p>' + escapeHtml(item.description) + '</p>' +
        linkButton("Запросить условия участия", "contacts.html#request", "button-secondary") +
      '</article>';
    }).join("");
  }

  function renderTeam(container) {
    container.className += " team-grid";
    container.innerHTML = (data.teamMembers || []).map(function (member) {
      return '<article class="team-card">' +
        '<h3>' + escapeHtml(member.name) + '</h3>' +
        '<p class="role">' + escapeHtml(member.role) + '</p>' +
        '<p>' + escapeHtml(member.description) + '</p>' +
      '</article>';
    }).join("");
  }

  function renderContacts(container) {
    container.className += " contact-list";
    container.innerHTML = (data.contacts || []).map(function (item) {
      var value = item.href
        ? '<a href="' + escapeHtml(item.href) + '">' + escapeHtml(item.value) + '</a>'
        : escapeHtml(item.value);
      return '<div><dt>' + escapeHtml(item.label) + '</dt><dd>' + value + '</dd></div>';
    }).join("");
  }

  function initForms() {
    document.querySelectorAll("[data-static-form]").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var note = form.querySelector(".form-note");
        if (note) {
          note.textContent = "Заявка сохранена как демонстрационный сценарий сайта. Для реального приема заявок позже подключим форму к почте, CRM или Google Forms.";
        }
      });
    });
  }

  document.querySelectorAll("[data-render]").forEach(function (container) {
    var type = container.getAttribute("data-render");
    if (type === "stats") renderStats(container);
    if (type === "sport-categories") renderSportCategories(container);
    if (type === "sports-catalog") renderSportsCatalog(container);
    if (type === "events") renderEvents(container);
    if (type === "partners") renderPartners(container);
    if (type === "pricing") renderPricing(container);
    if (type === "team") renderTeam(container);
    if (type === "contacts") renderContacts(container);
  });

  renderMainNavigation();
  renderFooterNavigation();
  localizePageLinks();
  initForms();
}());
