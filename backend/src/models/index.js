import { User } from "./User.js";
import { Tour } from "./Tour.js";
import { Booking } from "./Booking.js";
import { Payment } from "./Payment.js";
import { Review } from "./Review.js";
import { Newsletter } from "./Newsletter.js";
import { Promotion, PromotionUsage } from "./Promotion.js";
import { LoyaltyTransaction } from "./loyalty/LoyaltyTransaction.js";
import { Notification } from "./Notification.js";
import { Post, Category } from "./Post.js";
import { EmailVerification } from "./EmailVerification.js";
import { Conversation } from "./Conversation.js";
import { Message } from "./Message.js";

export const initModels = () => {
  // Relations
  // User - Booking
  User.hasMany(Booking, { foreignKey: "user_id" });
  Booking.belongsTo(User, { foreignKey: "user_id" });

  // Tour - Booking
  Tour.hasMany(Booking, { foreignKey: "tour_id" });
  Booking.belongsTo(Tour, { foreignKey: "tour_id" });

  // Booking - Payment
  Booking.hasOne(Payment, { foreignKey: "booking_id" });
  Payment.belongsTo(Booking, { foreignKey: "booking_id" });

  // Tour - Review
  Tour.hasMany(Review, { foreignKey: "tour_id" });
  Review.belongsTo(Tour, { foreignKey: "tour_id" });

  // User - Review
  User.hasMany(Review, { foreignKey: "user_id" });
  Review.belongsTo(User, { foreignKey: "user_id" });

  // Promotion - Booking
  Promotion.hasMany(Booking, { foreignKey: "promotion_id" });
  Booking.belongsTo(Promotion, { foreignKey: "promotion_id" });

  // Promotion - PromotionUsage
  Promotion.hasMany(PromotionUsage, { foreignKey: "promotion_id" });
  PromotionUsage.belongsTo(Promotion, { foreignKey: "promotion_id" });

  // User - PromotionUsage
  User.hasMany(PromotionUsage, { foreignKey: "user_id" });
  PromotionUsage.belongsTo(User, { foreignKey: "user_id" });

  // Booking - PromotionUsage
  Booking.hasMany(PromotionUsage, { foreignKey: "booking_id" });
  PromotionUsage.belongsTo(Booking, { foreignKey: "booking_id" });

  // User - LoyaltyTransaction
  User.hasMany(LoyaltyTransaction, { foreignKey: "user_id" });
  LoyaltyTransaction.belongsTo(User, { foreignKey: "user_id" });

  // User - Notification
  User.hasMany(Notification, { foreignKey: "user_id" });
  Notification.belongsTo(User, { foreignKey: "user_id" });

  // User - Post (author)
  User.hasMany(Post, { foreignKey: "author_id" });
  Post.belongsTo(User, { foreignKey: "author_id" });

  // User - Conversation
  User.hasMany(Conversation, { foreignKey: "user_id" });
  Conversation.belongsTo(User, { foreignKey: "user_id" });

  // Conversation - Message
  Conversation.hasMany(Message, { foreignKey: "conversation_id" });
  Message.belongsTo(Conversation, { foreignKey: "conversation_id" });

  // User - Message (sender)
  User.hasMany(Message, { foreignKey: "sender_id" });
  Message.belongsTo(User, { foreignKey: "sender_id", as: "Sender" });
};

export { User, Tour, Booking, Payment, Review, Newsletter, Promotion, PromotionUsage, LoyaltyTransaction, Notification, Post, Category, EmailVerification, Conversation, Message };
