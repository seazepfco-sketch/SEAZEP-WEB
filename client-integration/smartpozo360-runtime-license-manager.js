(function () {
  "use strict";

  /*
    SmartPozo360 Runtime License Manager
    --------------------------------------------------
    Este módulo NO borra licencias.
    Este módulo NO reinstala licencias.
    Este módulo NO toca datos internos de pozos.
    Este módulo NO toca la contraseña ADM del software.
    Este módulo guarda únicamente heartbeat/estado runtime separado.

    Su objetivo es:
    1. Leer una licencia ya instalada o recibida por parámetro.
    2. Validarla contra SEAZEP-WEB.
    3. Activar el equipo si corresponde.
    4. Permitir uso si la licencia está vigente.
    5. Permitir modo offline máximo 4 días desde el último check online válido.
    6. Bloquear si hay vencimiento, suspensión, revocación, empresa inactiva o manipulación de reloj.
  */

  const API_BASE_URL = "https://seazep-api.seazepfco.workers.dev";
  const PRODUCT_ID = "spz-product-smartpozo360";

  const OFFLINE_GRACE_DAYS = 4;
  const OFFLINE_GRACE_MS = OFFLINE_GRACE_DAYS * 24 * 60 * 60 * 1000;
  const CLOCK_ROLLBACK_TOLERANCE_MS = 10 * 60 * 1000;

  /*
    IMPORTANTE:
    Esta llave es exclusiva para heartbeat.
    No debe coincidir con ninguna llave donde SmartPozo360 guarde:
    - licencia instalada
    - pozos
    - datos de clientes
    - configuración principal
    - contraseña ADM
  */
  const HEARTBEAT_STORAGE_KEY = "smartpozo360_license_runtime_heartbeat_v01";

  function nowMs() {
    return Date.now();
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function normalizeText(value) {
    return String(value || "").trim();
  }

  function normalizeMachineId(value) {
    return String(value || "").trim().toUpperCase();
  }

  function parseTimeMs(value) {
    const time = new Date(value || "").getTime();
    return Number.isNaN(time) ? 0 : time;
  }

  function safeJsonParse(value, fallback = {}) {
    try {
      return JSON.parse(value || "{}");
    } catch {
      return fallback;
    }
  }

  /*
    Este método intenta leer la licencia instalada de forma segura.

    Para integración futura con Electron, SmartPozo360 puede exponer un puente de solo lectura:
    window.smartpozo360License.getInstalledLicense()

    Este módulo NO guarda ni modifica esa licencia.
  */
  async function readInstalledLicenseFromBridge() {
    if (
      window.smartpozo360License &&
      typeof window.smartpozo360License.getInstalledLicense === "function"
    ) {
      const installedLicense = await window.smartpozo360License.getInstalledLicense();

      if (installedLicense && typeof installedLicense === "object") {
        return installedLicense;
      }
    }

    return null;
  }

  /*
    Este método intenta obtener el Machine ID real.

    Para integración futura con Electron, SmartPozo360 puede exponer:
    window.smartpozo360License.getMachineId()

    Si todavía no existe ese puente, se genera un ID de navegador SOLO para pruebas.
  */
  async function getMachineIdFromBridgeOrBrowser() {
    if (
      window.smartpozo360License &&
      typeof window.smartpozo360License.getMachineId === "function"
    ) {
      const machineId = await window.smartpozo360License.getMachineId();
      return normalizeMachineId(machineId);
    }

    let browserMachineId = localStorage.getItem("smartpozo360_browser_machine_id_v01");

    if (!browserMachineId) {
      const randomPart = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
      browserMachineId = `SPZ-BROWSER-${randomPart}`;
      localStorage.setItem("smartpozo360_browser_machine_id_v01", browserMachineId);
    }

    return normalizeMachineId(browserMachineId);
  }

  /*
    Lee únicamente el heartbeat.
    No lee pozos.
    No lee datos internos.
    No lee contraseña ADM.
  */
  async function readHeartbeatState() {
    if (
      window.smartpozo360License &&
      typeof window.smartpozo360License.readHeartbeatState === "function"
    ) {
      const state = await window.smartpozo360License.readHeartbeatState();

      if (state && typeof state === "object") {
        return state;
      }
    }

    return safeJsonParse(localStorage.getItem(HEARTBEAT_STORAGE_KEY), {});
  }

  /*
    Guarda únicamente el heartbeat.
    No guarda ni reemplaza la licencia instalada.
    No toca datos de pozos.
    No toca configuración principal.
  */
  async function saveHeartbeatState(nextState = {}) {
    const finalState = {
      ...nextState,
      lastLocalSeenAt: nowIso(),
      heartbeatStorageKey: HEARTBEAT_STORAGE_KEY,
      updatedAt: nowIso()
    };

    if (
      window.smartpozo360License &&
      typeof window.smartpozo360License.saveHeartbeatState === "function"
    ) {
      await window.smartpozo360License.saveHeartbeatState(finalState);
    }

    localStorage.setItem(HEARTBEAT_STORAGE_KEY, JSON.stringify(finalState));

    return finalState;
  }

  async function postJson(path, payload) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "content-type": "text/plain;charset=UTF-8"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    return {
      httpStatus: response.status,
      httpOk: response.ok,
      ...result
    };
  }

  function isImmediateBlockCode(code) {
    return [
      "COMPANY_NOT_ACTIVE",
      "LICENSE_NOT_ACTIVE",
      "LICENSE_NOT_STARTED",
      "LICENSE_EXPIRED",
      "LICENSE_SUSPENDED",
      "LICENSE_REVOKED",
      "DEVICE_SUSPENDED",
      "DEVICE_REVOKED",
      "DEVICE_LIMIT_REACHED",
      "PRODUCT_NOT_MATCH",
      "PRODUCT_NOT_PUBLISHED",
      "PRODUCT_NOT_FOUND",
      "LICENSE_NOT_FOUND"
    ].includes(code);
  }

  function buildAllowResult(data = {}) {
    return {
      allow: true,
      mode: data.mode || "online",
      code: data.code || "LICENSE_VALID",
      message: data.message || "Licencia válida. Uso permitido.",
      heartbeat: data.heartbeat || null,
      response: data.response || null
    };
  }

  function buildBlockResult(data = {}) {
    return {
      allow: false,
      mode: data.mode || "blocked",
      code: data.code || "LICENSE_BLOCKED",
      message: data.message || "Licencia bloqueada.",
      heartbeat: data.heartbeat || null,
      response: data.response || null
    };
  }

  function evaluateOfflineGrace(heartbeat = {}) {
    const currentLocalMs = nowMs();
    const lastLocalSeenMs = parseTimeMs(heartbeat.lastLocalSeenAt);

    if (
      lastLocalSeenMs &&
      currentLocalMs + CLOCK_ROLLBACK_TOLERANCE_MS < lastLocalSeenMs
    ) {
      return buildBlockResult({
        mode: "offline",
        code: "CLOCK_TAMPER_DETECTED",
        message: "Se detectó posible cambio de hora en la PC. Conéctese a internet para validar licencia.",
        heartbeat
      });
    }

    if (heartbeat.lastOnlineValid !== true) {
      return buildBlockResult({
        mode: "offline",
        code: "NO_VALID_ONLINE_CHECK",
        message: "No existe una validación online previa válida. Se requiere internet.",
        heartbeat
      });
    }

    const licenseExpiresAtMs = parseTimeMs(heartbeat.license?.expiresAt);

    if (licenseExpiresAtMs && currentLocalMs >= licenseExpiresAtMs) {
      return buildBlockResult({
        mode: "offline",
        code: "LICENSE_EXPIRED_LOCAL",
        message: "La licencia venció según el último estado local. Conéctese a internet o renueve licencia.",
        heartbeat
      });
    }

    const lastSuccessfulOnlineLocalMs = parseTimeMs(heartbeat.lastSuccessfulOnlineLocalAt);

    if (!lastSuccessfulOnlineLocalMs) {
      return buildBlockResult({
        mode: "offline",
        code: "NO_HEARTBEAT_LOCAL_DATE",
        message: "No existe fecha local de heartbeat válido. Se requiere internet.",
        heartbeat
      });
    }

    const offlineDeadlineMs = lastSuccessfulOnlineLocalMs + OFFLINE_GRACE_MS;

    if (currentLocalMs <= offlineDeadlineMs) {
      const remainingMs = offlineDeadlineMs - currentLocalMs;
      const remainingHours = Math.ceil(remainingMs / (60 * 60 * 1000));

      return buildAllowResult({
        mode: "offline",
        code: "OFFLINE_GRACE_ALLOWED",
        message: `Modo offline permitido. Quedan aproximadamente ${remainingHours} hora(s) de gracia.`,
        heartbeat
      });
    }

    return buildBlockResult({
      mode: "offline",
      code: "OFFLINE_GRACE_EXPIRED",
      message: `Se superaron ${OFFLINE_GRACE_DAYS} días sin validación online. Conéctese a internet para renovar heartbeat.`,
      heartbeat
    });
  }

  async function runOnlineCheck(licenseId, machineId) {
    return postJson("/license/check", {
      licenseId,
      productId: PRODUCT_ID,
      machineId
    });
  }

  async function runActivation(licenseId, machineId, deviceLabel, appVersion) {
    return postJson("/activation/register", {
      licenseId,
      productId: PRODUCT_ID,
      machineId,
      deviceLabel,
      appVersion
    });
  }

  async function saveSuccessfulHeartbeat(params = {}) {
    const heartbeat = await saveHeartbeatState({
      licenseId: params.licenseId,
      productId: PRODUCT_ID,
      machineId: params.machineId,
      lastOnlineValid: true,
      lastOnlineCode: params.response?.code || "LICENSE_VALID",
      lastOnlineMessage: params.response?.message || "Licencia válida.",
      lastSuccessfulOnlineCheckAt: params.response?.checkedAt || nowIso(),
      lastSuccessfulOnlineLocalAt: nowIso(),
      license: params.response?.license || null,
      product: params.response?.product || null,
      company: params.response?.company || null,
      device: params.response?.device || null,
      offlineGraceDays: OFFLINE_GRACE_DAYS
    });

    return heartbeat;
  }

  async function saveBlockedHeartbeat(params = {}) {
    const previousHeartbeat = await readHeartbeatState();

    const heartbeat = await saveHeartbeatState({
      ...previousHeartbeat,
      licenseId: params.licenseId,
      productId: PRODUCT_ID,
      machineId: params.machineId,
      lastOnlineValid: false,
      lastOnlineCode: params.response?.code || "LICENSE_BLOCKED",
      lastOnlineMessage: params.response?.message || "Licencia bloqueada.",
      lastBlockedOnlineAt: params.response?.checkedAt || nowIso(),
      lastBlockedOnlineLocalAt: nowIso(),
      lastBlockedResponse: params.response || null,
      offlineGraceDays: OFFLINE_GRACE_DAYS
    });

    return heartbeat;
  }

  async function resolveLicenseId(options = {}) {
    const licenseFromOptions = normalizeText(options.licenseId);

    if (licenseFromOptions) {
      return licenseFromOptions;
    }

    const installedLicense = await readInstalledLicenseFromBridge();

    if (installedLicense) {
      return normalizeText(
        installedLicense.licenseId ||
        installedLicense.license_id ||
        installedLicense.code ||
        installedLicense.key
      );
    }

    return "";
  }

  /*
    Función principal que deberá llamar SmartPozo360 al iniciar.

    Esta función:
    - NO borra la licencia.
    - NO reescribe la licencia.
    - NO modifica datos de pozos.
    - Solo valida estado y guarda heartbeat separado.
  */
  async function validateSmartPozoRuntimeLicense(options = {}) {
    const previousHeartbeat = await readHeartbeatState();

    const licenseId = await resolveLicenseId(options);
    const machineId = normalizeMachineId(
      options.machineId || await getMachineIdFromBridgeOrBrowser()
    );

    const deviceLabel = normalizeText(options.deviceLabel || "Equipo SmartPozo360");
    const appVersion = normalizeText(options.appVersion || "1.0.0");

    if (!licenseId) {
      return buildBlockResult({
        mode: "local",
        code: "LICENSE_REQUIRED",
        message: "Ingrese una licencia para activar SmartPozo360.",
        heartbeat: previousHeartbeat
      });
    }

    try {
      const firstCheck = await runOnlineCheck(licenseId, machineId);

      if (firstCheck.valid === true) {
        const heartbeat = await saveSuccessfulHeartbeat({
          licenseId,
          machineId,
          response: firstCheck
        });

        return buildAllowResult({
          mode: "online",
          code: firstCheck.code || "LICENSE_VALID",
          message: firstCheck.message || "Licencia válida online.",
          heartbeat,
          response: firstCheck
        });
      }

      if (firstCheck.code === "LICENSE_REQUIRES_ACTIVATION") {
        const activation = await runActivation(
          licenseId,
          machineId,
          deviceLabel,
          appVersion
        );

        if (activation.activated === true) {
          const secondCheck = await runOnlineCheck(licenseId, machineId);

          if (secondCheck.valid === true) {
            const heartbeat = await saveSuccessfulHeartbeat({
              licenseId,
              machineId,
              response: secondCheck
            });

            return buildAllowResult({
              mode: "online_activation",
              code: secondCheck.code || "LICENSE_VALID",
              message: "Equipo activado y licencia válida.",
              heartbeat,
              response: {
                firstCheck,
                activation,
                secondCheck
              }
            });
          }

          const heartbeat = await saveBlockedHeartbeat({
            licenseId,
            machineId,
            response: secondCheck
          });

          return buildBlockResult({
            mode: "online_activation",
            code: secondCheck.code || "LICENSE_NOT_VALID_AFTER_ACTIVATION",
            message: secondCheck.message || "La licencia no quedó válida después de activar.",
            heartbeat,
            response: {
              firstCheck,
              activation,
              secondCheck
            }
          });
        }

        const heartbeat = await saveBlockedHeartbeat({
          licenseId,
          machineId,
          response: activation
        });

        return buildBlockResult({
          mode: "online_activation",
          code: activation.code || "ACTIVATION_FAILED",
          message: activation.message || "No se pudo activar el equipo.",
          heartbeat,
          response: {
            firstCheck,
            activation
          }
        });
      }

      if (isImmediateBlockCode(firstCheck.code)) {
        const heartbeat = await saveBlockedHeartbeat({
          licenseId,
          machineId,
          response: firstCheck
        });

        return buildBlockResult({
          mode: "online",
          code: firstCheck.code,
          message: firstCheck.message || "Licencia bloqueada por la API.",
          heartbeat,
          response: firstCheck
        });
      }

      const heartbeat = await saveBlockedHeartbeat({
        licenseId,
        machineId,
        response: firstCheck
      });

      return buildBlockResult({
        mode: "online",
        code: firstCheck.code || "LICENSE_NOT_VALID",
        message: firstCheck.message || "Licencia no válida.",
        heartbeat,
        response: firstCheck
      });
    } catch (error) {
      const offlineHeartbeat = await saveHeartbeatState({
        ...previousHeartbeat,
        licenseId,
        productId: PRODUCT_ID,
        machineId,
        lastOfflineError: error.message || "Error de conexión",
        lastOfflineAttemptAt: nowIso()
      });

      const offlineResult = evaluateOfflineGrace(offlineHeartbeat);

      return {
        ...offlineResult,
        networkError: error.message || "Error de conexión"
      };
    }
  }

  /*
    API pública del módulo.
    En integración real, SmartPozo360 llamará:
    window.SmartPozoLicenseRuntime.validate(...)
  */
  window.SmartPozoLicenseRuntime = {
    validate: validateSmartPozoRuntimeLicense,
    readHeartbeatState,
    saveHeartbeatState,
    evaluateOfflineGrace,
    constants: {
      API_BASE_URL,
      PRODUCT_ID,
      OFFLINE_GRACE_DAYS,
      HEARTBEAT_STORAGE_KEY
    }
  };
})();