const API_BASE_URL = "https://seazep-api.seazepfco.workers.dev";
const PRODUCT_ID = "spz-product-smartpozo360";

const licenseId = process.argv[2] || "SPZ-8LBZ-UDE0-PG9";
const machineId = process.argv[3] || "PC-DEMO-001";
const deviceLabel = process.argv[4] || "Equipo simulador SmartPozo360";
const appVersion = process.argv[5] || "1.0.0";

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
    status: response.status,
    ok: response.ok,
    result
  };
}

async function checkLicense() {
  return postJson("/license/check", {
    licenseId,
    productId: PRODUCT_ID,
    machineId
  });
}

async function activateDevice() {
  return postJson("/activation/register", {
    licenseId,
    productId: PRODUCT_ID,
    machineId,
    deviceLabel,
    appVersion
  });
}

function printResult(title, payload) {
  console.log("");
  console.log(`=== ${title} ===`);
  console.log(JSON.stringify(payload, null, 2));
}

async function main() {
  console.log("SmartPozo360 — Simulador de integración de licencias");
  console.log(`Licencia: ${licenseId}`);
  console.log(`Equipo: ${machineId}`);
  console.log(`Producto: ${PRODUCT_ID}`);

  const firstCheck = await checkLicense();
  printResult("CHECK INICIAL", firstCheck.result);

  const code = firstCheck.result?.code;

  if (firstCheck.result?.valid === true) {
    console.log("");
    console.log("RESULTADO FINAL: LICENCIA VÁLIDA. Permitir uso del software.");
    return;
  }

  if (code === "LICENSE_REQUIRES_ACTIVATION") {
    const activation = await activateDevice();
    printResult("ACTIVACIÓN", activation.result);

    if (activation.result?.activated === true) {
      const secondCheck = await checkLicense();
      printResult("CHECK DESPUÉS DE ACTIVAR", secondCheck.result);

      if (secondCheck.result?.valid === true) {
        console.log("");
        console.log("RESULTADO FINAL: EQUIPO ACTIVADO Y LICENCIA VÁLIDA. Permitir uso.");
        return;
      }
    }
  }

  if (code === "COMPANY_NOT_ACTIVE") {
    console.log("");
    console.log("RESULTADO FINAL: BLOQUEADO. La empresa asociada no está activa.");
    return;
  }

  if (code === "DEVICE_LIMIT_REACHED") {
    console.log("");
    console.log("RESULTADO FINAL: BLOQUEADO. Límite de dispositivos alcanzado.");
    return;
  }

  if (code === "LICENSE_EXPIRED") {
    console.log("");
    console.log("RESULTADO FINAL: BLOQUEADO. Licencia vencida.");
    return;
  }

  if (code === "DEVICE_SUSPENDED" || code === "DEVICE_REVOKED") {
    console.log("");
    console.log("RESULTADO FINAL: BLOQUEADO. Equipo suspendido o revocado.");
    return;
  }

  console.log("");
  console.log(`RESULTADO FINAL: BLOQUEADO. Código recibido: ${code || "SIN_CODIGO"}`);
}

main().catch((error) => {
  console.error("");
  console.error("ERROR DEL SIMULADOR:");
  console.error(error);
  process.exit(1);
});