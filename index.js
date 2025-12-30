import express from "express";

const app = express();
app.use(express.json());

const port = process.env.PORT || 3000;

// Root page with form
app.get("/", (req, res) => {
  res.send(`
    <html>
    <head>
    <style>
body {
    margin: 0;
    padding: 0;
    min-height: 100vh;
    background: linear-gradient(135deg, #0b3c8a, #051937);
    font-family: "Segoe UI", Arial, sans-serif;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .container {
    width: 500px;
    text-align: center;
  }

  h1, p, h3 {
    color: #ffffff;
    font-family: "Segoe UI", Arial, sans-serif;
  }

  .form-box,
  #pasteForm {
    background: #ffffff;
    padding: 25px;
    border-radius: 14px;
    border: 2px solid #1e90ff;
    box-shadow:
      0 0 10px rgba(30, 144, 255, 0.6),
      0 0 20px rgba(30, 144, 255, 0.4);
  }

  textarea,
  input {
    width: 100%;
    padding: 12px;
    margin-top: 12px;
    border-radius: 8px;
    border: 1px solid #ccc;
    font-family: inherit;
    font-size: 14px;
  }

  textarea::placeholder,
  input::placeholder {
    color: #7aa7ff;
  }

  textarea:focus,
  input:focus {
    outline: none;
    border-color: #1e90ff;
    box-shadow: 0 0 6px rgba(30, 144, 255, 0.6);
  }

  button {
    margin-top: 18px;
    padding: 12px;
    width: 100%;
    border: none;
    border-radius: 8px;
    background: #0b3c8a;
    color: #ffffff;
    font-size: 15px;
    cursor: pointer;
    box-shadow: 0 0 10px rgba(30,144,255,0.5);
  }

  button:hover {
    background: #1e90ff;
  }

  #result a {
    color: #ffffff;
    text-decoration: underline;
  }
        </style>
    <head/>
      <body>
      <div class="container">
        <h1>Welcome to Pastebin-Lite</h1>
        <p>Create and share your text pastes easily.</p>

        <form id="pasteForm">
          <textarea name="content" placeholder="Enter your text" required rows="5" cols="40"></textarea><br/><br/>
          <input type="number" name="ttl_minutes" placeholder="Expire in Minutes (Optional)"><br/><br/>
          <input type="number" name="max_views" placeholder="Max Views (optional)"><br/><br/>
          <button type="submit">Create Paste</button>
        </form>

        <h3 style="margin-top:20px;">Generated Url Will Appear Here</h3>
        <div id="result" style="margin-top:20px;"></div>

        <div/>

        <script>
          const form = document.getElementById("pasteForm");
          const result = document.getElementById("result");

          form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const content = formData.get("content");
            const ttl_minutes = formData.get("ttl_minutes");
            const max_views = formData.get("max_views");

            const payload = {
              content,
              ttl_seconds: ttl_minutes ? parseInt(ttl_minutes) * 60 : undefined,
              max_views: max_views ? parseInt(max_views) : undefined
            };

            try {
              const resApi = await fetch("/api/pastes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
              });
              const data = await resApi.json();

              if(resApi.ok) {
                result.innerHTML = \`
                  Paste URL: <a href="\${data.url}" target="_blank">\${data.url}</a>
                  <button id="copyBtn">Copy URL</button>
                \`;

                document.getElementById("copyBtn").addEventListener("click", () => {
                  navigator.clipboard.writeText(data.url);
                  alert("URL copied to clipboard!");
                });

              } else {
                result.innerText = data.error || "Error creating paste";
              }

            } catch(err) {
              result.innerText = "Server error";
            }
          });
        </script>
      </body>
    </html>
  `);
});

// Health check
app.get("/api/healthz", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false });
  }
});

// POST /api/pastes
app.post("/api/pastes", async (req, res) => {
  const { content, ttl_seconds, max_views } = req.body;

  if (!content || typeof content !== "string" || content.trim() === "") {
    return res.status(400).json({ error: "Invalid content" });
  }

  if (
    ttl_seconds !== undefined &&
    (!Number.isInteger(ttl_seconds) || ttl_seconds < 1)
  ) {
    return res.status(400).json({ error: "Invalid ttl_seconds" });
  }

  if (
    max_views !== undefined &&
    (!Number.isInteger(max_views) || max_views < 1)
  ) {
    return res.status(400).json({ error: "Invalid max_views" });
  }

  const id = nanoid(8);
  const expires_at = ttl_seconds
    ? new Date(Date.now() + ttl_seconds * 1000) // <-- convert seconds to ms
    : null;

  try {
    await pool.query(
      `INSERT INTO pastes (id, content, expires_at, max_views)
       VALUES ($1, $2, $3, $4)`,
      [id, content, expires_at, max_views ?? null]
    );

    res.status(201).json({
      id,
      url: `${process.env.BASE_URL}/p/${id}`,
      expires_at, // optional
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/pastes/:id", async (req, res) => {
  const { id } = req.params;
  const testNow = req.headers["x-test-now-ms"];
  const now = testNow ? new Date(parseInt(testNow)) : new Date();

  try {
    const result = await pool.query(`SELECT * FROM pastes WHERE id = $1`, [id]);
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Paste not found" });

    const paste = result.rows[0];

    if (
      (paste.expires_at && now > paste.expires_at) ||
      (paste.max_views !== null && paste.views >= paste.max_views)
    ) {
      return res.status(404).json({ error: "Paste Expired" });
    }

    await pool.query(`UPDATE pastes SET views = views + 1 WHERE id = $1`, [id]);

    res.json({
      content: paste.content,
      remaining_views:
        paste.max_views !== null ? paste.max_views - paste.views - 1 : null,
      expires_at: paste.expires_at,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /p/:id
app.get("/p/:id", async (req, res) => {
  const { id } = req.params;
  const testNow = req.headers["x-test-now-ms"];
  const now = testNow ? new Date(parseInt(testNow)) : new Date();

  try {
    const result = await pool.query(`SELECT * FROM pastes WHERE id = $1`, [id]);
    if (result.rows.length === 0)
      return res.status(404).send("Paste not found");

    const paste = result.rows[0];

    if (
      (paste.expires_at && now > paste.expires_at) ||
      (paste.max_views !== null && paste.views >= paste.max_views)
    ) {
      return res.status(404).send("Paste unavailable");
    }

    await pool.query(`UPDATE pastes SET views = views + 1 WHERE id = $1`, [id]);

    res.send(`
      <html>
        <head>
          <style>
            body {
              margin: 0;
              padding: 0;
              min-height: 100vh;
              background: linear-gradient(135deg, #0b3c8a, #051937);
              font-family: "Segoe UI", Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
            }

            .content-box {
              background: #ffffff;
              width: 70%;
              max-width: 800px;
              padding: 25px;
              border-radius: 14px;
              border: 2px solid #1e90ff;
              box-shadow:
                0 0 10px rgba(30, 144, 255, 0.6),
                0 0 20px rgba(30, 144, 255, 0.4);
            }

            h2 {
              margin-top: 0;
              color: #0b3c8a;
              text-align: center;
            }

            pre {
              white-space: pre-wrap;
              word-wrap: break-word;
              font-size: 15px;
              color: #333;
              line-height: 1.6;
              font-family: Consolas, "Courier New", monospace;
            }
          </style>
        </head>
        <body>
          <div class="content-box">
            <h4>Shared Paste</h4>
            <h1>${paste.content
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")}</h1>
          </div>
        </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send("Server error");
  }
});

app.listen(port,()=>{
   console.log( `Server Started on Port ${port}`);
   console.log( `http://localhost:${port}`);
})
