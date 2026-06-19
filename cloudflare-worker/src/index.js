export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return json({}, 204);
    }

    if (url.pathname === "/") {
      return json({
        ok: true,
        app: "SEAZEP API",
        message: "API base para plataforma SEAZEP."
      });
    }

    if (url.pathname === "/health") {
      return json({
        ok: true,
        status: "healthy",
        timestamp: new Date().toISOString()
      });
    }

    if (url.pathname === "/time") {
      return json({
        ok: true,
        serverUtc: new Date().toISOString(),
        product: "SEAZEP Platform",
        provider: "SEAZEP"
      });
    }

    if (url.pathname === "/license/check" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));

      return json({
        ok: true,
        mode: "prototype",
        received: {
          licenseId: body.licenseId || null,
          machineId: body.machineId || null,
          product: body.product || null
        },
        serverUtc: new Date().toISOString(),
        message: "Endpoint conceptual. Conectar a D1 en fase backend."
      });
    }

    if (url.pathname === "/activation/register" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));

      return json({
        ok: true,
        mode: "prototype",
        activation: {
          licenseId: body.licenseId || null,
          machineId: body.machineId || null,
          company: body.company || null,
          product: body.product || null
        },
        serverUtc: new Date().toISOString()
      });
    }

    return json({
      ok: false,
      code: "NOT_FOUND",
      message: "Ruta no encontrada."
    }, 404);
  }
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type,authorization"
    }
  });
}
