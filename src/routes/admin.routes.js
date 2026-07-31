const express = require("express");
const { findUserByEmail, upgradeUser, downgradeUser, promoteToAdmin } = require("../controllers/admin.controller");

const router = express.Router();

router.post("/lookup", findUserByEmail);
router.post("/upgrade", upgradeUser);
router.post("/downgrade", downgradeUser);
router.post("/promote", promoteToAdmin);

module.exports = router;
