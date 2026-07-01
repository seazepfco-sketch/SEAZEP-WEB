(function () {
  const ADMIN_SESSION_KEY = "admin_session";
  const ADMIN_API_KEY_STORAGE = "seazep_admin_api_key";

  const ADMIN_LOAD_BUTTON_IDS = [
    "loadRequestsButton",
    "loadLicensesButton",
    "loadCompaniesButton",
    "loadManualsButton",
    "loadUsersButton",
    "loadDownloadsButton"
  ];

  function hasAdminSession() {
    return localStorage.getItem(ADMIN_SESSION_KEY) === "active";
  }

  function getSavedAdminKey() {
    return String(localStorage.getItem(ADMIN_API_KEY_STORAGE) || "").trim();
  }

  function saveAdminKey(value) {
    const cleanValue = String(value || "").trim();

    if (!cleanValue) {
      return;
    }

    localStorage.setItem(ADMIN_API_KEY_STORAGE, cleanValue);
  }

  function clearAdminAccess() {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    localStorage.removeItem(ADMIN_API_KEY_STORAGE);
  }

  function findAdminLoadButton() {
    for (const id of ADMIN_LOAD_BUTTON_IDS) {
      const button = document.getElementById(id);

      if (button) {
        return button;
      }
    }

    return null;
  }

  function markPanelAsReady(input) {
    const panel = input?.closest(".admin-access-panel");

    if (!panel) {
      return;
    }

    panel.classList.add("admin-access-panel-ready");

    const title = panel.querySelector("h3");

    if (title) {
      title.textContent = "Acceso ADM activo";
    }

    const text = panel.querySelector("p");

    if (text) {
      text.textContent = "Sesión administrativa activa. La clave operativa ADM ya está cargada para esta sesión.";
    }
  }

  function hydrateAdminKey() {
    if (!hasAdminSession()) {
      return;
    }

    const input = document.getElementById("adminApiKey");

    if (!input) {
      return;
    }

    const savedKey = getSavedAdminKey();

    if (savedKey && !input.value) {
      input.value = savedKey;
      markPanelAsReady(input);
    }

    input.addEventListener("input", () => {
      saveAdminKey(input.value);

      if (String(input.value || "").trim()) {
        markPanelAsReady(input);
      }
    });

    input.addEventListener("change", () => {
      saveAdminKey(input.value);

      if (String(input.value || "").trim()) {
        markPanelAsReady(input);
      }
    });
  }

  function autoLoadAdminPanel() {
    if (!hasAdminSession()) {
      return;
    }

    if (!getSavedAdminKey()) {
      return;
    }

    const button = findAdminLoadButton();

    if (!button) {
      return;
    }

    window.setTimeout(() => {
      if (!button.disabled) {
        button.click();
      }
    }, 250);
  }

  function bindAdminLogoutButtons() {
    const buttons = document.querySelectorAll("[data-admin-logout], #headerAdminLogoutButton");

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        clearAdminAccess();
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    hydrateAdminKey();
    bindAdminLogoutButtons();
    autoLoadAdminPanel();
  });

  window.seazepAdminSession = {
    hasAdminSession,
    getSavedAdminKey,
    saveAdminKey,
    clearAdminAccess
  };
})();

