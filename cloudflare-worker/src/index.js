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

    
    if (url.pathname === "/auth/register" && request.method === "POST") {
  return handleAuthRegister(request, env);
}



    if (url.pathname === "/auth/login" && request.method === "POST") {
  return handleAuthLogin(request, env);
}


    if (url.pathname === "/auth/forgot-password" && request.method === "POST") {
  return handleAuthForgotPassword(request, env);
}

if (url.pathname === "/auth/reset-password" && request.method === "POST") {
  return handleAuthResetPassword(request, env);
}




    
    if (url.pathname === "/admin/requests" && request.method === "GET") {
      return handleAdminListRequests(request, env);
    }


    if (url.pathname === "/admin/requests/update-status" && request.method === "POST") {
  return handleAdminUpdateRequestStatus(request, env);
}




    if (url.pathname === "/admin/requests/notes" && request.method === "GET") {
  return handleAdminListRequestNotes(request, env);
}

if (url.pathname === "/admin/requests/notes" && request.method === "POST") {
  return handleAdminCreateRequestNote(request, env);
}


  if (url.pathname === "/admin/requests/convert-to-company" && request.method === "POST") {
  return handleAdminConvertRequestToCompany(request, env);
}




  if (url.pathname === "/admin/users" && request.method === "GET") {
  return handleAdminListUsers(request, env);
}

if (url.pathname === "/admin/users/update-status" && request.method === "POST") {
  return handleAdminUpdateUserStatus(request, env);
}


  if (url.pathname === "/admin/users/assign-company" && request.method === "POST") {
  return handleAdminAssignUserCompany(request, env);
}


    if (url.pathname === "/admin/companies" && request.method === "GET") {
  return handleAdminListCompanies(request, env);
}

if (url.pathname === "/admin/companies" && request.method === "POST") {
  return handleAdminCreateCompany(request, env);
}

if (url.pathname === "/admin/companies/update-status" && request.method === "POST") {
  return handleAdminUpdateCompanyStatus(request, env);
}



  if (url.pathname === "/admin/manuals" && request.method === "GET") {
  return handleAdminListManuals(request, env);
}

if (url.pathname === "/admin/manuals" && request.method === "POST") {
  return handleAdminCreateManual(request, env);
}

if (url.pathname === "/admin/manuals/update-status" && request.method === "POST") {
  return handleAdminUpdateManualStatus(request, env);
}

if (url.pathname === "/admin/manuals/assign-company" && request.method === "POST") {
  return handleAdminAssignManualCompany(request, env);
}


  if (url.pathname === "/admin/manual-downloads" && request.method === "GET") {
  return handleAdminListManualDownloads(request, env);
}

  if (url.pathname === "/admin/licenses" && request.method === "GET") {
  return handleAdminListLicenses(request, env);
}

if (url.pathname === "/admin/licenses" && request.method === "POST") {
  return handleAdminCreateLicense(request, env);
}

if (url.pathname === "/admin/licenses/update-status" && request.method === "POST") {
  return handleAdminUpdateLicenseStatus(request, env);
}


  if (url.pathname === "/admin/license-activations" && request.method === "GET") {
  return handleAdminListLicenseActivations(request, env);
}


