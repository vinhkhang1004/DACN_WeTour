import { User } from "./User.js";
import { Tour } from "./Tour.js";
import { Booking } from "./Booking.js";
import { Payment } from "./Payment.js";
import { Review } from "./Review.js";
import { Newsletter } from "./Newsletter.js";
import { Promotion, PromotionUsage } from "./Promotion.js";
import { LoyaltyTransaction } from "./loyalty/LoyaltyTransaction.js";
import { Notification } from "./Notification.js";
import { Post, Category as PostCategory } from "./Post.js";
import { Category } from "./Category.js";
import { EmailVerification } from "./EmailVerification.js";
import { PasswordReset } from "./PasswordReset.js";
import { Conversation } from "./Conversation.js";
import { Message } from "./Message.js";
import { Activity } from "./Activity.js";
import { CustomTour } from "./CustomTour.js";
import { CustomTourActivity } from "./CustomTourActivity.js";
import { Hotel } from "./Hotel.js";
import { HotelBooking } from "./HotelBooking.js";
import { HotelRoom } from "./HotelRoom.js";
import { HotelReview } from "./HotelReview.js";
import { Flight } from "./Flight.js";
import { FlightBooking } from "./FlightBooking.js";

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

  // Promotion - HotelBooking
  Promotion.hasMany(HotelBooking, { foreignKey: "promotion_id" });
  HotelBooking.belongsTo(Promotion, { foreignKey: "promotion_id" });

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

  // Tour - Category (many-to-many)
  Tour.belongsToMany(Category, { 
    through: "tour_categories", 
    foreignKey: "tour_id",
    otherKey: "category_id",
    timestamps: false
  });
  Category.belongsToMany(Tour, { 
    through: "tour_categories", 
    foreignKey: "category_id",
    otherKey: "tour_id",
    timestamps: false
  });

  // User - CustomTour
  User.hasMany(CustomTour, { foreignKey: "user_id" });
  CustomTour.belongsTo(User, { foreignKey: "user_id" });

  // CustomTour - CustomTourActivity
  CustomTour.hasMany(CustomTourActivity, { foreignKey: "custom_tour_id", as: "Activities" });
  CustomTourActivity.belongsTo(CustomTour, { foreignKey: "custom_tour_id" });

  // Activity - CustomTourActivity
  Activity.hasMany(CustomTourActivity, { foreignKey: "activity_id" });
  CustomTourActivity.belongsTo(Activity, { foreignKey: "activity_id", as: "Activity" });

  // User - HotelBooking
  User.hasMany(HotelBooking, { foreignKey: "user_id" });
  HotelBooking.belongsTo(User, { foreignKey: "user_id" });

  // Hotel - HotelBooking
  Hotel.hasMany(HotelBooking, { foreignKey: "hotel_id" });
  HotelBooking.belongsTo(Hotel, { foreignKey: "hotel_id" });

  // Hotel - HotelRoom
  Hotel.hasMany(HotelRoom, { foreignKey: "hotel_id", as: "Rooms" });
  HotelRoom.belongsTo(Hotel, { foreignKey: "hotel_id" });

  // User - HotelReview
  User.hasMany(HotelReview, { foreignKey: "user_id" });
  HotelReview.belongsTo(User, { foreignKey: "user_id" });

  // Hotel - HotelReview
  Hotel.hasMany(HotelReview, { foreignKey: "hotel_id", as: "Reviews" });
  HotelReview.belongsTo(Hotel, { foreignKey: "hotel_id" });

  // HotelBooking - HotelReview
  HotelBooking.hasOne(HotelReview, { foreignKey: "booking_id" });
  HotelReview.belongsTo(HotelBooking, { foreignKey: "booking_id" });

  // User - FlightBooking
  User.hasMany(FlightBooking, { foreignKey: "user_id" });
  FlightBooking.belongsTo(User, { foreignKey: "user_id" });

  // Flight - FlightBooking
  Flight.hasMany(FlightBooking, { foreignKey: "flight_id", as: "OutboundBookings" });
  FlightBooking.belongsTo(Flight, { foreignKey: "flight_id", as: "OutboundFlight" });
  
  Flight.hasMany(FlightBooking, { foreignKey: "return_flight_id", as: "ReturnBookings" });
  FlightBooking.belongsTo(Flight, { foreignKey: "return_flight_id", as: "ReturnFlight" });

  // Promotion - FlightBooking
  Promotion.hasMany(FlightBooking, { foreignKey: "promotion_id" });
  FlightBooking.belongsTo(Promotion, { foreignKey: "promotion_id" });
};

export { User, Tour, Booking, Payment, Review, Newsletter, Promotion, PromotionUsage, LoyaltyTransaction, Notification, Post, Category, PostCategory, EmailVerification, PasswordReset, Conversation, Message, Activity, CustomTour, CustomTourActivity, Hotel, HotelBooking, HotelRoom, HotelReview, Flight, FlightBooking };
