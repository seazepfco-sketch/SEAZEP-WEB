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


    if (url.pathname === "/admin/requests/update-status" && request.method === "POST") {
  return handleAdminUpdateRequestStatus(request, env);
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

const emailResult = await notifyNewEnterpriseRequest(env, {
  id,
  companyName,
  contactName,
  contactPosition,
  contactEmail,
  contactPhone,
  interestArea,
  message,
  createdAt: now
});

return corsResponse({
  ok: true,
  id,
  message: "Solicitud registrada correctamente.",
  emailSent: emailResult.ok,
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

  const status = cleanText(url.searchParams.get("status") || "", 40);
  const interestArea = cleanText(url.searchParams.get("interestArea") || "", 120);
  const search = cleanText(url.searchParams.get("search") || "", 120);

  const rawLimit = Number(url.searchParams.get("limit") || 50);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(Math.trunc(rawLimit), 1), 100)
    : 50;

  const whereParts = [];
  const params = [];

  if (status && status !== "all") {
    whereParts.push("status = ?");
    params.push(status);
  }

  if (interestArea && interestArea !== "all") {
    whereParts.push("interest_area = ?");
    params.push(interestArea);
  }

  if (search) {
    const likeSearch = `%${search}%`;

    whereParts.push(`(
      company_name LIKE ?
      OR contact_name LIKE ?
      OR contact_email LIKE ?
      OR contact_phone LIKE ?
      OR interest_area LIKE ?
      OR message LIKE ?
    )`);

    params.push(
      likeSearch,
      likeSearch,
      likeSearch,
      likeSearch,
      likeSearch,
      likeSearch
    );
  }

  const whereSql = whereParts.length
    ? `WHERE ${whereParts.join(" AND ")}`
    : "";

  const listSql = `
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
    ${whereSql}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;

  const countSql = `
    SELECT COUNT(*) AS total
    FROM enterprise_requests
    ${whereSql}
  `;

  const listStatement = env.DB.prepare(listSql);
  const countStatement = env.DB.prepare(countSql);

  const listResult = params.length
    ? await listStatement.bind(...params).all()
    : await listStatement.all();

  const countResult = params.length
    ? await countStatement.bind(...params).first()
    : await countStatement.first();

  const summaryResult = await env.DB.prepare(`
    SELECT
      COALESCE(status, 'new') AS status,
      COUNT(*) AS total
    FROM enterprise_requests
    GROUP BY COALESCE(status, 'new')
  `).all();

  const totalAllResult = await env.DB.prepare(`
    SELECT COUNT(*) AS total
    FROM enterprise_requests
  `).first();

  const summary = {
    total: Number(totalAllResult?.total || 0),
    new: 0,
    contacted: 0,
    negotiation: 0,
    closed: 0,
    discarded: 0
  };

  for (const row of summaryResult.results || []) {
    const key = row.status || "new";
    summary[key] = Number(row.total || 0);
  }

  return corsResponse({
    ok: true,
    count: (listResult.results || []).length,
    total: Number(countResult?.total || 0),
    limit,
    filters: {
      status: status || "all",
      interestArea: interestArea || "all",
      search
    },
    summary,
    requests: listResult.results || []
  });
}





  async function handleAdminUpdateRequestStatus(request, env) {
  const auth = validateAdminRequest(request, env);

  if (!auth.ok) {
    return corsResponse({
      ok: false,
      code: "UNAUTHORIZED",
      message: "Acceso administrativo no autorizado."
    }, 401);
  }

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

  const id = cleanText(body.id, 80);
  const status = cleanText(body.status, 40);
  const note = cleanText(body.note || "", 800);

  const allowedStatuses = [
    "new",
    "contacted",
    "negotiation",
    "closed",
    "discarded"
  ];

  if (!id) {
    return corsResponse({
      ok: false,
      code: "MISSING_ID",
      message: "Falta el ID de la solicitud."
    }, 400);
  }

  if (!allowedStatuses.includes(status)) {
    return corsResponse({
      ok: false,
      code: "INVALID_STATUS",
      message: "Estado no permitido."
    }, 400);
  }

  const existing = await env.DB.prepare(`
    SELECT
      id,
      company_name,
      contact_name,
      status
    FROM enterprise_requests
    WHERE id = ?
    LIMIT 1
  `)
    .bind(id)
    .first();

  if (!existing) {
    return corsResponse({
      ok: false,
      code: "REQUEST_NOT_FOUND",
      message: "No se encontró la solicitud."
    }, 404);
  }

  const previousStatus = existing.status || "new";
  const now = new Date().toISOString();

  await env.DB.prepare(`
    UPDATE enterprise_requests
    SET status = ?
    WHERE id = ?
  `)
    .bind(status, id)
    .run();

  await env.DB.prepare(`
    INSERT INTO audit_logs (
      id,
      actor_user_id,
      action,
      entity_type,
      entity_id,
      metadata,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
    .bind(
      crypto.randomUUID(),
      "temporary-admin",
      "update_request_status",
      "enterprise_requests",
      id,
      JSON.stringify({
        companyName: existing.company_name,
        contactName: existing.contact_name,
        previousStatus,
        newStatus: status,
        note
      }),
      now
    )
    .run();

  return corsResponse({
    ok: true,
    id,
    previousStatus,
    status,
    message: "Estado actualizado correctamente.",
    updatedAt: now
  });
}



  async function notifyNewEnterpriseRequest(env, data) {
  const resendApiKey = String(env.RESEND_API_KEY || "").trim();

  if (!resendApiKey) {
    await createAuditLog(env, {
      action: "email_skipped_missing_resend_key",
      entityType: "enterprise_requests",
      entityId: data.id,
      metadata: {
        companyName: data.companyName,
        contactEmail: data.contactEmail
      }
    });

    return {
      ok: false,
      reason: "NO_RESEND_API_KEY"
    };
  }

  const from = String(env.RESEND_FROM_EMAIL || "SEAZEP <onboarding@resend.dev>").trim();
  const to = String(env.NOTIFY_TO_EMAIL || "seazepfco@gmail.com").trim();

  const subject = `Nueva solicitud SEAZEP — ${data.companyName}`;

  const emailPayload = {
    from,
    to: [to],
    subject,
    html: buildNewRequestEmailHtml(data),
    text: buildNewRequestEmailText(data)
  };

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "authorization": `Bearer ${resendApiKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify(emailPayload)
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      await createAuditLog(env, {
        action: "email_send_failed",
        entityType: "enterprise_requests",
        entityId: data.id,
        metadata: {
          companyName: data.companyName,
          contactEmail: data.contactEmail,
          status: response.status,
          resendResponse: result
        }
      });

      return {
        ok: false,
        reason: "RESEND_ERROR",
        status: response.status
      };
    }

    await createAuditLog(env, {
      action: "email_send_success",
      entityType: "enterprise_requests",
      entityId: data.id,
      metadata: {
        companyName: data.companyName,
        contactEmail: data.contactEmail,
        resendEmailId: result.id || null
      }
    });

    return {
      ok: true,
      resendEmailId: result.id || null
    };
  } catch (error) {
    await createAuditLog(env, {
      action: "email_send_exception",
      entityType: "enterprise_requests",
      entityId: data.id,
      metadata: {
        companyName: data.companyName,
        contactEmail: data.contactEmail,
        error: error.message || "Error desconocido"
      }
    });

    return {
      ok: false,
      reason: "EXCEPTION"
    };
  }
}

function buildNewRequestEmailHtml(data) {
  return `
    <div style="font-family:Arial,sans-serif;background:#f4f8fb;padding:24px;color:#0f172a;">
      <div style="max-width:720px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #dbeafe;">
        <div style="background:#08243e;color:#ffffff;padding:22px 26px;">
          <h1 style="margin:0;font-size:24px;">Nueva solicitud recibida en SEAZEP-WEB</h1>
          <p style="margin:8px 0 0;color:#bae6fd;">Formulario público de contacto</p>
        </div>

        <div style="padding:26px;">
          <h2 style="margin:0 0 18px;font-size:20px;color:#075985;">Datos de la solicitud</h2>

          <table style="width:100%;border-collapse:collapse;">
            ${emailRow("Empresa / organismo", data.companyName)}
            ${emailRow("Responsable", data.contactName)}
            ${emailRow("Cargo / área", data.contactPosition || "No especificado")}
            ${emailRow("Correo", data.contactEmail)}
            ${emailRow("Teléfono", data.contactPhone || "No especificado")}
            ${emailRow("Servicio de interés", data.interestArea)}
            ${emailRow("Fecha de registro", data.createdAt)}
          </table>

          <div style="margin-top:22px;padding:18px;border-radius:14px;background:#f8fafc;border:1px solid #e2e8f0;">
            <strong style="display:block;margin-bottom:8px;color:#075985;">Mensaje:</strong>
            <p style="margin:0;line-height:1.6;">${escapeHtml(data.message || "Sin mensaje")}</p>
          </div>

          <div style="margin-top:24px;padding:16px;border-radius:14px;background:#ecfeff;border:1px solid #a5f3fc;">
            <p style="margin:0;line-height:1.6;">
              Revisar esta solicitud en el panel ADM de SEAZEP-WEB.
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function buildNewRequestEmailText(data) {
  return [
    "Nueva solicitud recibida en SEAZEP-WEB",
    "",
    `Empresa / organismo: ${data.companyName}`,
    `Responsable: ${data.contactName}`,
    `Cargo / área: ${data.contactPosition || "No especificado"}`,
    `Correo: ${data.contactEmail}`,
    `Teléfono: ${data.contactPhone || "No especificado"}`,
    `Servicio de interés: ${data.interestArea}`,
    `Fecha de registro: ${data.createdAt}`,
    "",
    "Mensaje:",
    data.message || "Sin mensaje",
    "",
    "Revisar esta solicitud en el panel ADM de SEAZEP-WEB."
  ].join("\n");
}

function emailRow(label, value) {
  return `
    <tr>
      <td style="width:220px;padding:11px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-weight:bold;">
        ${escapeHtml(label)}
      </td>
      <td style="padding:11px 0;border-bottom:1px solid #e2e8f0;color:#0f172a;">
        ${escapeHtml(value || "No especificado")}
      </td>
    </tr>
  `;
}

async function createAuditLog(env, entry) {
  try {
    await env.DB.prepare(`
      INSERT INTO audit_logs (
        id,
        actor_user_id,
        action,
        entity_type,
        entity_id,
        metadata,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
      .bind(
        crypto.randomUUID(),
        "system",
        entry.action,
        entry.entityType,
        entry.entityId,
        JSON.stringify(entry.metadata || {}),
        new Date().toISOString()
      )
      .run();
  } catch {
    /*
      No se detiene el flujo principal si falla auditoría.
    */
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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