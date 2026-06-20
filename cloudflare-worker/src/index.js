export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
  return handleOptions();
}

    if (url.pathname === "/") {
      return corsResponse({
        ok: true,
        app: "SEAZEP API",
        message: "API base para plataforma SEAZEP."
      });
    }

    if (url.pathname === "/health") {
      return corsResponse({
        ok: true,
        status: "healthy",
        timestamp: new Date().toISOString()
      });
    }

    if (url.pathname === "/time") {
      return corsResponse({
        ok: true,
        serverUtc: new Date().toISOString(),
        product: "SEAZEP Platform",
        provider: "SEAZEP"
      });
    }

    if (url.pathname === "/requests" && request.method === "POST") {
      return handleCreateEnterpriseRequest(request, env);
    }

    if (url.pathname === "/admin/requests" && request.method === "GET") {
      return handleAdminListRequests(request, env);
    }

    /*
      Rutas reservadas para fases futuras de SmartPozo360.
      Se dejan vivas para no romper la estructura del proyecto.
    */
    if (url.pathname === "/license/check" && request.method === "POST") {
      return corsResponse({
        ok: true,
        status: "reserved",
        message: "Endpoint reservado para validación futura de licencias."
      });
    }

    if (url.pathname === "/activation/register" && request.method === "POST") {
      return corsResponse({
        ok: true,
        status: "reserved",
        message: "Endpoint reservado para activaciones futuras."
      });
    }

    return corsResponse({
      ok: false,
      code: "NOT_FOUND",
      message: "Ruta no encontrada."
    }, 404);
  }
};

async function handleCreateEnterpriseRequest(request, env) {
  let body;

  try {
    body = await request.json();
  } catch {
    return corsResponse({
      ok: false,
      code: "INVALID_JSON",
      message: "La solicitud no tiene un JSON válido."
    }, 400);
  }

  /*
    Honeypot antispam.
    Si un bot llena este campo oculto, se responde éxito falso
    pero no se guarda nada en D1.
  */
  if (String(body.website || "").trim() !== "") {
    return corsResponse({
      ok: true,
      message: "Solicitud recibida."
    });
  }

  const companyName = cleanText(body.companyName);
  const contactName = cleanText(body.contactName);
  const contactPosition = cleanText(body.contactPosition);
  const contactEmail = cleanText(body.contactEmail).toLowerCase();
  const contactPhone = cleanText(body.contactPhone);
  const interestArea = cleanText(body.interestArea);
  const message = cleanText(body.message, 2500);

  const missing = [];

  if (!companyName) missing.push("empresa");
  if (!contactName) missing.push("responsable");
  if (!contactEmail) missing.push("correo");
  if (!interestArea) missing.push("software o servicio");

  if (missing.length > 0) {
    return corsResponse({
      ok: false,
      code: "MISSING_FIELDS",
      message: `Faltan campos obligatorios: ${missing.join(", ")}.`
    }, 400);
  }

  if (!isValidEmail(contactEmail)) {
    return corsResponse({
      ok: false,
      code: "INVALID_EMAIL",
      message: "El correo institucional no tiene un formato válido."
    }, 400);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await env.DB.prepare(`
    INSERT INTO enterprise_requests (
      id,
      company_name,
      contact_name,
      contact_position,
      contact_email,
      contact_phone,
      interest_area,
      message,
      status,
      source,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
    .bind(
      id,
      companyName,
      contactName,
      contactPosition,
      contactEmail,
      contactPhone,
      interestArea,
      message,
      "new",
      "website",
      now
    )
    .run();

  return corsResponse({
    ok: true,
    id,
    message: "Solicitud registrada correctamente.",
    createdAt: now
  }, 201);
}

async function handleAdminListRequests(request, env) {
  const auth = validateAdminRequest(request, env);

  if (!auth.ok) {
    return corsResponse({
      ok: false,
      code: "UNAUTHORIZED",
      message: "Acceso administrativo no autorizado."
    }, 401);
  }

  const url = new URL(request.url);

  const limitRaw = Number(url.searchParams.get("limit") || 25);
  const limit = Math.min(Math.max(limitRaw, 1), 100);

  const status = cleanText(url.searchParams.get("status") || "", 40);

  let query = `
    SELECT
      id,
      company_name,
      contact_name,
      contact_position,
      contact_email,
      contact_phone,
      interest_area,
      message,
      status,
      source,
      created_at
    FROM enterprise_requests
  `;

  const params = [];

  if (status) {
    query += ` WHERE status = ? `;
    params.push(status);
  }

  query += ` ORDER BY created_at DESC LIMIT ? `;
  params.push(limit);

  const result = await env.DB.prepare(query).bind(...params).all();

  return corsResponse({
    ok: true,
    count: result.results.length,
    requests: result.results
  });
}

function validateAdminRequest(request, env) {
  const configuredKey = String(env.ADMIN_API_KEY || "").trim();

  if (!configuredKey) {
    return { ok: false };
  }

  const providedKey = String(request.headers.get("x-admin-key") || "").trim();

  if (!providedKey) {
    return { ok: false };
  }

  return {
    ok: safeEqual(providedKey, configuredKey)
  };
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;

  let result = 0;

  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

function cleanText(value, maxLength = 500) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function isValidEmail(email) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type,authorization,x-admin-key",
    "access-control-max-age": "86400"
  };
}

function handleOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders()
  });
}

function corsResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      ...corsHeaders(),
      "content-type": "application/json; charset=utf-8"
    }
  });
}