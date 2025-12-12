import cron from 'node-cron';
import { Booking, Tour, User, Notification } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * Core notification job logic
 * Can be called directly (for Vercel Cron) or scheduled (for traditional servers)
 */
export const runNotificationJob = async () => {
  try {
    console.log('📅 Running notification scheduler...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get bookings that start in 3 days
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    const threeDaysLaterStr = threeDaysLater.toISOString().split('T')[0];
    
    // Get bookings that start in 1 day
    const oneDayLater = new Date(today);
    oneDayLater.setDate(oneDayLater.getDate() + 1);
    const oneDayLaterStr = oneDayLater.toISOString().split('T')[0];
    
    // Find bookings starting in 3 days (paid or approved)
    const bookings3Days = await Booking.findAll({
      where: {
        booking_date: threeDaysLaterStr,
        status: {
          [Op.in]: ['paid']
        }
      },
      include: [
        { model: Tour },
        { model: User }
      ]
    });
    
    // Find bookings starting in 1 day (paid or approved)
    const bookings1Day = await Booking.findAll({
      where: {
        booking_date: oneDayLaterStr,
        status: {
          [Op.in]: ['paid']
        }
      },
      include: [
        { model: Tour },
        { model: User }
      ]
    });
    
    // Send notifications for bookings in 3 days
    for (const booking of bookings3Days) {
      try {
        // Check if notification already sent
        const existingNotif = await Notification.findOne({
          where: {
            user_id: booking.user_id,
            title: `⏰ Tour "${booking.Tour?.name}" sắp bắt đầu!`,
            created_at: {
              [Op.gte]: new Date(today)
            }
          }
        });
        
        if (!existingNotif && booking.User) {
          await Notification.create({
            user_id: booking.User.id,
            title: `⏰ Tour "${booking.Tour?.name}" sắp bắt đầu!`,
            message: `Tour "${booking.Tour?.name}" của bạn sẽ bắt đầu sau 3 ngày nữa (${new Date(booking.booking_date).toLocaleDateString('vi-VN')}). Vui lòng chuẩn bị sẵn sàng cho chuyến đi!`,
            type: 'reminder',
            is_read: false
          });
          console.log(`✅ Sent 3-day reminder to user ${booking.User.id} for booking #${booking.id}`);
        }
      } catch (error) {
        console.error(`❌ Error sending 3-day reminder for booking #${booking.id}:`, error);
      }
    }
    
    // Send notifications for bookings in 1 day
    for (const booking of bookings1Day) {
      try {
        // Check if notification already sent
        const existingNotif = await Notification.findOne({
          where: {
            user_id: booking.user_id,
            title: `🚀 Tour "${booking.Tour?.name}" bắt đầu ngày mai!`,
            created_at: {
              [Op.gte]: new Date(today)
            }
          }
        });
        
        if (!existingNotif && booking.User) {
          await Notification.create({
            user_id: booking.User.id,
            title: `🚀 Tour "${booking.Tour?.name}" bắt đầu ngày mai!`,
            message: `Tour "${booking.Tour?.name}" của bạn sẽ bắt đầu vào ngày mai (${new Date(booking.booking_date).toLocaleDateString('vi-VN')}). Hãy kiểm tra lại hành lý và chuẩn bị sẵn sàng!`,
            type: 'reminder',
            is_read: false
          });
          console.log(`✅ Sent 1-day reminder to user ${booking.User.id} for booking #${booking.id}`);
        }
      } catch (error) {
        console.error(`❌ Error sending 1-day reminder for booking #${booking.id}:`, error);
      }
    }
    
    console.log(`📅 Notification scheduler completed. Sent ${bookings3Days.length + bookings1Day.length} reminders.`);
    return { success: true, count: bookings3Days.length + bookings1Day.length };
  } catch (error) {
    console.error('❌ Error in notification scheduler:', error);
    throw error;
  }
};

/**
 * Start notification scheduler using node-cron (for traditional servers)
 * Runs daily at 9:00 AM
 */
export const startNotificationScheduler = () => {
  // Run daily at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    await runNotificationJob();
  }, {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh"
  });
  
  console.log('✅ Notification scheduler started (runs daily at 9:00 AM)');
};

