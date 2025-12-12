import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { User, EmailVerification } from "../models/index.js";
import { sendVerificationEmail } from "../utils/emailService.js";
import { Op } from "sequelize";
import { OAuth2Client } from 'google-auth-library';
import { verifyToken } from "../middleware/authMiddleware.js";

dotenv.config();
const router = express.Router();

// Helper: Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP for email verification
router.post("/send-verification", async (req, res) => {
  try {
    const { email, name } = req.body;
    
    // Check if email already exists in users
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email này đã được đăng ký. Vui lòng đăng nhập." });
    }

    // Generate OTP
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete old unverified codes for this email
    await EmailVerification.destroy({
      where: {
        email,
        is_verified: false,
        expires_at: { [Op.lt]: new Date() }
      }
    });

    // Create new verification record
    await EmailVerification.create({
      email,
      code,
      expires_at: expiresAt,
      is_verified: false
    });

    // Send email
    const emailResult = await sendVerificationEmail(email, code);
    
    if (!emailResult.success) {
      return res.status(500).json({ message: "Không thể gửi email. Vui lòng thử lại." });
    }

    res.json({ 
      message: "Mã xác thực đã được gửi đến email của bạn. Vui lòng kiểm tra inbox.",
      expires_in: 600 // 10 minutes in seconds
    });
  } catch (e) {
    console.error("Error sending verification:", e);
    res.status(500).json({ message: e.message });
  }
});

// Verify OTP code
router.post("/verify-email", async (req, res) => {
  try {
    const { email, code } = req.body;

    const verification = await EmailVerification.findOne({
      where: {
        email,
        code,
        is_verified: false,
        expires_at: { [Op.gt]: new Date() }
      }
    });

    if (!verification) {
      return res.status(400).json({ 
        message: "Mã xác thực không hợp lệ hoặc đã hết hạn. Vui lòng gửi lại mã mới." 
      });
    }

    // Mark as verified
    verification.is_verified = true;
    verification.verified_at = new Date();
    await verification.save();

    res.json({ 
      message: "Email đã được xác thực thành công!",
      verified: true
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Register (now requires email verification)
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if email already exists
    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(400).json({ message: "Email đã tồn tại" });

    // Check if email is verified
    const verified = await EmailVerification.findOne({
      where: {
        email,
        is_verified: true
      },
      order: [['verified_at', 'DESC']]
    });

    if (!verified) {
      return res.status(400).json({ 
        message: "Email chưa được xác thực. Vui lòng xác thực email trước khi đăng ký.",
        requires_verification: true
      });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });
    
    res.json({ 
      message: "Đăng ký thành công!",
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(400).json({ message: "Sai email hoặc mật khẩu" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Sai email hoặc mật khẩu" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "2d" }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, role: user.role },
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});


// Get current user profile
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] }
    });
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });
    res.json(user);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Update user profile
router.put("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const { name, phone, address, avatar, date_of_birth, gender } = req.body;
    
    // Kiểm tra kích thước avatar nếu là base64
    if (avatar && avatar.startsWith('data:image')) {
      // Base64 string có thể rất lớn, giới hạn khoảng 500KB
      const base64Length = avatar.length;
      const estimatedSizeKB = (base64Length * 3) / 4 / 1024; // Ước tính kích thước
      
      if (estimatedSizeKB > 500) {
        return res.status(400).json({ 
          message: "Ảnh đại diện quá lớn. Vui lòng chọn ảnh nhỏ hơn hoặc nén ảnh trước khi upload." 
        });
      }
    }
    
    // User không thể tự thay đổi role hoặc email
    const updateData = {
      name: name !== undefined ? name : user.name,
      phone: phone !== undefined ? phone : user.phone,
      address: address !== undefined ? address : user.address,
      avatar: avatar !== undefined ? avatar : user.avatar,
      date_of_birth: date_of_birth !== undefined ? date_of_birth : user.date_of_birth,
      gender: gender !== undefined ? gender : user.gender
    };

    await user.update(updateData);
    
    // Reload user to get updated data
    await user.reload();
    
    res.json({ 
      message: "Cập nhật thông tin thành công",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        avatar: user.avatar,
        date_of_birth: user.date_of_birth,
        gender: user.gender,
        role: user.role
      }
    });
  } catch (e) {
    console.error("Error updating profile:", e);
    // Kiểm tra lỗi MySQL packet size
    if (e.message && e.message.includes('max_allowed_packet')) {
      return res.status(400).json({ 
        message: "Ảnh đại diện quá lớn. Vui lòng chọn ảnh nhỏ hơn hoặc nén ảnh trước khi upload." 
      });
    }
    res.status(500).json({ message: e.message });
  }
});

// Change password
router.put("/change-password", verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin" });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu hiện tại không đúng" });
    }

    // Hash and update new password
    const hashed = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashed });

    res.json({ message: "Đổi mật khẩu thành công" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Google OAuth setup
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Google OAuth endpoint
router.post("/oauth/google", async (req, res) => {
  try {
    const { credential } = req.body;
    
    if (!credential) {
      return res.status(400).json({ message: "Google credential is required" });
    }

    // Verify Google token
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (verifyError) {
      console.error('Google token verification failed:', verifyError);
      return res.status(401).json({ message: "Token Google không hợp lệ" });
    }

    const { email, name, picture } = payload;
    
    if (!email) {
      return res.status(400).json({ message: "Email không hợp lệ từ Google" });
    }

    // Find or create user
    let user = await User.findOne({ where: { email } });
    if (!user) {
      // Create new user with Google account
      user = await User.create({ 
        name: name || email.split("@")[0], 
        email, 
        password: await bcrypt.hash(Math.random().toString(36), 10) // Random password for Google users
      });
    }

    // Update last login
    await user.update({ last_login: new Date() });

    const token = jwt.sign(
      { id: user.id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: "2d" }
    );
    
    res.json({ 
      token, 
      user: { id: user.id, name: user.name, email: user.email, role: user.role } 
    });
  } catch (e) {
    console.error('Google OAuth error:', e);
    res.status(500).json({ message: e.message });
  }
});

export default router;
