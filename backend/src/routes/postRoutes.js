import express from "express";
import { Post, User, Category } from "../models/index.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { Op } from "sequelize";

const router = express.Router();

// List posts (public: only published, admin: all with showAll=true)
router.get("/", async (req, res) => {
  try {
    const { category, q, page = 1, limit = 12, showAll } = req.query;
    const where = {};
    
    // Public view: only show published posts
    // Admin view: show all if showAll=true
    if (!showAll) {
      where.is_published = true;
    }
    
    if (category) where.category = category;
    if (q) where[Op.or] = [
      { title: { [Op.like]: `%${q}%` } },
      { summary: { [Op.like]: `%${q}%` } }
    ];

    const offset = (page - 1) * limit;
    const { count, rows } = await Post.findAndCountAll({
      where,
      include: [{ model: User, attributes: ["id", "name"] }],
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset,
    });

    res.json({ posts: rows, total: count, page: parseInt(page), totalPages: Math.ceil(count / limit) });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Get one published post by id or slug
router.get("/:idOrSlug", async (req, res) => {
  try {
    const where = { is_published: true };
    const idOrSlug = req.params.idOrSlug;
    if (isNaN(idOrSlug)) where.slug = idOrSlug;
    else where.id = idOrSlug;

    const post = await Post.findOne({
      where,
      include: [{ model: User, attributes: ["id", "name"] }],
    });

    if (!post) return res.status(404).json({ message: "Post not found" });
    
    // Increment views
    await post.update({ views: (post.views || 0) + 1 });

    res.json(post);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// List categories
router.get("/categories/list", async (req, res) => {
  try {
    const cats = await Category.findAll({ order: [["name", "ASC"]] });
    res.json(cats);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Create post (anyone logged in)
router.post("/", verifyToken, async (req, res) => {
  try {
    const { title, summary, content, category = "travel", image, is_published = false } = req.body;
    if (!title || !content) return res.status(400).json({ message: "Tiêu đề và nội dung là bắt buộc" });

    // Tạo slug từ title
    const slug = title.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove diacritics
      .replace(/đ/g, "d").replace(/Đ/g, "D")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      + "-" + Date.now(); // Add timestamp to avoid duplicates

    const post = await Post.create({
      title,
      slug,
      summary,
      content,
      category,
      image,
      author_id: req.user.id,
      // User tạo blog sẽ là "chờ duyệt" (is_published = false)
      // Admin tạo có thể tự chọn publish ngay
      is_published: req.user.role === "admin" ? is_published : false,
    });

    res.status(201).json({ 
      message: req.user.role === "admin" 
        ? "Tạo bài viết thành công!" 
        : "Tạo bài viết thành công! Chờ admin duyệt để hiển thị.",
      post 
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Update post (admin or author)
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ message: "Không tìm thấy bài viết" });

    // Chỉ admin hoặc tác giả mới được sửa
    if (req.user.role !== "admin" && post.author_id !== req.user.id) {
      return res.status(403).json({ message: "Bạn không có quyền sửa bài viết này" });
    }

    // User không thể tự publish, chỉ admin mới có quyền
    const updateData = { ...req.body };
    if (req.user.role !== "admin") {
      delete updateData.is_published;
    }

    await post.update(updateData);
    res.json(post);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Delete post (admin or author)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ message: "Không tìm thấy bài viết" });

    // Chỉ admin hoặc tác giả mới được xóa
    if (req.user.role !== "admin" && post.author_id !== req.user.id) {
      return res.status(403).json({ message: "Bạn không có quyền xóa bài viết này" });
    }

    await post.destroy();
    res.json({ message: "Xóa bài viết thành công" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Get user's own posts
router.get("/my/posts", verifyToken, async (req, res) => {
  try {
    const posts = await Post.findAll({
      where: { author_id: req.user.id },
      order: [["created_at", "DESC"]],
      include: [{ model: User, attributes: ["id", "name"] }]
    });
    res.json(posts);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;

