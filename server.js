const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "pedidos.json");

fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]", "utf8");

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

function readOrders() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, "utf8") || "[]"); }
  catch { return []; }
}
function writeOrders(orders) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(orders, null, 2), "utf8");
}

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.post("/api/pedidos", (req, res) => {
  try {
    const body = req.body || {};
    if (!body.nome || !body.whatsapp || !body.cidade || !body.objetivo) {
      return res.status(400).json({ ok: false, error: "Preencha os campos obrigatórios." });
    }
    const orders = readOrders();
    const id = orders.length ? Math.max(...orders.map(o => Number(o.id) || 0)) + 1 : 1;
    const order = {
      id,
      criadoEm: new Date().toISOString(),
      status: "Novo",
      nome: String(body.nome).trim(),
      whatsapp: String(body.whatsapp).trim(),
      email: String(body.email || "").trim(),
      nascimento: String(body.nascimento || "").trim(),
      cidade: String(body.cidade).trim(),
      estadoCivil: String(body.estadoCivil || "").trim(),
      objetivo: String(body.objetivo).trim(),
      perfil: String(body.perfil || "").trim(),
      escolaridade: String(body.escolaridade || "").trim(),
      experiencias: body.experiencias || [],
      cursos: body.cursos || [],
      habilidades: String(body.habilidades || "").trim(),
      outras: String(body.outras || "").trim()
    };
    orders.push(order);
    writeOrders(orders);
    res.status(201).json({ ok: true, id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "Erro ao salvar o pedido." });
  }
});

app.get("/api/pedidos", (req, res) => {
  res.json({ ok: true, pedidos: readOrders().sort((a,b) => b.id - a.id) });
});

app.patch("/api/pedidos/:id", (req, res) => {
  const orders = readOrders();
  const id = Number(req.params.id);
  const order = orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ ok:false, error:"Pedido não encontrado." });
  if (req.body.status) order.status = String(req.body.status);
  writeOrders(orders);
  res.json({ ok:true, pedido:order });
});

app.delete("/api/pedidos/:id", (req, res) => {
  const id = Number(req.params.id);
  const orders = readOrders();
  const filtered = orders.filter(o => o.id !== id);
  if (filtered.length === orders.length) return res.status(404).json({ok:false});
  writeOrders(filtered);
  res.json({ok:true});
});

app.get("/admin", (req,res) => res.sendFile(path.join(__dirname,"admin.html")));
app.use((req,res) => res.sendFile(path.join(__dirname,"index.html")));

app.listen(PORT, () => console.log(`Currículos online: http://localhost:${PORT}`));
