import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

// ✅ Kiểm tra token (cho người dùng)
export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Không có token, vui lòng đăng nhập." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    // JWT verification failed - return 401 (Unauthorized) not 403 (Forbidden)
    return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
  }
};

// ✅ Xác thực người dùng bình thường
export const authenticateUser = verifyToken;

// ✅ Xác thực tùy chọn (optional) - không bắt buộc token
export const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    // Token không hợp lệ nhưng vẫn cho phép tiếp tục (không set req.user)
    req.user = null;
    next();
  }
};

// ✅ Xác thực riêng cho admin
export const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Thiếu token xác thực" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin")
      return res.status(403).json({ message: "Chỉ admin mới được phép truy cập" });
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Token không hợp lệ" });
  }
};