if (url.pathname === "/admin/license-activations/update-status" && request.method === "POST") {
  return handleAdminUpdateLicenseActivationStatus(request, env);
}


  

  
if (url.pathname === "/user/manuals" && request.method === "GET") {
  return handleUserListManuals(request, env);
}


  if (url.pathname === "/user/manuals/open" && request.method === "POST") {
  return handleUserOpenManual(request, env);
}



  if (url.pathname === "/user/manuals/file" && request.method === "GET") {
  return handleUserManualFile(request, env);
}


    /*
      Rutas reservadas para fases futuras de SmartPozo360.
      Se dejan vivas para no romper la estructura del proyecto.
    */
    
      if (url.pathname === "/license/check" && request.method === "POST") {
  return handleLicenseCheck(request, env);
}

    if (url.pathname === "/activation/register" && request.method === "POST") {
  return handleActivationRegister(request, env);
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






    async function handleAdminListRequestNotes(request, env) {
  const auth = validateAdminRequest(request, env);

  if (!auth.ok) {
    return corsResponse({
      ok: false,
      code: "UNAUTHORIZED",
      message: "Acceso administrativo no autorizado."
    }, 401);
  }

  const url = new URL(request.url);
  const requestId = cleanText(url.searchParams.get("requestId") || "", 80);

  if (!requestId) {
    return corsResponse({
      ok: false,
      code: "MISSING_REQUEST_ID",
      message: "Falta el ID de la solicitud."
    }, 400);
  }

  const existing = await env.DB.prepare(`
    SELECT
      id,
      company_name,
      contact_name
    FROM enterprise_requests
    WHERE id = ?
    LIMIT 1
  `)
    .bind(requestId)
    .first();

  if (!existing) {
    return corsResponse({
      ok: false,
      code: "REQUEST_NOT_FOUND",
      message: "No se encontró la solicitud."
    }, 404);
  }

  const result = await env.DB.prepare(`
    SELECT
      id,
      request_id,
      note,
      actor_user_id,
      created_at
    FROM request_notes
    WHERE request_id = ?
    ORDER BY created_at DESC
    LIMIT 20
  `)
    .bind(requestId)
    .all();

  return corsResponse({
    ok: true,
    request: existing,
    count: (result.results || []).length,
    notes: result.results || []
  });
}

async function handleAdminCreateRequestNote(request, env) {
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

  const requestId = cleanText(body.requestId, 80);
  const note = cleanText(body.note, 1200);

  if (!requestId) {
    return corsResponse({
      ok: false,
      code: "MISSING_REQUEST_ID",
      message: "Falta el ID de la solicitud."
    }, 400);
  }

  if (!note) {
    return corsResponse({
      ok: false,
      code: "MISSING_NOTE",
      message: "La nota interna no puede estar vacía."
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
    .bind(requestId)
    .first();

  if (!existing) {
    return corsResponse({
      ok: false,
      code: "REQUEST_NOT_FOUND",
      message: "No se encontró la solicitud."
    }, 404);
  }

  const noteId = crypto.randomUUID();
  const now = new Date().toISOString();

  await env.DB.prepare(`
    INSERT INTO request_notes (
      id,
      request_id,
      note,
      actor_user_id,
      created_at
    ) VALUES (?, ?, ?, ?, ?)
  `)
    .bind(
      noteId,
      requestId,
      note,
      "temporary-admin",
      now
    )
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
      "create_request_note",
      "enterprise_requests",
      requestId,
      JSON.stringify({
        noteId,
        companyName: existing.company_name,
        contactName: existing.contact_name,
        status: existing.status || "new",
        note
      }),
      now
    )
    .run();

  return corsResponse({
    ok: true,
    id: noteId,
    requestId,
    message: "Nota interna registrada correctamente.",
    createdAt: now
  });
}

    async function handleAuthRegister(request, env) {
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

  const fullName = cleanText(body.fullName, 180);
  const email = normalizeAuthEmail(body.email);
  const companyName = cleanText(body.companyName || "", 180);
  const phone = cleanText(body.phone || "", 60);
  const password = String(body.password || "");
  const passwordConfirm = String(body.passwordConfirm || "");
  const website = cleanText(body.website || "", 120);

  if (website) {
    return corsResponse({
      ok: true,
      message: "Registro recibido correctamente."
    });
  }

  if (!fullName) {
    return corsResponse({
      ok: false,
      code: "MISSING_FULL_NAME",
      message: "Ingrese el nombre completo."
    }, 400);
  }

  if (!email || !isValidAuthEmail(email)) {
    return corsResponse({
      ok: false,
      code: "INVALID_EMAIL",
      message: "Ingrese un correo electrónico válido."
    }, 400);
  }

  if (!password || password.length < 8) {
    return corsResponse({
      ok: false,
      code: "WEAK_PASSWORD",
      message: "La contraseña debe tener al menos 8 caracteres."
    }, 400);
  }

  if (password !== passwordConfirm) {
    return corsResponse({
      ok: false,
      code: "PASSWORD_MISMATCH",
      message: "Las contraseñas no coinciden."
    }, 400);
  }

  const existing = await env.DB.prepare(`
    SELECT id
    FROM users
    WHERE lower(email) = lower(?)
    LIMIT 1
  `)
    .bind(email)
    .first();

  if (existing) {
    return corsResponse({
      ok: false,
      code: "EMAIL_EXISTS",
      message: "Ya existe un usuario registrado con ese correo."
    }, 409);
  }

  const now = new Date().toISOString();
  const userId = crypto.randomUUID();
  const passwordHash = await hashAuthPassword(password);

  await env.DB.prepare(`
    INSERT INTO users (
      id,
      full_name,
      email,
      password_hash,
      company_name,
      phone,
      role,
      status,
      source,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
    .bind(
      userId,
      fullName,
      email,
      passwordHash,
      companyName,
      phone,
      "user",
      "pending",
      "website",
      now,
      now
    )
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
      userId,
      "auth_register",
      "users",
      userId,
      JSON.stringify({
        fullName,
        email,
        companyName,
        role: "user",
        status: "pending"
      }),
      now
    )
    .run();

  return corsResponse({
    ok: true,
    id: userId,
    status: "pending",
    message: "Registro creado correctamente. SEAZEP revisará la solicitud de acceso.",
    createdAt: now
  });
}



  function normalizeAuthEmail(value) {
  return String(value || "").trim().toLowerCase().slice(0, 180);
}

function isValidAuthEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""));
}

async function hashAuthPassword(password) {
  const encoder = new TextEncoder();
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    256
  );

  const hashBytes = new Uint8Array(derivedBits);

  return [
    "pbkdf2_sha256",
    "100000",
    bytesToBase64(saltBytes),
    bytesToBase64(hashBytes)
  ].join("$");
}

function bytesToBase64(bytes) {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}



    function base64ToBytes(value) {
  const binary = atob(String(value || ""));
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

async function verifyAuthPassword(password, storedHash) {
  const parts = String(storedHash || "").split("$");

  if (parts.length !== 4) {
    return false;
  }

  const [algorithm, iterationsText, saltBase64, hashBase64] = parts;

  if (algorithm !== "pbkdf2_sha256") {
    return false;
  }

  const iterations = Number(iterationsText);

  if (!Number.isFinite(iterations) || iterations < 10000) {
    return false;
  }

  const saltBytes = base64ToBytes(saltBase64);
  const expectedHashBytes = base64ToBytes(hashBase64);

  const encoder = new TextEncoder();

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations,
      hash: "SHA-256"
    },
    keyMaterial,
    expectedHashBytes.length * 8
  );

  const actualHashBytes = new Uint8Array(derivedBits);

  return constantTimeEqual(actualHashBytes, expectedHashBytes);
}

function constantTimeEqual(a, b) {
  if (!a || !b || a.length !== b.length) {
    return false;
  }

  let result = 0;

  for (let i = 0; i < a.length; i += 1) {
    result |= a[i] ^ b[i];
  }

  return result === 0;
}

function createSessionToken() {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  return `seazep_${bytesToBase64Url(randomBytes)}`;
}

function bytesToBase64Url(bytes) {
  return bytesToBase64(bytes)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

async function sha256Hex(value) {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  const hashBytes = new Uint8Array(hashBuffer);

  return Array.from(hashBytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}


  async function handleAuthLogin(request, env) {
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

  const email = normalizeAuthEmail(body.email);
  const password = String(body.password || "");
  const website = cleanText(body.website || "", 120);

  if (website) {
    return corsResponse({
      ok: false,
      code: "INVALID_CREDENTIALS",
      message: "Correo o contraseña incorrectos."
    }, 401);
  }

  if (!email || !isValidAuthEmail(email)) {
    return corsResponse({
      ok: false,
      code: "INVALID_EMAIL",
      message: "Ingrese un correo electrónico válido."
    }, 400);
  }

  if (!password) {
    return corsResponse({
      ok: false,
      code: "MISSING_PASSWORD",
      message: "Ingrese la contraseña."
    }, 400);
  }

  const user = await env.DB.prepare(`
  SELECT
    u.id,
    u.full_name,
    u.email,
    u.password_hash,
    u.company_name,
    u.company_id,
    u.phone,
    u.role,
    u.status,
    c.name AS linked_company_name,
    c.legal_name AS linked_company_legal_name,
    c.status AS linked_company_status
  FROM users u
  LEFT JOIN companies c ON c.id = u.company_id
  WHERE lower(u.email) = lower(?)
  LIMIT 1
`)
  .bind(email)
  .first();


  if (!user) {
    return corsResponse({
      ok: false,
      code: "INVALID_CREDENTIALS",
      message: "Correo o contraseña incorrectos."
    }, 401);
  }

  const passwordOk = await verifyAuthPassword(password, user.password_hash);

  if (!passwordOk) {
    return corsResponse({
      ok: false,
      code: "INVALID_CREDENTIALS",
      message: "Correo o contraseña incorrectos."
    }, 401);
  }

  if ((user.status || "pending") !== "active") {
    return corsResponse({
      ok: false,
      code: "USER_NOT_ACTIVE",
      message: "Su cuenta aún está pendiente de aprobación por SEAZEP."
    }, 403);
  }

  const now = new Date();
  const nowIso = now.toISOString();

  const expiresAt = new Date(now.getTime() + 1000 * 60 * 60 * 12).toISOString();
  const sessionId = crypto.randomUUID();
  const sessionToken = createSessionToken();
  const tokenHash = await sha256Hex(sessionToken);

  await env.DB.prepare(`
    INSERT INTO user_sessions (
      id,
      user_id,
      token_hash,
      status,
      created_at,
      expires_at,
      last_seen_at,
      user_agent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)
    .bind(
      sessionId,
      user.id,
      tokenHash,
      "active",
      nowIso,
      expiresAt,
      nowIso,
      cleanText(request.headers.get("user-agent") || "", 500)
    )
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
      user.id,
      "auth_login_success",
      "users",
      user.id,
      JSON.stringify({
        email: user.email,
        role: user.role || "user",
        status: user.status || "active",
        sessionId
      }),
      nowIso
    )
    .run();

  return corsResponse({
    ok: true,
    message: "Inicio de sesión correcto.",
    token: sessionToken,
    expiresAt,
    user: {
  id: user.id,
  fullName: user.full_name,
  email: user.email,
  companyName: user.company_name,
  companyId: user.company_id || "",
  linkedCompanyName: user.linked_company_name || "",
  linkedCompanyLegalName: user.linked_company_legal_name || "",
  linkedCompanyStatus: user.linked_company_status || "",
  phone: user.phone,
  role: user.role,
  status: user.status
}

  });
}



  
  async function handleAdminListUsers(request, env) {
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
  const search = cleanText(url.searchParams.get("search") || "", 120);

  const rawLimit = Number(url.searchParams.get("limit") || 50);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(Math.trunc(rawLimit), 1), 100)
    : 50;

  const whereParts = [];
  const params = [];

  if (status && status !== "all") {
    whereParts.push("u.status = ?");
    params.push(status);
  }

  if (search) {
    const likeSearch = `%${search}%`;

    whereParts.push(`(
      u.full_name LIKE ?
      OR u.email LIKE ?
      OR u.company_name LIKE ?
      OR u.phone LIKE ?
      OR u.role LIKE ?
      OR u.status LIKE ?
      OR c.name LIKE ?
      OR c.legal_name LIKE ?
      OR c.contact_email LIKE ?
    )`);

    params.push(
      likeSearch,
      likeSearch,
      likeSearch,
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
      u.id,
      u.full_name,
      u.email,
      u.company_name,
      u.company_id,
      u.phone,
      u.role,
      u.status,
      u.source,
      u.created_at,
      u.updated_at,
      c.name AS linked_company_name,
      c.legal_name AS linked_company_legal_name,
      c.status AS linked_company_status
    FROM users u
    LEFT JOIN companies c ON c.id = u.company_id
    ${whereSql}
    ORDER BY u.created_at DESC
    LIMIT ${limit}
  `;

  const countSql = `
    SELECT COUNT(*) AS total
    FROM users u
    LEFT JOIN companies c ON c.id = u.company_id
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
      COALESCE(status, 'pending') AS status,
      COUNT(*) AS total
    FROM users
    GROUP BY COALESCE(status, 'pending')
  `).all();

  const totalAllResult = await env.DB.prepare(`
    SELECT COUNT(*) AS total
    FROM users
  `).first();

  const summary = {
    total: Number(totalAllResult?.total || 0),
    pending: 0,
    active: 0,
    suspended: 0
  };

  for (const row of summaryResult.results || []) {
    const key = row.status || "pending";
    summary[key] = Number(row.total || 0);
  }

  return corsResponse({
    ok: true,
    count: (listResult.results || []).length,
    total: Number(countResult?.total || 0),
    limit,
    filters: {
      status: status || "all",
      search
    },
    summary,
    users: listResult.results || []
  });
}




  async function handleAdminUpdateUserStatus(request, env) {
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

  const userId = cleanText(body.userId, 80);
  const status = cleanText(body.status, 40);
  const note = cleanText(body.note || "", 800);

  const allowedStatuses = [
    "pending",
    "active",
    "suspended"
  ];

  if (!userId) {
    return corsResponse({
      ok: false,
      code: "MISSING_USER_ID",
      message: "Falta el ID del usuario."
    }, 400);
  }

  if (!allowedStatuses.includes(status)) {
    return corsResponse({
      ok: false,
      code: "INVALID_STATUS",
      message: "Estado de usuario no permitido."
    }, 400);
  }

  const existing = await env.DB.prepare(`
    SELECT
      id,
      full_name,
      email,
      company_name,
      role,
      status
    FROM users
    WHERE id = ?
    LIMIT 1
  `)
    .bind(userId)
    .first();

  if (!existing) {
    return corsResponse({
      ok: false,
      code: "USER_NOT_FOUND",
      message: "No se encontró el usuario."
    }, 404);
  }

  const previousStatus = existing.status || "pending";
  const now = new Date().toISOString();

  await env.DB.prepare(`
    UPDATE users
    SET
      status = ?,
      updated_at = ?
    WHERE id = ?
  `)
    .bind(status, now, userId)
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
      "admin_user_status_updated",
      "users",
      userId,
      JSON.stringify({
        fullName: existing.full_name,
        email: existing.email,
        companyName: existing.company_name || "",
        role: existing.role || "user",
        previousStatus,
        newStatus: status,
        note
      }),
      now
    )
    .run();

  return corsResponse({
    ok: true,
    id: userId,
    previousStatus,
    status,
    message: "Estado de usuario actualizado correctamente.",
    updatedAt: now
  });
}



  async function handleAuthForgotPassword(request, env) {
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

  const email = normalizeAuthEmail(body.email);
  const website = cleanText(body.website || "", 120);

  if (website) {
    return corsResponse({
      ok: true,
      message: "Si el correo está registrado, enviaremos instrucciones de recuperación."
    });
  }

  if (!email || !isValidAuthEmail(email)) {
    return corsResponse({
      ok: false,
      code: "INVALID_EMAIL",
      message: "Ingrese un correo electrónico válido."
    }, 400);
  }

  const safeMessage = "Si el correo está registrado, enviaremos instrucciones de recuperación.";

  const user = await env.DB.prepare(`
    SELECT
      id,
      full_name,
      email,
      status
    FROM users
    WHERE lower(email) = lower(?)
    LIMIT 1
  `)
    .bind(email)
    .first();

  if (!user) {
    return corsResponse({
      ok: true,
      message: safeMessage
    });
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const expiresAt = new Date(now.getTime() + 1000 * 60 * 30).toISOString();

  await env.DB.prepare(`
    UPDATE password_reset_tokens
    SET status = 'revoked'
    WHERE user_id = ?
      AND status = 'active'
  `)
    .bind(user.id)
    .run();

  const resetId = crypto.randomUUID();
  const resetToken = createSessionToken();
  const tokenHash = await sha256Hex(resetToken);

  await env.DB.prepare(`
    INSERT INTO password_reset_tokens (
      id,
      user_id,
      requested_email,
      token_hash,
      status,
      created_at,
      expires_at,
      used_at,
      user_agent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
    .bind(
      resetId,
      user.id,
      email,
      tokenHash,
      "active",
      nowIso,
      expiresAt,
      null,
      cleanText(request.headers.get("user-agent") || "", 500)
    )
    .run();

  const frontendOrigin = env.FRONTEND_ORIGIN || "https://seazep-web.pages.dev";
  const resetUrl = `${frontendOrigin}/restablecer-contrasena?token=${encodeURIComponent(resetToken)}`;

  const emailResult = await sendPasswordResetEmail(env, {
    to: user.email,
    fullName: user.full_name || "Usuario SEAZEP",
    resetUrl,
    expiresAt
  });

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
      user.id,
      emailResult.ok ? "password_reset_email_sent" : "password_reset_email_failed",
      "users",
      user.id,
      JSON.stringify({
        email: user.email,
        resetId,
        expiresAt,
        emailOk: emailResult.ok,
        emailError: emailResult.error || null
      }),
      nowIso
    )
    .run();

  return corsResponse({
    ok: true,
    message: safeMessage
  });
}


  async function handleAuthResetPassword(request, env) {
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

  const token = String(body.token || "").trim();
  const password = String(body.password || "");
  const passwordConfirm = String(body.passwordConfirm || "");
  const website = cleanText(body.website || "", 120);

  if (website) {
    return corsResponse({
      ok: false,
      code: "INVALID_TOKEN",
      message: "El enlace de recuperación no es válido."
    }, 400);
  }

  if (!token) {
    return corsResponse({
      ok: false,
      code: "MISSING_TOKEN",
      message: "Falta el token de recuperación."
    }, 400);
  }

  if (!password || password.length < 8) {
    return corsResponse({
      ok: false,
      code: "WEAK_PASSWORD",
      message: "La nueva contraseña debe tener al menos 8 caracteres."
    }, 400);
  }

  if (password !== passwordConfirm) {
    return corsResponse({
      ok: false,
      code: "PASSWORD_MISMATCH",
      message: "Las contraseñas no coinciden."
    }, 400);
  }

  const tokenHash = await sha256Hex(token);
  const now = new Date();
  const nowIso = now.toISOString();

  const resetRecord = await env.DB.prepare(`
    SELECT
      prt.id,
      prt.user_id,
      prt.requested_email,
      prt.status,
      prt.expires_at,
      u.email,
      u.full_name,
      u.status AS user_status
    FROM password_reset_tokens prt
    INNER JOIN users u ON u.id = prt.user_id
    WHERE prt.token_hash = ?
    LIMIT 1
  `)
    .bind(tokenHash)
    .first();

  if (!resetRecord) {
    return corsResponse({
      ok: false,
      code: "INVALID_TOKEN",
      message: "El enlace de recuperación no es válido."
    }, 400);
  }

  if (resetRecord.status !== "active") {
    return corsResponse({
      ok: false,
      code: "TOKEN_ALREADY_USED",
      message: "El enlace ya fue utilizado o fue revocado."
    }, 400);
  }

  const expiresDate = new Date(resetRecord.expires_at);

  if (Number.isNaN(expiresDate.getTime()) || expiresDate <= now) {
    await env.DB.prepare(`
      UPDATE password_reset_tokens
      SET status = 'expired'
      WHERE id = ?
    `)
      .bind(resetRecord.id)
      .run();

    return corsResponse({
      ok: false,
      code: "TOKEN_EXPIRED",
      message: "El enlace de recuperación ya expiró. Solicite uno nuevo."
    }, 400);
  }

  const passwordHash = await hashAuthPassword(password);

  await env.DB.prepare(`
    UPDATE users
    SET
      password_hash = ?,
      updated_at = ?
    WHERE id = ?
  `)
    .bind(passwordHash, nowIso, resetRecord.user_id)
    .run();

  await env.DB.prepare(`
    UPDATE password_reset_tokens
    SET
      status = 'used',
      used_at = ?
    WHERE id = ?
  `)
    .bind(nowIso, resetRecord.id)
    .run();

  await env.DB.prepare(`
    UPDATE user_sessions
    SET status = 'revoked'
    WHERE user_id = ?
      AND status = 'active'
  `)
    .bind(resetRecord.user_id)
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
      resetRecord.user_id,
      "password_reset_success",
      "users",
      resetRecord.user_id,
      JSON.stringify({
        email: resetRecord.email,
        resetId: resetRecord.id
      }),
      nowIso
    )
    .run();

  return corsResponse({
    ok: true,
    message: "Contraseña actualizada correctamente. Ya puede iniciar sesión."
  });
}



  async function sendPasswordResetEmail(env, data) {
  if (!env.RESEND_API_KEY) {
    return {
      ok: false,
      error: "RESEND_API_KEY no configurada."
    };
  }

  const fromEmail = env.RESEND_FROM_EMAIL || "SEAZEP <onboarding@resend.dev>";

  const subject = "Recuperación de contraseña SEAZEP";

  const text = `
Hola ${data.fullName},

Recibimos una solicitud para restablecer su contraseña en SEAZEP-WEB.

Abra este enlace para crear una nueva contraseña:
${data.resetUrl}

Este enlace vence en 30 minutos.

Si usted no solicitó este cambio, puede ignorar este correo.

SEAZEP Agua y Energía
`.trim();

  const html = `
    <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
      <h2>Recuperación de contraseña SEAZEP</h2>
      <p>Hola <strong>${escapeEmailHtml(data.fullName)}</strong>,</p>
      <p>Recibimos una solicitud para restablecer su contraseña en SEAZEP-WEB.</p>
      <p>
        <a href="${escapeEmailHtml(data.resetUrl)}"
           style="display:inline-block;padding:12px 18px;background:#0284c7;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:bold;">
          Restablecer contraseña
        </a>
      </p>
      <p>Este enlace vence en <strong>30 minutos</strong>.</p>
      <p>Si usted no solicitó este cambio, puede ignorar este correo.</p>
      <hr />
      <p style="font-size:12px;color:#475569;">SEAZEP Agua y Energía</p>
    </div>
  `.trim();

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "authorization": `Bearer ${env.RESEND_API_KEY}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [data.to],
        subject,
        text,
        html
      })
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        ok: false,
        error: result.message || `Resend respondió ${response.status}`
      };
    }

    return {
      ok: true,
      id: result.id || null
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message || "Error al enviar correo."
    };
  }
}

function escapeEmailHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


  async function handleAdminListCompanies(request, env) {
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

  if (search) {
    const likeSearch = `%${search}%`;

    whereParts.push(`(
      name LIKE ?
      OR legal_name LIKE ?
      OR tax_id LIKE ?
      OR contact_name LIKE ?
      OR contact_email LIKE ?
      OR contact_phone LIKE ?
      OR city LIKE ?
      OR state LIKE ?
      OR country LIKE ?
      OR status LIKE ?
      OR notes LIKE ?
    )`);

    params.push(
      likeSearch,
      likeSearch,
      likeSearch,
      likeSearch,
      likeSearch,
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
      name,
      legal_name,
      tax_id,
      contact_name,
      contact_email,
      contact_phone,
      city,
      state,
      country,
      status,
      source_request_id,
      notes,
      created_at,
      updated_at
    FROM companies
    ${whereSql}
    ORDER BY COALESCE(updated_at, created_at) DESC
    LIMIT ${limit}
  `;

  const countSql = `
    SELECT COUNT(*) AS total
    FROM companies
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
      COALESCE(status, 'lead') AS status,
      COUNT(*) AS total
    FROM companies
    GROUP BY COALESCE(status, 'lead')
  `).all();

  const totalAllResult = await env.DB.prepare(`
    SELECT COUNT(*) AS total
    FROM companies
  `).first();

  const summary = {
    total: Number(totalAllResult?.total || 0),
    lead: 0,
    active: 0,
    suspended: 0,
    archived: 0
  };

  for (const row of summaryResult.results || []) {
    const key = row.status || "lead";
    summary[key] = Number(row.total || 0);
  }

  return corsResponse({
    ok: true,
    count: (listResult.results || []).length,
    total: Number(countResult?.total || 0),
    limit,
    filters: {
      status: status || "all",
      search
    },
    summary,
    companies: listResult.results || []
  });
}


  async function handleAdminCreateCompany(request, env) {
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

  const name = cleanText(body.name, 180);
  const legalName = cleanText(body.legalName || "", 220);
  const taxId = cleanText(body.taxId || "", 80);
  const contactName = cleanText(body.contactName || "", 160);
  const contactEmail = normalizeAuthEmail(body.contactEmail || "");
  const contactPhone = cleanText(body.contactPhone || "", 80);
  const city = cleanText(body.city || "", 120);
  const state = cleanText(body.state || "", 120);
  const country = cleanText(body.country || "México", 120);
  const status = cleanText(body.status || "lead", 40);
  const sourceRequestId = cleanText(body.sourceRequestId || "", 80);
  const notes = cleanText(body.notes || "", 1200);

  const allowedStatuses = [
    "lead",
    "active",
    "suspended",
    "archived"
  ];

  if (!name) {
    return corsResponse({
      ok: false,
      code: "MISSING_COMPANY_NAME",
      message: "El nombre de la empresa es obligatorio."
    }, 400);
  }

  if (contactEmail && !isValidAuthEmail(contactEmail)) {
    return corsResponse({
      ok: false,
      code: "INVALID_CONTACT_EMAIL",
      message: "El correo de contacto no es válido."
    }, 400);
  }

  if (!allowedStatuses.includes(status)) {
    return corsResponse({
      ok: false,
      code: "INVALID_STATUS",
      message: "Estado de empresa no permitido."
    }, 400);
  }

  const now = new Date().toISOString();
  const companyId = crypto.randomUUID();

  await env.DB.prepare(`
    INSERT INTO companies (
      id,
      name,
      legal_name,
      tax_id,
      contact_name,
      contact_email,
      contact_phone,
      city,
      state,
      country,
      status,
      source_request_id,
      notes,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
    .bind(
      companyId,
      name,
      legalName || null,
      taxId || null,
      contactName || null,
      contactEmail || null,
      contactPhone || null,
      city || null,
      state || null,
      country || null,
      status,
      sourceRequestId || null,
      notes || null,
      now,
      now
    )
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
      "admin_company_created",
      "companies",
      companyId,
      JSON.stringify({
        name,
        legalName,
        taxId,
        contactName,
        contactEmail,
        contactPhone,
        city,
        state,
        country,
        status,
        sourceRequestId
      }),
      now
    )
    .run();

  return corsResponse({
    ok: true,
    id: companyId,
    message: "Empresa creada correctamente.",
    company: {
      id: companyId,
      name,
      legalName,
      taxId,
      contactName,
      contactEmail,
      contactPhone,
      city,
      state,
      country,
      status,
      sourceRequestId,
      notes,
      createdAt: now,
      updatedAt: now
    }
  });
}


  async function handleAdminUpdateCompanyStatus(request, env) {
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

  const companyId = cleanText(body.companyId, 80);
  const status = cleanText(body.status, 40);
  const note = cleanText(body.note || "", 800);

  const allowedStatuses = [
    "lead",
    "active",
    "suspended",
    "archived"
  ];

  if (!companyId) {
    return corsResponse({
      ok: false,
      code: "MISSING_COMPANY_ID",
      message: "Falta el ID de la empresa."
    }, 400);
  }

  if (!allowedStatuses.includes(status)) {
    return corsResponse({
      ok: false,
      code: "INVALID_STATUS",
      message: "Estado de empresa no permitido."
    }, 400);
  }

  const existing = await env.DB.prepare(`
    SELECT
      id,
      name,
      legal_name,
      contact_email,
      status
    FROM companies
    WHERE id = ?
    LIMIT 1
  `)
    .bind(companyId)
    .first();

  if (!existing) {
    return corsResponse({
      ok: false,
      code: "COMPANY_NOT_FOUND",
      message: "No se encontró la empresa."
    }, 404);
  }

  const previousStatus = existing.status || "lead";
  const now = new Date().toISOString();

  await env.DB.prepare(`
    UPDATE companies
    SET
      status = ?,
      updated_at = ?
    WHERE id = ?
  `)
    .bind(status, now, companyId)
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
      "admin_company_status_updated",
      "companies",
      companyId,
      JSON.stringify({
        name: existing.name,
        legalName: existing.legal_name || "",
        contactEmail: existing.contact_email || "",
        previousStatus,
        newStatus: status,
        note
      }),
      now
    )
    .run();

  return corsResponse({
    ok: true,
    id: companyId,
    previousStatus,
    status,
    message: "Estado de empresa actualizado correctamente.",
    updatedAt: now
  });
}



  async function handleAdminConvertRequestToCompany(request, env) {
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

  const requestId = cleanText(body.requestId, 80);
  const companyStatus = cleanText(body.companyStatus || "lead", 40);
  const adminNote = cleanText(body.note || "", 1000);

  const allowedCompanyStatuses = [
    "lead",
    "active",
    "suspended",
    "archived"
  ];

  if (!requestId) {
    return corsResponse({
      ok: false,
      code: "MISSING_REQUEST_ID",
      message: "Falta el ID de la solicitud."
    }, 400);
  }

  if (!allowedCompanyStatuses.includes(companyStatus)) {
    return corsResponse({
      ok: false,
      code: "INVALID_COMPANY_STATUS",
      message: "Estado de empresa no permitido."
    }, 400);
  }

  const existingRequest = await env.DB.prepare(`
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
    WHERE id = ?
    LIMIT 1
  `)
    .bind(requestId)
    .first();

  if (!existingRequest) {
    return corsResponse({
      ok: false,
      code: "REQUEST_NOT_FOUND",
      message: "No se encontró la solicitud."
    }, 404);
  }

  const existingCompany = await env.DB.prepare(`
    SELECT
      id,
      name,
      status,
      source_request_id
    FROM companies
    WHERE source_request_id = ?
    LIMIT 1
  `)
    .bind(requestId)
    .first();

  if (existingCompany) {
    return corsResponse({
      ok: false,
      code: "REQUEST_ALREADY_CONVERTED",
      message: "Esta solicitud ya fue convertida en empresa.",
      company: existingCompany
    }, 409);
  }

  const companyName = cleanText(
    body.companyName || existingRequest.company_name || "",
    180
  );

  const contactName = cleanText(
    body.contactName || existingRequest.contact_name || "",
    160
  );

  const contactEmail = normalizeAuthEmail(
    body.contactEmail || existingRequest.contact_email || ""
  );

  const contactPhone = cleanText(
    body.contactPhone || existingRequest.contact_phone || "",
    80
  );

  if (!companyName) {
    return corsResponse({
      ok: false,
      code: "MISSING_COMPANY_NAME",
      message: "La solicitud no tiene nombre de empresa suficiente para convertirla."
    }, 400);
  }

  if (contactEmail && !isValidAuthEmail(contactEmail)) {
    return corsResponse({
      ok: false,
      code: "INVALID_CONTACT_EMAIL",
      message: "El correo de contacto de la solicitud no es válido."
    }, 400);
  }

  const now = new Date().toISOString();
  const companyId = crypto.randomUUID();

  const notesParts = [
    "Empresa creada automáticamente desde una solicitud comercial.",
    `ID de solicitud: ${existingRequest.id}`,
    `Área de interés: ${existingRequest.interest_area || "No especificada"}`,
    `Cargo/contacto: ${existingRequest.contact_position || "No especificado"}`,
    `Mensaje original: ${existingRequest.message || "Sin mensaje"}`
  ];

  if (adminNote) {
    notesParts.push(`Nota ADM: ${adminNote}`);
  }

  const companyNotes = cleanText(notesParts.join("\n"), 1200);

  await env.DB.prepare(`
    INSERT INTO companies (
      id,
      name,
      legal_name,
      tax_id,
      contact_name,
      contact_email,
      contact_phone,
      city,
      state,
      country,
      status,
      source_request_id,
      notes,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
    .bind(
      companyId,
      companyName,
      null,
      null,
      contactName || null,
      contactEmail || null,
      contactPhone || null,
      null,
      null,
      "México",
      companyStatus,
      requestId,
      companyNotes,
      now,
      now
    )
    .run();

  const previousRequestStatus = existingRequest.status || "new";

  await env.DB.prepare(`
    UPDATE enterprise_requests
    SET status = ?
    WHERE id = ?
  `)
    .bind("closed", requestId)
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
      "admin_request_converted_to_company",
      "enterprise_requests",
      requestId,
      JSON.stringify({
        requestId,
        companyId,
        companyName,
        contactName,
        contactEmail,
        contactPhone,
        interestArea: existingRequest.interest_area || "",
        previousRequestStatus,
        newRequestStatus: "closed",
        companyStatus,
        adminNote
      }),
      now
    )
    .run();

  return corsResponse({
    ok: true,
    message: "Solicitud convertida en empresa correctamente.",
    requestId,
    companyId,
    company: {
      id: companyId,
      name: companyName,
      contactName,
      contactEmail,
      contactPhone,
      status: companyStatus,
      sourceRequestId: requestId,
      createdAt: now,
      updatedAt: now
    },
    request: {
      id: requestId,
      previousStatus: previousRequestStatus,
      status: "closed"
    }
  });
}




  async function handleAdminAssignUserCompany(request, env) {
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

  const userId = cleanText(body.userId, 80);
  const companyId = cleanText(body.companyId || "", 80);
  const note = cleanText(body.note || "", 800);

  if (!userId) {
    return corsResponse({
      ok: false,
      code: "MISSING_USER_ID",
      message: "Falta el ID del usuario."
    }, 400);
  }

  const existingUser = await env.DB.prepare(`
    SELECT
      id,
      full_name,
      email,
      company_name,
      company_id,
      role,
      status
    FROM users
    WHERE id = ?
    LIMIT 1
  `)
    .bind(userId)
    .first();

  if (!existingUser) {
    return corsResponse({
      ok: false,
      code: "USER_NOT_FOUND",
      message: "No se encontró el usuario."
    }, 404);
  }

  let company = null;

  if (companyId) {
    company = await env.DB.prepare(`
      SELECT
        id,
        name,
        legal_name,
        status
      FROM companies
      WHERE id = ?
      LIMIT 1
    `)
      .bind(companyId)
      .first();

    if (!company) {
      return corsResponse({
        ok: false,
        code: "COMPANY_NOT_FOUND",
        message: "No se encontró la empresa seleccionada."
      }, 404);
    }
  }

  const previousCompanyId = existingUser.company_id || null;
  const now = new Date().toISOString();

  await env.DB.prepare(`
    UPDATE users
    SET
      company_id = ?,
      updated_at = ?
    WHERE id = ?
  `)
    .bind(companyId || null, now, userId)
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
      "admin_user_company_assigned",
      "users",
      userId,
      JSON.stringify({
        userId,
        fullName: existingUser.full_name,
        email: existingUser.email,
        declaredCompanyName: existingUser.company_name || "",
        previousCompanyId,
        newCompanyId: companyId || null,
        companyName: company?.name || null,
        companyStatus: company?.status || null,
        note
      }),
      now
    )
    .run();

  return corsResponse({
    ok: true,
    message: companyId
      ? "Usuario asociado a empresa correctamente."
      : "Usuario desvinculado de empresa correctamente.",
    userId,
    previousCompanyId,
    companyId: companyId || null,
    company: company
      ? {
          id: company.id,
          name: company.name,
          legalName: company.legal_name || "",
          status: company.status || ""
        }
      : null,
    updatedAt: now
  });
}


  async function handleAdminListManuals(request, env) {
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
  const visibility = cleanText(url.searchParams.get("visibility") || "", 40);
  const search = cleanText(url.searchParams.get("search") || "", 120);

  const rawLimit = Number(url.searchParams.get("limit") || 50);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(Math.trunc(rawLimit), 1), 100)
    : 50;

  const whereParts = [];
  const params = [];

  if (status && status !== "all") {
    whereParts.push("m.status = ?");
    params.push(status);
  }

  if (visibility && visibility !== "all") {
    whereParts.push("m.visibility = ?");
    params.push(visibility);
  }

  if (search) {
    const likeSearch = `%${search}%`;

    whereParts.push(`(
      m.title LIKE ?
      OR m.description LIKE ?
      OR m.category LIKE ?
      OR m.version LIKE ?
      OR m.file_url LIKE ?
      OR m.status LIKE ?
      OR m.visibility LIKE ?
    )`);

    params.push(
      likeSearch,
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
      m.id,
      m.title,
      m.description,
      m.file_url,
      m.category,
      m.version,
      m.status,
      m.visibility,
      m.product_id,
      m.created_at,
      m.updated_at,
      COUNT(mca.company_id) AS assigned_companies_count
    FROM manuals m
    LEFT JOIN manual_company_access mca
      ON mca.manual_id = m.id
      AND mca.status = 'active'
    ${whereSql}
    GROUP BY
      m.id,
      m.title,
      m.description,
      m.file_url,
      m.category,
      m.version,
      m.status,
      m.visibility,
      m.product_id,
      m.created_at,
      m.updated_at
    ORDER BY COALESCE(m.updated_at, m.created_at) DESC
    LIMIT ${limit}
  `;

  const countSql = `
    SELECT COUNT(*) AS total
    FROM manuals m
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
      COALESCE(status, 'active') AS status,
      COUNT(*) AS total
    FROM manuals
    GROUP BY COALESCE(status, 'active')
  `).all();

  const visibilityResult = await env.DB.prepare(`
    SELECT
      COALESCE(visibility, 'private') AS visibility,
      COUNT(*) AS total
    FROM manuals
    GROUP BY COALESCE(visibility, 'private')
  `).all();

  const totalAllResult = await env.DB.prepare(`
    SELECT COUNT(*) AS total
    FROM manuals
  `).first();

  const summary = {
    total: Number(totalAllResult?.total || 0),
    active: 0,
    inactive: 0,
    archived: 0,
    public: 0,
    private: 0
  };

  for (const row of summaryResult.results || []) {
    const key = row.status || "active";
    summary[key] = Number(row.total || 0);
  }

  for (const row of visibilityResult.results || []) {
    const key = row.visibility || "private";
    summary[key] = Number(row.total || 0);
  }

  return corsResponse({
    ok: true,
    count: (listResult.results || []).length,
    total: Number(countResult?.total || 0),
    limit,
    filters: {
      status: status || "all",
      visibility: visibility || "all",
      search
    },
    summary,
    manuals: listResult.results || []
  });
}

async function handleAdminCreateManual(request, env) {
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

  const title = cleanText(body.title, 180);
  const description = cleanText(body.description || "", 1200);
  const fileUrl = cleanText(body.fileUrl || "", 500);
  const category = cleanText(body.category || "", 120);
  const version = cleanText(body.version || "", 80);
  const status = cleanText(body.status || "active", 40);
  const visibility = cleanText(body.visibility || "private", 40);
  const productId = cleanText(body.productId || "", 80);

  const allowedStatuses = [
    "active",
    "inactive",
    "archived"
  ];

  const allowedVisibility = [
    "private",
    "public"
  ];

  if (!title) {
    return corsResponse({
      ok: false,
      code: "MISSING_TITLE",
      message: "El título del manual es obligatorio."
    }, 400);
  }

  if (!fileUrl) {
    return corsResponse({
      ok: false,
      code: "MISSING_FILE_URL",
      message: "La URL o ruta del archivo es obligatoria."
    }, 400);
  }

  if (!allowedStatuses.includes(status)) {
    return corsResponse({
      ok: false,
      code: "INVALID_STATUS",
      message: "Estado de manual no permitido."
    }, 400);
  }

  if (!allowedVisibility.includes(visibility)) {
    return corsResponse({
      ok: false,
      code: "INVALID_VISIBILITY",
      message: "Visibilidad de manual no permitida."
    }, 400);
  }

  const now = new Date().toISOString();
  const manualId = crypto.randomUUID();

  await env.DB.prepare(`
    INSERT INTO manuals (
      id,
      title,
      description,
      file_url,
      category,
      version,
      status,
      visibility,
      product_id,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
    .bind(
      manualId,
      title,
      description || null,
      fileUrl,
      category || null,
      version || null,
      status,
      visibility,
      productId || null,
      now,
      now
    )
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
      "admin_manual_created",
      "manuals",
      manualId,
      JSON.stringify({
        title,
        fileUrl,
        category,
        version,
        status,
        visibility,
        productId
      }),
      now
    )
    .run();

  return corsResponse({
    ok: true,
    id: manualId,
    message: "Manual creado correctamente.",
    manual: {
      id: manualId,
      title,
      description,
      fileUrl,
      category,
      version,
      status,
      visibility,
      productId,
      createdAt: now,
      updatedAt: now
    }
  });
}

async function handleAdminUpdateManualStatus(request, env) {
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

  const manualId = cleanText(body.manualId, 80);
  const status = cleanText(body.status, 40);
  const note = cleanText(body.note || "", 800);

  const allowedStatuses = [
    "active",
    "inactive",
    "archived"
  ];

  if (!manualId) {
    return corsResponse({
      ok: false,
      code: "MISSING_MANUAL_ID",
      message: "Falta el ID del manual."
    }, 400);
  }

  if (!allowedStatuses.includes(status)) {
    return corsResponse({
      ok: false,
      code: "INVALID_STATUS",
      message: "Estado de manual no permitido."
    }, 400);
  }

  const existing = await env.DB.prepare(`
    SELECT
      id,
      title,
      status,
      visibility
    FROM manuals
    WHERE id = ?
    LIMIT 1
  `)
    .bind(manualId)
    .first();

  if (!existing) {
    return corsResponse({
      ok: false,
      code: "MANUAL_NOT_FOUND",
      message: "No se encontró el manual."
    }, 404);
  }

  const previousStatus = existing.status || "active";
  const now = new Date().toISOString();

  await env.DB.prepare(`
    UPDATE manuals
    SET
      status = ?,
      updated_at = ?
    WHERE id = ?
  `)
    .bind(status, now, manualId)
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
      "admin_manual_status_updated",
      "manuals",
      manualId,
      JSON.stringify({
        title: existing.title,
        visibility: existing.visibility || "",
        previousStatus,
        newStatus: status,
        note
      }),
      now
    )
    .run();

  return corsResponse({
    ok: true,
    id: manualId,
    previousStatus,
    status,
    message: "Estado de manual actualizado correctamente.",
    updatedAt: now
  });
}

async function handleAdminAssignManualCompany(request, env) {
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

  const manualId = cleanText(body.manualId, 80);
  const companyId = cleanText(body.companyId, 80);
  const status = cleanText(body.status || "active", 40);
  const note = cleanText(body.note || "", 800);

  const allowedStatuses = [
    "active",
    "revoked"
  ];

  if (!manualId) {
    return corsResponse({
      ok: false,
      code: "MISSING_MANUAL_ID",
      message: "Falta el ID del manual."
    }, 400);
  }

  if (!companyId) {
    return corsResponse({
      ok: false,
      code: "MISSING_COMPANY_ID",
      message: "Falta el ID de la empresa."
    }, 400);
  }

  if (!allowedStatuses.includes(status)) {
    return corsResponse({
      ok: false,
      code: "INVALID_STATUS",
      message: "Estado de asignación no permitido."
    }, 400);
  }

  const manual = await env.DB.prepare(`
    SELECT
      id,
      title,
      status,
      visibility
    FROM manuals
    WHERE id = ?
    LIMIT 1
  `)
    .bind(manualId)
    .first();

  if (!manual) {
    return corsResponse({
      ok: false,
      code: "MANUAL_NOT_FOUND",
      message: "No se encontró el manual."
    }, 404);
  }

  const company = await env.DB.prepare(`
    SELECT
      id,
      name,
      status
    FROM companies
    WHERE id = ?
    LIMIT 1
  `)
    .bind(companyId)
    .first();

  if (!company) {
    return corsResponse({
      ok: false,
      code: "COMPANY_NOT_FOUND",
      message: "No se encontró la empresa."
    }, 404);
  }

  const now = new Date().toISOString();
  const accessId = crypto.randomUUID();

  await env.DB.prepare(`
    INSERT INTO manual_company_access (
      id,
      manual_id,
      company_id,
      status,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(manual_id, company_id)
    DO UPDATE SET
      status = excluded.status,
      updated_at = excluded.updated_at
  `)
    .bind(
      accessId,
      manualId,
      companyId,
      status,
      now,
      now
    )
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
      "admin_manual_company_access_updated",
      "manual_company_access",
      manualId,
      JSON.stringify({
        manualId,
        manualTitle: manual.title,
        companyId,
        companyName: company.name,
        status,
        note
      }),
      now
    )
    .run();

  return corsResponse({
    ok: true,
    message: status === "active"
      ? "Manual asignado a empresa correctamente."
      : "Acceso al manual revocado para la empresa.",
    manualId,
    companyId,
    status,
    updatedAt: now
  });
}

function getBearerToken(request) {
  const authorization = request.headers.get("authorization") || "";

  if (!authorization.toLowerCase().startsWith("bearer ")) {
    return "";
  }

  return authorization.slice(7).trim();
}

async function getAuthenticatedUserFromRequest(request, env) {
  const token = getBearerToken(request);

  if (!token) {
    return null;
  }

  const tokenHash = await sha256Hex(token);
  const nowIso = new Date().toISOString();

  const session = await env.DB.prepare(`
    SELECT
      s.id AS session_id,
      s.user_id,
      s.status AS session_status,
      s.expires_at,
      u.id,
      u.full_name,
      u.email,
      u.company_name,
      u.company_id,
      u.phone,
      u.role,
      u.status,
      c.name AS linked_company_name,
      c.status AS linked_company_status
    FROM user_sessions s
    INNER JOIN users u ON u.id = s.user_id
    LEFT JOIN companies c ON c.id = u.company_id
    WHERE s.token_hash = ?
      AND s.status = 'active'
      AND s.expires_at > ?
      AND u.status = 'active'
    LIMIT 1
  `)
    .bind(tokenHash, nowIso)
    .first();

  if (!session) {
    return null;
  }

  await env.DB.prepare(`
    UPDATE user_sessions
    SET last_seen_at = ?
    WHERE id = ?
  `)
    .bind(nowIso, session.session_id)
    .run();

  return session;
}

async function handleUserListManuals(request, env) {
  const user = await getAuthenticatedUserFromRequest(request, env);

  if (!user) {
    return corsResponse({
      ok: false,
      code: "UNAUTHORIZED",
      message: "Sesión no válida o expirada."
    }, 401);
  }

  const manualsResult = await env.DB.prepare(`
    SELECT DISTINCT
      m.id,
      m.title,
      m.description,
      m.file_url,
      m.category,
      m.version,
      m.status,
      m.visibility,
      m.product_id,
      m.created_at,
      m.updated_at
    FROM manuals m
    LEFT JOIN manual_company_access mca
      ON mca.manual_id = m.id
      AND mca.status = 'active'
      AND mca.company_id = ?
    WHERE m.status = 'active'
      AND (
        m.visibility = 'public'
        OR (
          m.visibility = 'private'
          AND ? IS NOT NULL
          AND mca.company_id = ?
        )
      )
    ORDER BY COALESCE(m.updated_at, m.created_at) DESC
  `)
    .bind(
      user.company_id || "",
      user.company_id || null,
      user.company_id || ""
    )
    .all();

  return corsResponse({
    ok: true,
    user: {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      companyId: user.company_id || "",
      linkedCompanyName: user.linked_company_name || "",
      linkedCompanyStatus: user.linked_company_status || ""
    },
    count: (manualsResult.results || []).length,
    manuals: manualsResult.results || []
  });
}



  async function handleUserOpenManual(request, env) {
  const user = await getAuthenticatedUserFromRequest(request, env);

  if (!user) {
    return corsResponse({
      ok: false,
      code: "UNAUTHORIZED",
      message: "Sesión no válida o expirada."
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

  const manualId = cleanText(body.manualId, 80);

  if (!manualId) {
    return corsResponse({
      ok: false,
      code: "MISSING_MANUAL_ID",
      message: "Falta el ID del manual."
    }, 400);
  }

  const manual = await env.DB.prepare(`
    SELECT DISTINCT
      m.id,
      m.title,
      m.description,
      m.file_url,
      m.category,
      m.version,
      m.status,
      m.visibility,
      m.product_id
    FROM manuals m
    LEFT JOIN manual_company_access mca
      ON mca.manual_id = m.id
      AND mca.status = 'active'
      AND mca.company_id = ?
    WHERE m.id = ?
      AND m.status = 'active'
      AND (
        m.visibility = 'public'
        OR (
          m.visibility = 'private'
          AND ? IS NOT NULL
          AND mca.company_id = ?
        )
      )
    LIMIT 1
  `)
    .bind(
      user.company_id || "",
      manualId,
      user.company_id || null,
      user.company_id || ""
    )
    .first();

  if (!manual) {
    return corsResponse({
      ok: false,
      code: "MANUAL_ACCESS_DENIED",
      message: "Manual no encontrado o no autorizado para su empresa."
    }, 404);
  }

  if (!manual.file_url) {
    return corsResponse({
      ok: false,
      code: "MANUAL_FILE_MISSING",
      message: "El manual no tiene archivo configurado."
    }, 409);
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const expiresAt = new Date(now.getTime() + 1000 * 60 * 5).toISOString();

  const downloadId = crypto.randomUUID();
  const fileTokenId = crypto.randomUUID();
  const fileToken = createSessionToken();
  const tokenHash = await sha256Hex(fileToken);

  const ipAddress = request.headers.get("cf-connecting-ip") || "";
  const userAgent = request.headers.get("user-agent") || "";

  await env.DB.prepare(`
    INSERT INTO manual_downloads (
      id,
      manual_id,
      user_id,
      company_id,
      session_id,
      file_url,
      ip_address,
      user_agent,
      downloaded_at,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
    .bind(
      downloadId,
      manual.id,
      user.id,
      user.company_id || null,
      user.session_id || null,
      manual.file_url,
      ipAddress,
      userAgent,
      nowIso,
      nowIso
    )
    .run();

  await env.DB.prepare(`
    INSERT INTO manual_file_tokens (
      id,
      manual_id,
      user_id,
      company_id,
      download_id,
      token_hash,
      status,
      created_at,
      expires_at,
      used_at,
      user_agent,
      ip_address
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
    .bind(
      fileTokenId,
      manual.id,
      user.id,
      user.company_id || null,
      downloadId,
      tokenHash,
      "active",
      nowIso,
      expiresAt,
      null,
      userAgent,
      ipAddress
    )
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
      user.id,
      "user_manual_open_authorized",
      "manuals",
      manual.id,
      JSON.stringify({
        manualId: manual.id,
        manualTitle: manual.title,
        companyId: user.company_id || "",
        companyName: user.linked_company_name || "",
        downloadId,
        fileTokenId,
        expiresAt
      }),
      nowIso
    )
    .run();

  const openUrl = `${new URL(request.url).origin}/user/manuals/file?token=${encodeURIComponent(fileToken)}`;

  return corsResponse({
    ok: true,
    message: "Acceso temporal al manual autorizado.",
    downloadId,
    openUrl,
    expiresAt,
    manual: {
      id: manual.id,
      title: manual.title,
      description: manual.description || "",
      category: manual.category || "",
      version: manual.version || "",
      visibility: manual.visibility || "",
      productId: manual.product_id || ""
    },
    loggedAt: nowIso
  });
}



  async function handleUserManualFile(request, env) {
  const url = new URL(request.url);
  const token = String(url.searchParams.get("token") || "").trim();

  if (!token) {
    return new Response("Token requerido.", {
      status: 400,
      headers: {
        ...corsHeaders(),
        "content-type": "text/plain; charset=utf-8"
      }
    });
  }

  const tokenHash = await sha256Hex(token);
  const nowIso = new Date().toISOString();

  const record = await env.DB.prepare(`
    SELECT
      mft.id,
      mft.manual_id,
      mft.user_id,
      mft.company_id,
      mft.download_id,
      mft.status,
      mft.expires_at,
      mft.used_at,
      m.title,
      m.file_url,
      m.status AS manual_status
    FROM manual_file_tokens mft
    INNER JOIN manuals m ON m.id = mft.manual_id
    WHERE mft.token_hash = ?
    LIMIT 1
  `)
    .bind(tokenHash)
    .first();

  if (!record) {
    return new Response("Token no válido.", {
      status: 404,
      headers: {
        ...corsHeaders(),
        "content-type": "text/plain; charset=utf-8"
      }
    });
  }

  if (record.status !== "active") {
    return new Response("Token no activo.", {
      status: 403,
      headers: {
        ...corsHeaders(),
        "content-type": "text/plain; charset=utf-8"
      }
    });
  }

  if (record.manual_status !== "active") {
    return new Response("Manual inactivo.", {
      status: 403,
      headers: {
        ...corsHeaders(),
        "content-type": "text/plain; charset=utf-8"
      }
    });
  }

  const expiresDate = new Date(record.expires_at);

  if (Number.isNaN(expiresDate.getTime()) || expiresDate <= new Date()) {
    await env.DB.prepare(`
      UPDATE manual_file_tokens
      SET status = 'expired'
      WHERE id = ?
    `)
      .bind(record.id)
      .run();

    return new Response("Token expirado.", {
      status: 403,
      headers: {
        ...corsHeaders(),
        "content-type": "text/plain; charset=utf-8"
      }
    });
  }

  if (!record.file_url) {
    return new Response("Archivo no configurado.", {
      status: 409,
      headers: {
        ...corsHeaders(),
        "content-type": "text/plain; charset=utf-8"
      }
    });
  }

  await env.DB.prepare(`
    UPDATE manual_file_tokens
    SET used_at = ?
    WHERE id = ?
      AND used_at IS NULL
  `)
    .bind(nowIso, record.id)
    .run();

  const frontendOrigin = String(env.FRONTEND_ORIGIN || "https://seazep-web.pages.dev").replace(/\/$/, "");
  const fileUrl = String(record.file_url || "").trim();

  const sourceUrl = fileUrl.startsWith("http://") || fileUrl.startsWith("https://")
    ? fileUrl
    : `${frontendOrigin}${fileUrl.startsWith("/") ? "" : "/"}${fileUrl}`;

  const fileResponse = await fetch(sourceUrl);

  if (!fileResponse.ok) {
    return new Response("No se pudo obtener el archivo del manual.", {
      status: 502,
      headers: {
        ...corsHeaders(),
        "content-type": "text/plain; charset=utf-8"
      }
    });
  }

  const fileName = getSafeManualFileName(record.title || "manual-seazep");

  return new Response(fileResponse.body, {
    status: 200,
    headers: {
      ...corsHeaders(),
      "content-type": fileResponse.headers.get("content-type") || "application/pdf",
      "content-disposition": `inline; filename="${fileName}"`,
      "cache-control": "no-store, no-cache, must-revalidate, max-age=0"
    }
  });
}

function getSafeManualFileName(value) {
  const base = String(value || "manual-seazep")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 80) || "manual-seazep";

  return `${base}.pdf`;
}





  async function handleAdminListManualDownloads(request, env) {
  const auth = validateAdminRequest(request, env);

  if (!auth.ok) {
    return corsResponse({
      ok: false,
      code: "UNAUTHORIZED",
      message: "Acceso administrativo no autorizado."
    }, 401);
  }

  const url = new URL(request.url);

  const search = cleanText(url.searchParams.get("search") || "", 120);

  const rawLimit = Number(url.searchParams.get("limit") || 50);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(Math.trunc(rawLimit), 1), 100)
    : 50;

  const whereParts = [];
  const params = [];

  if (search) {
    const likeSearch = `%${search}%`;

    whereParts.push(`(
      m.title LIKE ?
      OR m.category LIKE ?
      OR u.email LIKE ?
      OR u.full_name LIKE ?
      OR c.name LIKE ?
      OR md.file_url LIKE ?
      OR md.ip_address LIKE ?
      OR md.user_agent LIKE ?
    )`);

    params.push(
      likeSearch,
      likeSearch,
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
      md.id,
      md.manual_id,
      m.title AS manual_title,
      m.category AS manual_category,
      m.version AS manual_version,
      md.user_id,
      u.full_name AS user_full_name,
      u.email AS user_email,
      md.company_id,
      c.name AS company_name,
      c.status AS company_status,
      md.session_id,
      md.file_url,
      md.ip_address,
      md.user_agent,
      md.downloaded_at,
      md.created_at
    FROM manual_downloads md
    LEFT JOIN manuals m ON m.id = md.manual_id
    LEFT JOIN users u ON u.id = md.user_id
    LEFT JOIN companies c ON c.id = md.company_id
    ${whereSql}
    ORDER BY COALESCE(md.downloaded_at, md.created_at) DESC
    LIMIT ${limit}
  `;

  const countSql = `
    SELECT COUNT(*) AS total
    FROM manual_downloads md
    LEFT JOIN manuals m ON m.id = md.manual_id
    LEFT JOIN users u ON u.id = md.user_id
    LEFT JOIN companies c ON c.id = md.company_id
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
      COUNT(*) AS total_downloads,
      COUNT(DISTINCT manual_id) AS unique_manuals,
      COUNT(DISTINCT user_id) AS unique_users,
      COUNT(DISTINCT company_id) AS unique_companies
    FROM manual_downloads
  `).first();

  return corsResponse({
    ok: true,
    count: (listResult.results || []).length,
    total: Number(countResult?.total || 0),
    limit,
    filters: {
      search
    },
    summary: {
      totalDownloads: Number(summaryResult?.total_downloads || 0),
      uniqueManuals: Number(summaryResult?.unique_manuals || 0),
      uniqueUsers: Number(summaryResult?.unique_users || 0),
      uniqueCompanies: Number(summaryResult?.unique_companies || 0)
    },
    downloads: listResult.results || []
  });
}


  async function handleAdminListLicenses(request, env) {
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
  const companyId = cleanText(url.searchParams.get("companyId") || "", 80);
  const productId = cleanText(url.searchParams.get("productId") || "", 80);
  const search = cleanText(url.searchParams.get("search") || "", 120);

  const rawLimit = Number(url.searchParams.get("limit") || 50);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(Math.trunc(rawLimit), 1), 100)
    : 50;

  const whereParts = [];
  const params = [];

  if (status && status !== "all") {
    whereParts.push("l.status = ?");
    params.push(status);
  }

  if (companyId && companyId !== "all") {
    whereParts.push("l.company_id = ?");
    params.push(companyId);
  }

  if (productId && productId !== "all") {
    whereParts.push("l.product_id = ?");
    params.push(productId);
  }

  if (search) {
    const likeSearch = `%${search}%`;

    whereParts.push(`(
      l.license_id LIKE ?
      OR l.license_name LIKE ?
      OR l.machine_id LIKE ?
      OR l.notes LIKE ?
      OR c.name LIKE ?
      OR c.legal_name LIKE ?
      OR c.contact_email LIKE ?
      OR sp.name LIKE ?
      OR sp.slug LIKE ?
    )`);

    params.push(
      likeSearch,
      likeSearch,
      likeSearch,
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
      l.id,
      l.company_id,
      c.name AS company_name,
      c.legal_name AS company_legal_name,
      c.status AS company_status,
      l.product_id,
      sp.slug AS product_slug,
      sp.name AS product_name,
      sp.status AS product_status,
      l.license_id,
      l.license_name,
      l.machine_id,
      l.status,
      l.starts_at,
      l.activated_at,
      l.expires_at,
      l.max_users,
      l.max_devices,
      l.notes,
      l.created_at,
      l.updated_at,
      COUNT(la.id) AS activations_count
    FROM licenses l
    LEFT JOIN companies c ON c.id = l.company_id
    LEFT JOIN software_products sp ON sp.id = l.product_id
    LEFT JOIN license_activations la
  ON la.license_id = l.id
  AND la.status = 'active'
    ${whereSql}
    GROUP BY
      l.id,
      l.company_id,
      c.name,
      c.legal_name,
      c.status,
      l.product_id,
      sp.slug,
      sp.name,
      sp.status,
      l.license_id,
      l.license_name,
      l.machine_id,
      l.status,
      l.starts_at,
      l.activated_at,
      l.expires_at,
      l.max_users,
      l.max_devices,
      l.notes,
      l.created_at,
      l.updated_at
    ORDER BY COALESCE(l.updated_at, l.created_at) DESC
    LIMIT ${limit}
  `;

  const countSql = `
    SELECT COUNT(*) AS total
    FROM licenses l
    LEFT JOIN companies c ON c.id = l.company_id
    LEFT JOIN software_products sp ON sp.id = l.product_id
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
      COALESCE(status, 'active') AS status,
      COUNT(*) AS total
    FROM licenses
    GROUP BY COALESCE(status, 'active')
  `).all();

  const totalAllResult = await env.DB.prepare(`
    SELECT COUNT(*) AS total
    FROM licenses
  `).first();

  const summary = {
    total: Number(totalAllResult?.total || 0),
    active: 0,
    suspended: 0,
    expired: 0,
    revoked: 0
  };

  for (const row of summaryResult.results || []) {
    const key = row.status || "active";
    summary[key] = Number(row.total || 0);
  }

  return corsResponse({
    ok: true,
    count: (listResult.results || []).length,
    total: Number(countResult?.total || 0),
    limit,
    filters: {
      status: status || "all",
      companyId: companyId || "all",
      productId: productId || "all",
      search
    },
    summary,
    licenses: listResult.results || []
  });
}

async function handleAdminCreateLicense(request, env) {
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

  const companyId = cleanText(body.companyId, 80);
  const productId = cleanText(body.productId || "spz-product-smartpozo360", 80);
  const licenseName = cleanText(body.licenseName || "", 180);
  const licenseId = cleanText(body.licenseId || generateLicenseCode(), 120).toUpperCase();
  const status = cleanText(body.status || "active", 40);
  const startsAt = cleanText(body.startsAt || "", 80);
  const expiresAt = cleanText(body.expiresAt || "", 80);
  const maxUsers = parsePositiveInteger(body.maxUsers, 3);
  const maxDevices = parsePositiveInteger(body.maxDevices, 1);
  const notes = cleanText(body.notes || "", 1200);

  const allowedStatuses = [
    "active",
    "suspended",
    "expired",
    "revoked"
  ];

  if (!companyId) {
    return corsResponse({
      ok: false,
      code: "MISSING_COMPANY_ID",
      message: "Falta seleccionar la empresa."
    }, 400);
  }

  if (!productId) {
    return corsResponse({
      ok: false,
      code: "MISSING_PRODUCT_ID",
      message: "Falta seleccionar el software."
    }, 400);
  }

  if (!licenseId) {
    return corsResponse({
      ok: false,
      code: "MISSING_LICENSE_ID",
      message: "Falta el identificador de licencia."
    }, 400);
  }

  if (!allowedStatuses.includes(status)) {
    return corsResponse({
      ok: false,
      code: "INVALID_STATUS",
      message: "Estado de licencia no permitido."
    }, 400);
  }

  const company = await env.DB.prepare(`
    SELECT
      id,
      name,
      status
    FROM companies
    WHERE id = ?
    LIMIT 1
  `)
    .bind(companyId)
    .first();

  if (!company) {
    return corsResponse({
      ok: false,
      code: "COMPANY_NOT_FOUND",
      message: "No se encontró la empresa seleccionada."
    }, 404);
  }

  const product = await env.DB.prepare(`
    SELECT
      id,
      slug,
      name,
      status
    FROM software_products
    WHERE id = ?
    LIMIT 1
  `)
    .bind(productId)
    .first();

  if (!product) {
    return corsResponse({
      ok: false,
      code: "PRODUCT_NOT_FOUND",
      message: "No se encontró el software seleccionado."
    }, 404);
  }

  const existingLicense = await env.DB.prepare(`
    SELECT
      id,
      license_id
    FROM licenses
    WHERE upper(license_id) = upper(?)
    LIMIT 1
  `)
    .bind(licenseId)
    .first();

  if (existingLicense) {
    return corsResponse({
      ok: false,
      code: "LICENSE_ID_EXISTS",
      message: "Ya existe una licencia con ese identificador."
    }, 409);
  }

  const now = new Date().toISOString();
  const licenseDbId = crypto.randomUUID();
  const normalizedStartsAt = startsAt || now;
  const normalizedExpiresAt = expiresAt || null;

  await env.DB.prepare(`
    INSERT INTO licenses (
      id,
      company_id,
      product_id,
      license_id,
      license_name,
      machine_id,
      status,
      activated_at,
      starts_at,
      expires_at,
      max_users,
      max_devices,
      notes,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
    .bind(
      licenseDbId,
      companyId,
      productId,
      licenseId,
      licenseName || `Licencia ${product.name} — ${company.name}`,
      null,
      status,
      null,
      normalizedStartsAt,
      normalizedExpiresAt,
      maxUsers,
      maxDevices,
      notes || null,
      now,
      now
    )
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
      "admin_license_created",
      "licenses",
      licenseDbId,
      JSON.stringify({
        companyId,
        companyName: company.name,
        productId,
        productName: product.name,
        licenseId,
        licenseName,
        status,
        startsAt: normalizedStartsAt,
        expiresAt: normalizedExpiresAt,
        maxUsers,
        maxDevices,
        notes
      }),
      now
    )
    .run();

  return corsResponse({
    ok: true,
    id: licenseDbId,
    message: "Licencia creada correctamente.",
    license: {
      id: licenseDbId,
      companyId,
      companyName: company.name,
      productId,
      productName: product.name,
      licenseId,
      licenseName: licenseName || `Licencia ${product.name} — ${company.name}`,
      status,
      startsAt: normalizedStartsAt,
      expiresAt: normalizedExpiresAt,
      maxUsers,
      maxDevices,
      notes,
      createdAt: now,
      updatedAt: now
    }
  }, 201);
}

async function handleAdminUpdateLicenseStatus(request, env) {
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
    "active",
    "suspended",
    "expired",
    "revoked"
  ];

  if (!id) {
    return corsResponse({
      ok: false,
      code: "MISSING_LICENSE_DB_ID",
      message: "Falta el ID interno de la licencia."
    }, 400);
  }

  if (!allowedStatuses.includes(status)) {
    return corsResponse({
      ok: false,
      code: "INVALID_STATUS",
      message: "Estado de licencia no permitido."
    }, 400);
  }

  const existing = await env.DB.prepare(`
    SELECT
      l.id,
      l.license_id,
      l.license_name,
      l.status,
      l.company_id,
      l.product_id,
      c.name AS company_name,
      sp.name AS product_name
    FROM licenses l
    LEFT JOIN companies c ON c.id = l.company_id
    LEFT JOIN software_products sp ON sp.id = l.product_id
    WHERE l.id = ?
    LIMIT 1
  `)
    .bind(id)
    .first();

  if (!existing) {
    return corsResponse({
      ok: false,
      code: "LICENSE_NOT_FOUND",
      message: "No se encontró la licencia."
    }, 404);
  }

  const previousStatus = existing.status || "active";
  const now = new Date().toISOString();

  await env.DB.prepare(`
    UPDATE licenses
    SET
      status = ?,
      updated_at = ?
    WHERE id = ?
  `)
    .bind(status, now, id)
    .run();

  if (status === "suspended" || status === "revoked" || status === "expired") {
    await env.DB.prepare(`
  UPDATE license_activations
  SET
    status = ?
  WHERE license_id = ?
    AND status = 'active'
`)
  .bind(status, existing.id)
  .run();
  }

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
      "admin_license_status_updated",
      "licenses",
      id,
      JSON.stringify({
        licenseDbId: id,
        licenseId: existing.license_id,
        licenseName: existing.license_name || "",
        companyId: existing.company_id || "",
        companyName: existing.company_name || "",
        productId: existing.product_id || "",
        productName: existing.product_name || "",
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
    licenseId: existing.license_id,
    previousStatus,
    status,
    message: "Estado de licencia actualizado correctamente.",
    updatedAt: now
  });
}

function generateLicenseCode() {
  const randomBytes = crypto.getRandomValues(new Uint8Array(9));
  const code = bytesToBase64Url(randomBytes)
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 12);

  return `SPZ-${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}`;
}

function parsePositiveInteger(value, fallback) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  const integer = Math.trunc(number);

  if (integer < 1) {
    return fallback;
  }

  return integer;
}



  async function handleAdminListLicenseActivations(request, env) {
  const auth = validateAdminRequest(request, env);

  if (!auth.ok) {
    return corsResponse({
      ok: false,
      code: "UNAUTHORIZED",
      message: "Acceso administrativo no autorizado."
    }, 401);
  }

  const url = new URL(request.url);

  const licenseDbId = cleanText(url.searchParams.get("licenseDbId") || "", 80);
  const status = cleanText(url.searchParams.get("status") || "", 40);
  const search = cleanText(url.searchParams.get("search") || "", 120);

  const rawLimit = Number(url.searchParams.get("limit") || 50);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(Math.trunc(rawLimit), 1), 100)
    : 50;

  const whereParts = [];
  const params = [];

  if (licenseDbId) {
    whereParts.push("la.license_id = ?");
    params.push(licenseDbId);
  }

  if (status && status !== "all") {
    whereParts.push("la.status = ?");
    params.push(status);
  }

  if (search) {
    const likeSearch = `%${search}%`;

    whereParts.push(`(
      l.license_id LIKE ?
      OR l.license_name LIKE ?
      OR la.machine_id LIKE ?
      OR la.device_label LIKE ?
      OR la.app_version LIKE ?
      OR c.name LIKE ?
      OR sp.name LIKE ?
      OR sp.slug LIKE ?
    )`);

    params.push(
      likeSearch,
      likeSearch,
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
      la.id,
      la.license_id AS license_db_id,
      l.license_id AS license_code,
      l.license_name,
      l.status AS license_status,
      l.expires_at AS license_expires_at,
      la.product_id,
      sp.slug AS product_slug,
      sp.name AS product_name,
      la.company_id,
      c.name AS company_name,
      c.status AS company_status,
      la.machine_id,
      la.device_label,
      la.app_version,
      la.status,
      la.activated_at,
      la.last_check_at
    FROM license_activations la
    LEFT JOIN licenses l ON l.id = la.license_id
    LEFT JOIN software_products sp ON sp.id = la.product_id
    LEFT JOIN companies c ON c.id = la.company_id
    ${whereSql}
    ORDER BY COALESCE(la.last_check_at, la.activated_at) DESC
    LIMIT ${limit}
  `;

  const countSql = `
    SELECT COUNT(*) AS total
    FROM license_activations la
    LEFT JOIN licenses l ON l.id = la.license_id
    LEFT JOIN software_products sp ON sp.id = la.product_id
    LEFT JOIN companies c ON c.id = la.company_id
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
      COALESCE(status, 'active') AS status,
      COUNT(*) AS total
    FROM license_activations
    GROUP BY COALESCE(status, 'active')
  `).all();

  const totalAllResult = await env.DB.prepare(`
    SELECT COUNT(*) AS total
    FROM license_activations
  `).first();

  const summary = {
    total: Number(totalAllResult?.total || 0),
    active: 0,
    suspended: 0,
    expired: 0,
    revoked: 0
  };

  for (const row of summaryResult.results || []) {
    const key = row.status || "active";
    summary[key] = Number(row.total || 0);
  }

  return corsResponse({
    ok: true,
    count: (listResult.results || []).length,
    total: Number(countResult?.total || 0),
    limit,
    filters: {
      licenseDbId,
      status: status || "all",
      search
    },
    summary,
    activations: listResult.results || []
  });
}




  async function handleAdminUpdateLicenseActivationStatus(request, env) {
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

  const activationId = cleanText(body.activationId || body.id, 80);
  const status = cleanText(body.status, 40);
  const note = cleanText(body.note || "", 800);

  const allowedStatuses = [
    "active",
    "suspended",
    "revoked"
  ];

  if (!activationId) {
    return corsResponse({
      ok: false,
      code: "MISSING_ACTIVATION_ID",
      message: "Falta el ID de la activación."
    }, 400);
  }

  if (!allowedStatuses.includes(status)) {
    return corsResponse({
      ok: false,
      code: "INVALID_STATUS",
      message: "Estado de activación no permitido."
    }, 400);
  }

  const existing = await env.DB.prepare(`
    SELECT
      la.id,
      la.license_id AS license_db_id,
      l.license_id AS license_code,
      l.license_name,
      la.product_id,
      sp.name AS product_name,
      la.company_id,
      c.name AS company_name,
      la.machine_id,
      la.device_label,
      la.app_version,
      la.status,
      la.activated_at,
      la.last_check_at
    FROM license_activations la
    LEFT JOIN licenses l ON l.id = la.license_id
    LEFT JOIN software_products sp ON sp.id = la.product_id
    LEFT JOIN companies c ON c.id = la.company_id
    WHERE la.id = ?
    LIMIT 1
  `)
    .bind(activationId)
    .first();

  if (!existing) {
    return corsResponse({
      ok: false,
      code: "ACTIVATION_NOT_FOUND",
      message: "No se encontró la activación."
    }, 404);
  }

  const previousStatus = existing.status || "active";
  const now = new Date().toISOString();

  await env.DB.prepare(`
    UPDATE license_activations
    SET
      status = ?,
      last_check_at = ?
    WHERE id = ?
  `)
    .bind(status, now, activationId)
    .run();

  await recordLicenseCheck(env, {
    licenseId: existing.license_code || existing.license_db_id,
    companyId: existing.company_id || null,
    productId: existing.product_id || null,
    machineId: existing.machine_id || "",
    checkType: "admin_activation_status_update",
    result: status,
    ipAddress: request.headers.get("cf-connecting-ip") || "",
    userAgent: cleanText(request.headers.get("user-agent") || "", 500)
  });

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
      "admin_license_activation_status_updated",
      "license_activations",
      activationId,
      JSON.stringify({
        activationId,
        licenseDbId: existing.license_db_id || "",
        licenseCode: existing.license_code || "",
        licenseName: existing.license_name || "",
        productId: existing.product_id || "",
        productName: existing.product_name || "",
        companyId: existing.company_id || "",
        companyName: existing.company_name || "",
        machineId: existing.machine_id || "",
        deviceLabel: existing.device_label || "",
        appVersion: existing.app_version || "",
        previousStatus,
        newStatus: status,
        note
      }),
      now
    )
    .run();

  return corsResponse({
    ok: true,
    id: activationId,
    previousStatus,
    status,
    message: "Estado de activación actualizado correctamente.",
    updatedAt: now,
    activation: {
      id: activationId,
      licenseCode: existing.license_code || "",
      machineId: existing.machine_id || "",
      deviceLabel: existing.device_label || "",
      previousStatus,
      status
    }
  });
}



  
  async function handleLicenseCheck(request, env) {
  let body;

  try {
    body = await request.json();
  } catch {
    return corsResponse({
      ok: false,
      valid: false,
      code: "INVALID_JSON",
      message: "La solicitud no tiene un JSON válido."
    }, 400);
  }

  const requestedLicenseId = cleanText(
    body.licenseId || body.license_id || body.key || "",
    120
  ).toUpperCase();

  const productSlug = cleanText(
    body.productSlug || body.product_slug || "smartpozo360",
    80
  ).toLowerCase();

  const productId = cleanText(
    body.productId || body.product_id || "",
    80
  );

  const machineId = cleanText(
    body.machineId || body.machine_id || "",
    180
  );

  const appVersion = cleanText(
    body.appVersion || body.app_version || "",
    80
  );

  const checkType = cleanText(
    body.checkType || "license_check",
    80
  );

  const now = new Date();
  const nowIso = now.toISOString();
  const ipAddress = request.headers.get("cf-connecting-ip") || "";
  const userAgent = cleanText(request.headers.get("user-agent") || "", 500);

  if (!requestedLicenseId) {
    return corsResponse({
      ok: false,
      valid: false,
      code: "MISSING_LICENSE_ID",
      message: "Falta el identificador de licencia."
    }, 400);
  }

  const license = await env.DB.prepare(`
    SELECT
      l.id AS license_db_id,
      l.company_id,
      c.name AS company_name,
      c.status AS company_status,
      l.product_id,
      sp.slug AS product_slug,
      sp.name AS product_name,
      sp.status AS product_status,
      l.license_id,
      l.license_name,
      l.machine_id,
      l.status,
      l.starts_at,
      l.activated_at,
      l.expires_at,
      l.max_users,
      l.max_devices,
      l.created_at,
      l.updated_at
    FROM licenses l
    INNER JOIN software_products sp ON sp.id = l.product_id
    LEFT JOIN companies c ON c.id = l.company_id
    WHERE upper(l.license_id) = upper(?)
      AND (
        sp.slug = ?
        OR sp.id = ?
        OR ? = ''
      )
    LIMIT 1
  `)
    .bind(
      requestedLicenseId,
      productSlug,
      productId,
      productId
    )
    .first();

  if (!license) {
    await recordLicenseCheck(env, {
      licenseId: requestedLicenseId,
      companyId: null,
      productId: productId || null,
      machineId,
      checkType,
      result: "not_found",
      ipAddress,
      userAgent
    });

    return corsResponse({
      ok: true,
      valid: false,
      code: "LICENSE_NOT_FOUND",
      message: "Licencia no encontrada para el producto indicado.",
      checkedAt: nowIso
    });
  }

  let result = "valid";
  let valid = true;
  let code = "LICENSE_VALID";
  let message = "Licencia válida.";
  let requiresActivation = false;
  let canActivate = false;
  let activeActivations = 0;
  let activation = null;

  if ((license.product_status || "") !== "published") {
    valid = false;
    result = "product_not_published";
    code = "PRODUCT_NOT_AVAILABLE";
    message = "El software asociado no está publicado.";
  }

  if (valid && license.company_status && license.company_status !== "active") {
    valid = false;
    result = "company_not_active";
    code = "COMPANY_NOT_ACTIVE";
    message = "La empresa asociada no está activa.";
  }

  if (valid && (license.status || "active") !== "active") {
    valid = false;
    result = license.status || "inactive";
    code = `LICENSE_${String(license.status || "inactive").toUpperCase()}`;
    message = `La licencia está en estado ${license.status}.`;
  }

  const startsAt = license.starts_at
    ? new Date(license.starts_at)
    : null;

  if (
    valid &&
    startsAt &&
    !Number.isNaN(startsAt.getTime()) &&
    startsAt > now
  ) {
    valid = false;
    result = "not_started";
    code = "LICENSE_NOT_STARTED";
    message = "La licencia aún no inicia vigencia.";
  }

  const expiresAt = license.expires_at
    ? new Date(license.expires_at)
    : null;

  if (
    valid &&
    expiresAt &&
    !Number.isNaN(expiresAt.getTime()) &&
    expiresAt <= now
  ) {
    valid = false;
    result = "expired";
    code = "LICENSE_EXPIRED";
    message = "La licencia está vencida.";

    await env.DB.prepare(`
      UPDATE licenses
      SET
        status = 'expired',
        updated_at = ?
      WHERE id = ?
        AND status = 'active'
    `)
      .bind(nowIso, license.license_db_id)
      .run();
  }

  
    if (machineId) {
    activation = await env.DB.prepare(`
      SELECT
        id,
        license_id,
        product_id,
        company_id,
        machine_id,
        device_label,
        app_version,
        status,
        activated_at,
        last_check_at
      FROM license_activations
      WHERE license_id = ?
        AND machine_id = ?
      ORDER BY activated_at DESC
      LIMIT 1
    `)
      .bind(license.license_db_id, machineId)
      .first();

    const activationsCount = await env.DB.prepare(`
      SELECT COUNT(*) AS total
      FROM license_activations
      WHERE license_id = ?
        AND status = 'active'
    `)
      .bind(license.license_db_id)
      .first();

    activeActivations = Number(activationsCount?.total || 0);

    if (valid && activation && activation.status === "active") {
      await env.DB.prepare(`
        UPDATE license_activations
        SET
          last_check_at = ?,
          app_version = COALESCE(?, app_version)
        WHERE id = ?
      `)
        .bind(nowIso, appVersion || null, activation.id)
        .run();

      result = "valid";
      code = "LICENSE_VALID_ACTIVATED_DEVICE";
      message = "Licencia válida para este equipo.";
    } else if (valid && activation && activation.status !== "active") {
      const activationStatus = activation.status || "inactive";

      valid = false;
      requiresActivation = false;
      canActivate = false;
      result = `device_${activationStatus}`;

      const deviceStatusCodes = {
        suspended: "DEVICE_SUSPENDED",
        revoked: "DEVICE_REVOKED",
        expired: "DEVICE_EXPIRED"
      };

      code = deviceStatusCodes[activationStatus] || "DEVICE_NOT_ACTIVE";
      message = `Este equipo está en estado ${activationStatus}.`;
    } else if (valid && !activation) {
      requiresActivation = true;

      if (activeActivations >= Number(license.max_devices || 1)) {
        valid = false;
        canActivate = false;
        result = "device_limit_reached";
        code = "DEVICE_LIMIT_REACHED";
        message = "La licencia alcanzó el límite de dispositivos activos.";
      } else {
        valid = true;
        canActivate = true;
        result = "requires_activation";
        code = "LICENSE_REQUIRES_ACTIVATION";
        message = "La licencia es válida, pero este equipo requiere activación.";
      }
    }
  }



  await recordLicenseCheck(env, {
    licenseId: license.license_id,
    companyId: license.company_id || null,
    productId: license.product_id || null,
    machineId,
    checkType,
    result,
    ipAddress,
    userAgent
  });

  return corsResponse({
    ok: true,
    valid,
    code,
    message,
    checkedAt: nowIso,
    license: {
      id: license.license_db_id,
      licenseId: license.license_id,
      licenseName: license.license_name || "",
      status: valid ? license.status : result,
      startsAt: license.starts_at || "",
      expiresAt: license.expires_at || "",
      maxUsers: Number(license.max_users || 1),
      maxDevices: Number(license.max_devices || 1)
    },
    product: {
      id: license.product_id,
      slug: license.product_slug,
      name: license.product_name,
      status: license.product_status
    },
    company: {
      id: license.company_id || "",
      name: license.company_name || "",
      status: license.company_status || ""
    },
    device: {
      machineId,
      activated: Boolean(activation && activation.status === "active"),
      activationStatus: activation?.status || "",
      activeActivations,
      requiresActivation,
      canActivate
    }
  });
}

async function recordLicenseCheck(env, data) {
  try {
    await env.DB.prepare(`
      INSERT INTO license_checks (
        id,
        license_id,
        company_id,
        product_id,
        machine_id,
        check_type,
        result,
        ip_address,
        user_agent,
        checked_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
      .bind(
        crypto.randomUUID(),
        data.licenseId,
        data.companyId,
        data.productId,
        data.machineId || null,
        data.checkType || "license_check",
        data.result || "unknown",
        data.ipAddress || "",
        data.userAgent || "",
        new Date().toISOString()
      )
      .run();
  } catch {
    /*
      No se detiene la validación si falla el registro de auditoría.
    */
  }
}



  async function handleActivationRegister(request, env) {
  let body;

  try {
    body = await request.json();
  } catch {
    return corsResponse({
      ok: false,
      activated: false,
      code: "INVALID_JSON",
      message: "La solicitud no tiene un JSON válido."
    }, 400);
  }

  const requestedLicenseId = cleanText(
    body.licenseId || body.license_id || body.key || "",
    120
  ).toUpperCase();

  const productSlug = cleanText(
    body.productSlug || body.product_slug || "smartpozo360",
    80
  ).toLowerCase();

  const productId = cleanText(
    body.productId || body.product_id || "",
    80
  );

  const machineId = cleanText(
    body.machineId || body.machine_id || "",
    180
  );

  const deviceLabel = cleanText(
    body.deviceLabel || body.device_label || "",
    180
  );

  const appVersion = cleanText(
    body.appVersion || body.app_version || "",
    80
  );

  const now = new Date();
  const nowIso = now.toISOString();
  const ipAddress = request.headers.get("cf-connecting-ip") || "";
  const userAgent = cleanText(request.headers.get("user-agent") || "", 500);

  if (!requestedLicenseId) {
    return corsResponse({
      ok: false,
      activated: false,
      code: "MISSING_LICENSE_ID",
      message: "Falta el identificador de licencia."
    }, 400);
  }

  if (!machineId) {
    return corsResponse({
      ok: false,
      activated: false,
      code: "MISSING_MACHINE_ID",
      message: "Falta el identificador del equipo."
    }, 400);
  }

  const license = await env.DB.prepare(`
    SELECT
      l.id AS license_db_id,
      l.company_id,
      c.name AS company_name,
      c.status AS company_status,
      l.product_id,
      sp.slug AS product_slug,
      sp.name AS product_name,
      sp.status AS product_status,
      l.license_id,
      l.license_name,
      l.machine_id,
      l.status,
      l.starts_at,
      l.activated_at,
      l.expires_at,
      l.max_users,
      l.max_devices,
      l.created_at,
      l.updated_at
    FROM licenses l
    INNER JOIN software_products sp ON sp.id = l.product_id
    LEFT JOIN companies c ON c.id = l.company_id
    WHERE upper(l.license_id) = upper(?)
      AND (
        sp.slug = ?
        OR sp.id = ?
        OR ? = ''
      )
    LIMIT 1
  `)
    .bind(
      requestedLicenseId,
      productSlug,
      productId,
      productId
    )
    .first();

  if (!license) {
    await recordLicenseCheck(env, {
      licenseId: requestedLicenseId,
      companyId: null,
      productId: productId || null,
      machineId,
      checkType: "activation_register",
      result: "license_not_found",
      ipAddress,
      userAgent
    });

    return corsResponse({
      ok: true,
      activated: false,
      code: "LICENSE_NOT_FOUND",
      message: "Licencia no encontrada para el producto indicado.",
      checkedAt: nowIso
    }, 404);
  }

  if ((license.product_status || "") !== "published") {
    await recordLicenseCheck(env, {
      licenseId: license.license_id,
      companyId: license.company_id || null,
      productId: license.product_id || null,
      machineId,
      checkType: "activation_register",
      result: "product_not_published",
      ipAddress,
      userAgent
    });

    return corsResponse({
      ok: true,
      activated: false,
      code: "PRODUCT_NOT_AVAILABLE",
      message: "El software asociado no está publicado.",
      checkedAt: nowIso
    }, 403);
  }

  if (license.company_status && license.company_status !== "active") {
    await recordLicenseCheck(env, {
      licenseId: license.license_id,
      companyId: license.company_id || null,
      productId: license.product_id || null,
      machineId,
      checkType: "activation_register",
      result: "company_not_active",
      ipAddress,
      userAgent
    });

    return corsResponse({
      ok: true,
      activated: false,
      code: "COMPANY_NOT_ACTIVE",
      message: "La empresa asociada no está activa.",
      checkedAt: nowIso
    }, 403);
  }

  if ((license.status || "active") !== "active") {
    await recordLicenseCheck(env, {
      licenseId: license.license_id,
      companyId: license.company_id || null,
      productId: license.product_id || null,
      machineId,
      checkType: "activation_register",
      result: license.status || "inactive",
      ipAddress,
      userAgent
    });

    return corsResponse({
      ok: true,
      activated: false,
      code: `LICENSE_${String(license.status || "inactive").toUpperCase()}`,
      message: `La licencia está en estado ${license.status}.`,
      checkedAt: nowIso
    }, 403);
  }

  const startsAt = license.starts_at
    ? new Date(license.starts_at)
    : null;

  if (
    startsAt &&
    !Number.isNaN(startsAt.getTime()) &&
    startsAt > now
  ) {
    await recordLicenseCheck(env, {
      licenseId: license.license_id,
      companyId: license.company_id || null,
      productId: license.product_id || null,
      machineId,
      checkType: "activation_register",
      result: "not_started",
      ipAddress,
      userAgent
    });

    return corsResponse({
      ok: true,
      activated: false,
      code: "LICENSE_NOT_STARTED",
      message: "La licencia aún no inicia vigencia.",
      checkedAt: nowIso
    }, 403);
  }

  const expiresAt = license.expires_at
    ? new Date(license.expires_at)
    : null;

  if (
    expiresAt &&
    !Number.isNaN(expiresAt.getTime()) &&
    expiresAt <= now
  ) {
    await env.DB.prepare(`
      UPDATE licenses
      SET
        status = 'expired',
        updated_at = ?
      WHERE id = ?
        AND status = 'active'
    `)
      .bind(nowIso, license.license_db_id)
      .run();

    await recordLicenseCheck(env, {
      licenseId: license.license_id,
      companyId: license.company_id || null,
      productId: license.product_id || null,
      machineId,
      checkType: "activation_register",
      result: "expired",
      ipAddress,
      userAgent
    });

    return corsResponse({
      ok: true,
      activated: false,
      code: "LICENSE_EXPIRED",
      message: "La licencia está vencida.",
      checkedAt: nowIso
    }, 403);
  }

  const existingActivation = await env.DB.prepare(`
    SELECT
      id,
      license_id,
      product_id,
      company_id,
      machine_id,
      device_label,
      app_version,
      status,
      activated_at,
      last_check_at
    FROM license_activations
    WHERE license_id = ?
      AND machine_id = ?
    ORDER BY activated_at DESC
    LIMIT 1
  `)
    .bind(license.license_db_id, machineId)
    .first();

  if (existingActivation && existingActivation.status === "active") {
    await env.DB.prepare(`
      UPDATE license_activations
      SET
        last_check_at = ?,
        app_version = COALESCE(?, app_version),
        device_label = COALESCE(?, device_label)
      WHERE id = ?
    `)
      .bind(
        nowIso,
        appVersion || null,
        deviceLabel || null,
        existingActivation.id
      )
      .run();

    await recordLicenseCheck(env, {
      licenseId: license.license_id,
      companyId: license.company_id || null,
      productId: license.product_id || null,
      machineId,
      checkType: "activation_register",
      result: "already_activated",
      ipAddress,
      userAgent
    });

    return corsResponse({
      ok: true,
      activated: true,
      code: "DEVICE_ALREADY_ACTIVATED",
      message: "Este equipo ya estaba activado para la licencia.",
      checkedAt: nowIso,
      activation: {
        id: existingActivation.id,
        machineId,
        status: "active",
        activatedAt: existingActivation.activated_at,
        lastCheckAt: nowIso
      },
      license: {
        licenseId: license.license_id,
        licenseName: license.license_name || "",
        status: license.status,
        expiresAt: license.expires_at || "",
        maxDevices: Number(license.max_devices || 1)
      }
    });
  }


      if (existingActivation && existingActivation.status !== "active") {
    const activationStatus = existingActivation.status || "inactive";

    const deviceStatusCodes = {
      suspended: "DEVICE_SUSPENDED",
      revoked: "DEVICE_REVOKED",
      expired: "DEVICE_EXPIRED"
    };

    const responseCode = deviceStatusCodes[activationStatus] || "DEVICE_NOT_ACTIVE";

    await recordLicenseCheck(env, {
      licenseId: license.license_id,
      companyId: license.company_id || null,
      productId: license.product_id || null,
      machineId,
      checkType: "activation_register",
      result: `device_${activationStatus}`,
      ipAddress,
      userAgent
    });

    return corsResponse({
      ok: true,
      activated: false,
      code: responseCode,
      message: `Este equipo está en estado ${activationStatus}.`,
      checkedAt: nowIso,
      activation: {
        id: existingActivation.id,
        machineId,
        status: activationStatus,
        activatedAt: existingActivation.activated_at,
        lastCheckAt: existingActivation.last_check_at
      },
      license: {
        licenseId: license.license_id,
        licenseName: license.license_name || "",
        status: license.status,
        expiresAt: license.expires_at || "",
        maxDevices: Number(license.max_devices || 1)
      }
    }, 403);
  }

  

  const activationsCount = await env.DB.prepare(`
    SELECT COUNT(*) AS total
    FROM license_activations
    WHERE license_id = ?
      AND status = 'active'
  `)
    .bind(license.license_db_id)
    .first();

  const activeActivations = Number(activationsCount?.total || 0);
  const maxDevices = Number(license.max_devices || 1);

  if (activeActivations >= maxDevices) {
    await recordLicenseCheck(env, {
      licenseId: license.license_id,
      companyId: license.company_id || null,
      productId: license.product_id || null,
      machineId,
      checkType: "activation_register",
      result: "device_limit_reached",
      ipAddress,
      userAgent
    });

    return corsResponse({
      ok: true,
      activated: false,
      code: "DEVICE_LIMIT_REACHED",
      message: "La licencia alcanzó el límite de dispositivos activos.",
      checkedAt: nowIso,
      device: {
        machineId,
        activeActivations,
        maxDevices
      }
    }, 409);
  }

  const activationId = crypto.randomUUID();

  await env.DB.prepare(`
    INSERT INTO license_activations (
      id,
      license_id,
      product_id,
      company_id,
      machine_id,
      device_label,
      app_version,
      status,
      activated_at,
      last_check_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
    .bind(
  activationId,
  license.license_db_id,
  license.product_id,
  license.company_id,
  machineId,
      deviceLabel || null,
      appVersion || null,
      "active",
      nowIso,
      nowIso
    )
    .run();

  await env.DB.prepare(`
    UPDATE licenses
    SET
      activated_at = COALESCE(activated_at, ?),
      machine_id = COALESCE(machine_id, ?),
      updated_at = ?
    WHERE id = ?
  `)
    .bind(
      nowIso,
      machineId,
      nowIso,
      license.license_db_id
    )
    .run();

  await recordLicenseCheck(env, {
    licenseId: license.license_id,
    companyId: license.company_id || null,
    productId: license.product_id || null,
    machineId,
    checkType: "activation_register",
    result: "activation_success",
    ipAddress,
    userAgent
  });

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
  "license_device_activated",
      "license_activations",
      activationId,
      JSON.stringify({
        licenseId: license.license_id,
        licenseDbId: license.license_db_id,
        companyId: license.company_id || "",
        companyName: license.company_name || "",
        productId: license.product_id || "",
        productName: license.product_name || "",
        machineId,
        deviceLabel,
        appVersion,
        activeActivations: activeActivations + 1,
        maxDevices
      }),
      nowIso
    )
    .run();

  return corsResponse({
    ok: true,
    activated: true,
    code: "DEVICE_ACTIVATED",
    message: "Equipo activado correctamente.",
    checkedAt: nowIso,
    activation: {
      id: activationId,
      machineId,
      deviceLabel,
      appVersion,
      status: "active",
      activatedAt: nowIso,
      lastCheckAt: nowIso
    },
    license: {
      id: license.license_db_id,
      licenseId: license.license_id,
      licenseName: license.license_name || "",
      status: license.status,
      startsAt: license.starts_at || "",
      expiresAt: license.expires_at || "",
      maxDevices
    },
    product: {
      id: license.product_id,
      slug: license.product_slug,
      name: license.product_name
    },
    company: {
      id: license.company_id || "",
      name: license.company_name || ""
    }
  }, 201);
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