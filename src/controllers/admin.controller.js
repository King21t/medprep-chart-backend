const prisma = require("../config/db");

function checkSecret(req, res) {
  const secret = req.body.secret || req.query.secret;
  if (!process.env.ADMIN_SECRET) {
    res.status(500).json({ error: "Server is not configured with an ADMIN_SECRET" });
    return false;
  }
  if (secret !== process.env.ADMIN_SECRET) {
    res.status(401).json({ error: "Wrong admin password" });
    return false;
  }
  return true;
}

async function findUserByEmail(req, res) {
  if (!checkSecret(req, res)) return;
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "email is required" });

  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user) return res.status(404).json({ error: "No student found with that email" });

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    school: user.school,
    isPremium: user.isPremium,
    createdAt: user.createdAt,
  });
}

async function upgradeUser(req, res) {
  if (!checkSecret(req, res)) return;
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "email is required" });

  const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!existing) return res.status(404).json({ error: "No student found with that email" });

  const user = await prisma.user.update({
    where: { email: email.trim().toLowerCase() },
    data: { isPremium: true },
  });

  res.json({ message: `${user.name} (${user.email}) is now premium.`, isPremium: user.isPremium });
}

async function downgradeUser(req, res) {
  if (!checkSecret(req, res)) return;
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "email is required" });

  const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!existing) return res.status(404).json({ error: "No student found with that email" });

  const user = await prisma.user.update({
    where: { email: email.trim().toLowerCase() },
    data: { isPremium: false },
  });

  res.json({ message: `${user.name} (${user.email}) is back to free.`, isPremium: user.isPremium });
}

async function promoteToAdmin(req, res) {
  if (!checkSecret(req, res)) return;
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "email is required" });

  const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!existing) return res.status(404).json({ error: "No account found with that email — sign up in the app first." });

  const user = await prisma.user.update({
    where: { email: email.trim().toLowerCase() },
    data: { role: "ADMIN" },
  });

  res.json({ message: `${user.name} (${user.email}) is now an admin. Log out and back in for it to take effect.`, role: user.role });
}

module.exports = { findUserByEmail, upgradeUser, downgradeUser, promoteToAdmin };
