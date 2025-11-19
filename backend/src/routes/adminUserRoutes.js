// src/routes/adminUserRoutes.js
import express from "express";
import { authenticateAdmin } from "../middleware/authMiddleware.js";
import { User, Booking } from "../models/index.js";
import { Op, fn, col, literal } from "sequelize";
import { sequelize } from "../config/db.js";

const router = express.Router();

/**
 * GET /api/admin/users?search=&page=1&limit=10
 * Trả về: data[], meta{page,limit,total}
 */
router.get("/", authenticateAdmin, async (req, res) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);
    const search = (req.query.search ?? "").trim();
    const offset = (page - 1) * limit;

    const where = search
      ? {
          [Op.or]: [
            { name: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } },
          ],
        }
      : {};

    // Lấy danh sách user
    const { rows, count } = await User.findAndCountAll({
      where,
      attributes: [
        "id",
        "name",
        "email",
        "role",
        "status",
        // map created_at -> createdAt nếu DB của bạn dùng snake_case:
        [col("created_at"), "createdAt"],
      ],
      order: [["id", "DESC"]],
      limit,
      offset,
      raw: true,
    });

    const ids = rows.map((u) => u.id);
    let aggByUser = [];
    if (ids.length) {
      // Gom thống kê booking theo user
      aggByUser = await Booking.findAll({
        where: { user_id: { [Op.in]: ids } },
        attributes: [
          "user_id",
          [fn("COUNT", col("id")), "total"],
          [
            // số booking thành công (paid/completed)
            fn(
              "SUM",
              literal("CASE WHEN status IN ('paid','completed') THEN 1 ELSE 0 END")
            ),
            "completed",
          ],
          [fn("SUM", col("total_price")), "spent"],
        ],
        group: ["user_id"],
        raw: true,
      });
    }

    const statMap = Object.fromEntries(
      aggByUser.map((x) => [
        x.user_id,
        {
          total: Number(x.total) || 0,
          completed: Number(x.completed) || 0,
          spent: Number(x.spent) || 0,
        },
      ])
    );

    const data = rows.map((u) => ({
      ...u,
      bookingStats: statMap[u.id] ?? { total: 0, completed: 0, spent: 0 },
    }));

    res.json({ data, meta: { page, limit, total: count } });
  } catch (e) {
    console.error("GET /api/admin/users error:", e);
    res.status(500).json({ message: "Lỗi lấy danh sách người dùng" });
  }
});

/**
 * PUT /api/admin/users/:id/role   body: { role: "admin" | "user" }
 */
router.put("/:id/role", authenticateAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!["admin", "user"].includes(role)) {
      return res.status(400).json({ message: "Role không hợp lệ" });
    }
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy user" });

    await user.update({ role });
    res.json({ message: "Đã cập nhật quyền", user });
  } catch (e) {
    console.error("PUT /admin/users/:id/role error:", e);
    res.status(500).json({ message: "Lỗi cập nhật quyền" });
  }
});

/**
 * PUT /api/admin/users/:id/status   body: { status: "active" | "banned" }
 */
router.put("/:id/status", authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["active", "banned"].includes(status)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy user" });

    await user.update({ status }); // 🟢 dòng quan trọng
    res.json({ message: "Đã cập nhật trạng thái", user });
  } catch (e) {
    console.error("PUT /admin/users/:id/status error:", e);
    res.status(500).json({ message: "Lỗi cập nhật trạng thái" });
  }
});

/**
 * GET /api/admin/users/stats
 */
router.get("/stats", authenticateAdmin, async (req, res) => {
  try {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { status: "active" } });
    const bannedUsers = await User.count({ where: { status: "banned" } });
    const adminUsers = await User.count({ where: { role: "admin" } });
    
    res.json({
      totalUsers,
      activeUsers,
      bannedUsers,
      adminUsers,
      regularUsers: totalUsers - adminUsers,
    });
  } catch (e) {
    console.error("GET /admin/users/stats error:", e);
    res.status(500).json({ message: "Lỗi lấy thống kê" });
  }
});

export default router;
