import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // API Proxy Route to Google Apps Script (Bypasses Browser CORS)
  app.post("/api/gas-proxy", async (req, res) => {
    try {
      const { targetUrl, action, data, token } = req.body;

      if (!targetUrl || typeof targetUrl !== "string") {
        return res.status(400).json({
          success: false,
          message: "Parameter targetUrl wajib diisi."
        });
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      const gasResponse = await fetch(targetUrl, {
        method: "POST",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify({
          action,
          data,
          token
        })
      });

      clearTimeout(timeoutId);

      const rawText = await gasResponse.text();

      try {
        const jsonResult = JSON.parse(rawText);
        return res.json(jsonResult);
      } catch (jsonErr) {
        if (rawText.includes("Google Drive") || rawText.includes("ServiceLogin") || rawText.includes("<html")) {
          return res.json({
            success: false,
            message: 'Akses Google Apps Script terkunci. Pada Google Apps Script, klik Deploy -> Manage Deployments -> Edit -> Who has access: Anyone.',
            error: "AUTH_REQUIRED"
          });
        }
        return res.json({
          success: false,
          message: "Format respon dari Google Apps Script bukan JSON yang valid.",
          error: "INVALID_JSON"
        });
      }
    } catch (err: any) {
      const isTimeout = err.name === "AbortError";
      return res.status(500).json({
        success: false,
        message: isTimeout
          ? "Koneksi proxy ke Google Apps Script timeout (25 detik)."
          : "Gagal terhubung ke URL Google Apps Script: " + (err.message || err),
        error: isTimeout ? "TIMEOUT" : "PROXY_ERROR"
      });
    }
  });

  // API Proxy Route to Cloudflare D1 Worker
  app.post("/api/d1-proxy", async (req, res) => {
    try {
      const { workerUrl, action, data, token } = req.body;

      if (!workerUrl || typeof workerUrl !== "string") {
        return res.status(400).json({
          success: false,
          message: "Parameter workerUrl wajib diisi."
        });
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const d1Response = await fetch(workerUrl, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          action,
          data
        })
      });

      clearTimeout(timeoutId);

      const jsonResult = await d1Response.json();
      return res.json(jsonResult);
    } catch (err: any) {
      const isTimeout = err.name === "AbortError";
      return res.status(500).json({
        success: false,
        message: isTimeout
          ? "Koneksi ke Cloudflare D1 Worker timeout (20 detik)."
          : "Gagal menghubungi Cloudflare D1 Worker: " + (err.message || err),
        error: isTimeout ? "TIMEOUT" : "WORKER_ERROR"
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server proxy running on http://localhost:${PORT}`);
  });
}

startServer();
