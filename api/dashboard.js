import { promises as fs } from "fs";
import path from "path";

const CLIENTS_PATH = path.join(process.cwd(), "data", "clients.json");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { password } = req.body;

  if (password !== "revu123") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const raw = await fs.readFile(CLIENTS_PATH, "utf8");
    const clients = JSON.parse(raw);
    return res.status(200).json(clients);
  } catch (error) {
    return res.status(500).json({ error: "Failed to load data" });
  }
}
