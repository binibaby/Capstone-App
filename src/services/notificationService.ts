import AsyncStorage from '@react-native-async-storage/async-storage';
import { makeApiCall } from './networkService';

export interface Notification {
  id: string;
  type: 'booking' | 'message' | 'review' | 'system';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  avatar?: any;
  action?: string;
  data?: any; // Additional data for the notification
  userId?: string; // Optional userId to target specific user
}

class NotificationService {
  private static instance: NotificationService;
  private listeners: ((notifications: Notification[]) => void)[] = [];
  private lastApiCallTime: number = 0;
  private apiCallDebounceMs: number = 3000; // 3 second debounce for API calls

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Subscribe to notification updates
  subscribe(listener: (notifications: Notification[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners
  private notifyListeners(notifications: Notification[]) {
    this.listeners.forEach(listener => listener(notifications));
  }

  // Get all notifications
  async getNotifications(): Promise<Notification[]> {
    try {
      // First try to get from API
      const apiNotifications = await this.fetchNotificationsFromAPI();
      if (apiNotifications.length > 0) {
        console.log('📱 Fetched notifications from API:', apiNotifications.length);
        // Save to local storage for offline access
        await this.saveNotifications(apiNotifications);
        return this.filterNotificationsByUserType(apiNotifications);
      }
      
      // Fallback to local storage
      const stored = await AsyncStorage.getItem('notifications');
      const localNotifications = stored ? JSON.parse(stored) : [];
      console.log('📱 Using local notifications:', localNotifications.length);
      
      // Debug: Log all notifications to see what we have
      console.log('📋 All local notifications:', localNotifications);
      
      return this.filterNotificationsByUserType(localNotifications);
    } catch (error) {
      console.error('Error getting notifications:', error);
      // Fallback to local storage on error
      try {
        const stored = await AsyncStorage.getItem('notifications');
        const notifications = stored ? JSON.parse(stored) : [];
        return this.filterNotificationsByUserType(notifications);
      } catch (localError) {
        console.error('Error getting local notifications:', localError);
        return [];
      }
    }
  }

  // Filter notifications based on user type
  private async filterNotificationsByUserType(notifications: Notification[]): Promise<Notification[]> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.log('🔍 No user found, returning all notifications');
        return notifications;
      }

      const isPetSitter = user.userType === 'pet_sitter' || user.role === 'pet_sitter';
      console.log('🔍 Filtering notifications for user:', user.id, 'isPetSitter:', isPetSitter);
      console.log('🔍 Total notifications to filter:', notifications.length);
      
      const filtered = notifications.filter(notification => {
        // If notification has userId, only show to that specific user
        if (notification.userId) {
          const matches = notification.userId === user.id;
          console.log(`🔍 Notification ${notification.id} has userId ${notification.userId}, matches current user ${user.id}: ${matches}`);
          return matches;
        }
        
        // Otherwise, use the old filtering logic
        if (isPetSitter) {
          // Pet sitters see: booking requests, messages, reviews, system notifications
          const matches = notification.type === 'booking' || 
                 notification.type === 'message' || 
                 notification.type === 'review' || 
                 notification.type === 'system';
          console.log(`🔍 Pet sitter notification ${notification.id} (${notification.type}): ${matches}`);
          return matches;
        } else {
          // Pet owners see: booking confirmations/cancellations, messages, system notifications
          // Check if it's a booking notification with status or if it's targeted to this user
          const isBookingWithStatus = notification.type === 'booking' && 
                 (notification.data?.status === 'confirmed' || 
                  notification.data?.status === 'cancelled' ||
                  notification.title?.includes('confirmed') ||
                  notification.title?.includes('cancelled'));
          const isMessageOrSystem = notification.type === 'message' || notification.type === 'system';
          const matches = isBookingWithStatus || isMessageOrSystem;
          console.log(`🔍 Pet owner notification ${notification.id} (${notification.type}): bookingWithStatus=${isBookingWithStatus}, messageOrSystem=${isMessageOrSystem}, matches=${matches}`);
          if (notification.type === 'booking') {
            console.log(`🔍   - Title: ${notification.title}`);
            console.log(`🔍   - Data status: ${notification.data?.status}`);
          }
          return matches;
        }
      });
      
      console.log('🔍 Filtered notifications result:', filtered.length);
      return filtered;
    } catch (error) {
      console.error('Error filtering notifications by user type:', error);
      return notifications;
    }
  }

  // Fetch notifications from API
  private async fetchNotificationsFromAPI(): Promise<Notification[]> {
    try {
      // Debounce API calls
      const now = Date.now();
      if (now - this.lastApiCallTime < this.apiCallDebounceMs) {
        console.log('🚫 Skipping notification API call due to debounce');
        return [];
      }
      this.lastApiCallTime = now;

      const user = await this.getCurrentUser();
      if (!user) {
        console.log('❌ No user found for API call');
        return [];
      }

      // Get auth token
      let token = user.token;
      if (!token) {
        // Fallback to hardcoded tokens for testing
        if (user.id === '5') {
          token = '64|dTO5Gio05Om1Buxtkta02gVpvQnetCTMrofsLjeudda0034b';
        } else if (user.id === '21') {
          token = '67|uCtobaBZatzbzDOeK8k1DytVHby0lpa07ERJJczu3cdfa507';
        } else {
          console.log('❌ No token available for user:', user.id);
          return [];
        }
      }

      console.log('🔑 Fetching notifications from API for user:', user.id);

      const response = await makeApiCall('/api/notifications/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📱 API notifications response:', data);
        
        if (data.success && data.notifications) {
          // Convert API format to local format
          const notifications: Notification[] = data.notifications.map((apiNotif: any) => ({
            id: apiNotif.id.toString(),
            type: apiNotif.type || 'system',
            title: apiNotif.title || 'Notification',
            message: apiNotif.message || '',
            time: apiNotif.created_at,
            isRead: !!apiNotif.read_at,
            data: apiNotif.data || null,
          }));
          
          console.log('✅ Converted API notifications:', notifications.length);
          return notifications;
        }
      } else {
        console.log('⚠️ API call failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching notifications from API:', error);
    }
    
    return [];
  }

  // Get current user (import from auth service)
  private async getCurrentUser() {
    const { default: authService } = await import('./authService');
    return await authService.getCurrentUser();
  }

  // Mark notification as read on API
  private async markAsReadOnAPI(notificationId: string) {
    const user = await this.getCurrentUser();
    if (!user) {
      console.log('❌ No user found for API call');
      return;
    }

    // Get auth token
    let token = user.token;
    if (!token) {
      // Fallback to hardcoded tokens for testing
      if (user.id === '5') {
        token = '64|dTO5Gio05Om1Buxtkta02gVpvQnetCTMrofsLjeudda0034b';
      } else if (user.id === '21') {
        token = '67|uCtobaBZatzbzDOeK8k1DytVHby0lpa07ERJJczu3cdfa507';
      } else {
        console.log('❌ No token available for user:', user.id);
        return;
      }
    }

    console.log('🔑 Marking notification as read on API:', notificationId);

    const response = await makeApiCall(`/api/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      console.log('✅ Successfully marked notification as read on API');
    } else {
      console.log('⚠️ Failed to mark notification as read on API:', response.status);
    }
  }

  // Mark all notifications as read on API
  private async markAllAsReadOnAPI() {
    const user = await this.getCurrentUser();
    if (!user) {
      console.log('❌ No user found for API call');
      return;
    }

    // Get auth token
    let token = user.token;
    if (!token) {
      // Fallback to hardcoded tokens for testing
      if (user.id === '5') {
        token = '64|dTO5Gio05Om1Buxtkta02gVpvQnetCTMrofsLjeudda0034b';
      } else if (user.id === '21') {
        token = '67|uCtobaBZatzbzDOeK8k1DytVHby0lpa07ERJJczu3cdfa507';
      } else {
        console.log('❌ No token available for user:', user.id);
        return;
      }
    }

    console.log('🔑 Marking all notifications as read on API');

    const response = await makeApiCall('/api/notifications/mark-all-read', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      console.log('✅ Successfully marked all notifications as read on API');
    } else {
      console.log('⚠️ Failed to mark all notifications as read on API:', response.status);
    }
  }

  // Save notifications to storage
  private async saveNotifications(notifications: Notification[]) {
    try {
      console.log('💾 Saving notifications to AsyncStorage:', notifications.length);
      await AsyncStorage.setItem('notifications', JSON.stringify(notifications));
      console.log('📢 Notifying listeners:', this.listeners.length);
      this.notifyListeners(notifications);
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }

  // Add a new notification
  async addNotification(notification: Omit<Notification, 'id' | 'time' | 'isRead'>) {
    console.log('🔔 Adding new notification:', notification.title);
    
    // Get all notifications from storage (unfiltered)
    const stored = await AsyncStorage.getItem('notifications');
    const allNotifications = stored ? JSON.parse(stored) : [];
    
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      time: new Date().toLocaleString(),
      isRead: false,
    };

    allNotifications.unshift(newNotification); // Add to beginning
    console.log('📋 Total notifications after adding:', allNotifications.length);
    
    // Save back to storage
    await AsyncStorage.setItem('notifications', JSON.stringify(allNotifications));
    
    // Notify listeners with filtered notifications
    const filteredNotifications = await this.filterNotificationsByUserType(allNotifications);
    this.notifyListeners(filteredNotifications);
    
    return newNotification;
  }

  // Add notification for a specific user
  async addNotificationForUser(userId: string, notification: Omit<Notification, 'id' | 'time' | 'isRead' | 'userId'>) {
    console.log('🔔 Adding notification for user:', userId, notification.title);
    console.log('🔔 Notification data:', notification.data);
    
    // Get all notifications from storage (unfiltered)
    const stored = await AsyncStorage.getItem('notifications');
    const allNotifications = stored ? JSON.parse(stored) : [];
    
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      time: new Date().toLocaleString(),
      isRead: false,
      userId: userId, // Add userId to target specific user
    };

    console.log('🔔 New notification created:', newNotification);
    
    allNotifications.unshift(newNotification); // Add to beginning
    console.log('📋 Total notifications after adding for user:', allNotifications.length);
    
    // Save back to storage
    await AsyncStorage.setItem('notifications', JSON.stringify(allNotifications));
    
    // Notify listeners with filtered notifications
    const filteredNotifications = await this.filterNotificationsByUserType(allNotifications);
    console.log('📋 Filtered notifications for listeners:', filteredNotifications.length);
    this.notifyListeners(filteredNotifications);
    
    return newNotification;
  }

  // Mark notification as read
  async markAsRead(notificationId: string) {
    try {
      // First, try to update on the backend API
      await this.markAsReadOnAPI(notificationId);
    } catch (error) {
      console.log('⚠️ Failed to mark as read on API, updating locally only:', error);
    }

    // Get all notifications from storage (unfiltered)
    const stored = await AsyncStorage.getItem('notifications');
    const allNotifications = stored ? JSON.parse(stored) : [];
    
    // Update the specific notification
    const updated = allNotifications.map(n => 
      n.id === notificationId ? { ...n, isRead: true } : n
    );
    
    // Save back to storage
    await AsyncStorage.setItem('notifications', JSON.stringify(updated));
    
    // Notify listeners with filtered notifications
    const filteredNotifications = await this.filterNotificationsByUserType(updated);
    this.notifyListeners(filteredNotifications);
  }

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      // First, try to update on the backend API
      await this.markAllAsReadOnAPI();
    } catch (error) {
      console.log('⚠️ Failed to mark all as read on API, updating locally only:', error);
    }

    // Get all notifications from storage (unfiltered)
    const stored = await AsyncStorage.getItem('notifications');
    const allNotifications = stored ? JSON.parse(stored) : [];
    
    // Update all notifications
    const updated = allNotifications.map(n => ({ ...n, isRead: true }));
    
    // Save back to storage
    await AsyncStorage.setItem('notifications', JSON.stringify(updated));
    
    // Notify listeners with filtered notifications
    const filteredNotifications = await this.filterNotificationsByUserType(updated);
    this.notifyListeners(filteredNotifications);
  }

  // Delete notification
  async deleteNotification(notificationId: string) {
    // Get all notifications from storage (unfiltered)
    const stored = await AsyncStorage.getItem('notifications');
    const allNotifications = stored ? JSON.parse(stored) : [];
    
    // Remove the specific notification
    const updated = allNotifications.filter(n => n.id !== notificationId);
    
    // Save back to storage
    await AsyncStorage.setItem('notifications', JSON.stringify(updated));
    
    // Notify listeners with filtered notifications
    const filteredNotifications = await this.filterNotificationsByUserType(updated);
    this.notifyListeners(filteredNotifications);
  }

  // Get unread count
  async getUnreadCount(): Promise<number> {
    const notifications = await this.getNotifications();
    return notifications.filter(n => !n.isRead).length;
  }

  // Clear all notifications (for testing)
  async clearAllNotifications(): Promise<void> {
    console.log('🗑️ Clearing all notifications...');
    await AsyncStorage.removeItem('notifications');
    this.notifyListeners([]);
  }

  // Refresh notifications from API and update local storage
  async refreshNotifications(): Promise<Notification[]> {
    try {
      // Clear cache to force fresh API call
      this.lastApiCallTime = 0;
      
      // Get fresh notifications from API
      const apiNotifications = await this.fetchNotificationsFromAPI();
      if (apiNotifications.length > 0) {
        console.log('🔄 Refreshed notifications from API:', apiNotifications.length);
        // Save to local storage
        await this.saveNotifications(apiNotifications);
        return this.filterNotificationsByUserType(apiNotifications);
      }
      
      // Fallback to local storage
      const stored = await AsyncStorage.getItem('notifications');
      const localNotifications = stored ? JSON.parse(stored) : [];
      return this.filterNotificationsByUserType(localNotifications);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
      // Fallback to local storage
      const stored = await AsyncStorage.getItem('notifications');
      const notifications = stored ? JSON.parse(stored) : [];
      return this.filterNotificationsByUserType(notifications);
    }
  }

  // Create booking notification
  async createBookingNotification(bookingData: {
    sitterId: string;
    sitterName: string;
    petOwnerId: string;
    petOwnerName: string;
    bookingId: string;
    date: string;
    startTime: string;
    endTime: string;
    hourlyRate: number;
  }) {
    console.log('🔔 Creating booking notification with data:', bookingData);
    
    // Create notification specifically for the sitter
    const notification = await this.addNotificationForUser(bookingData.sitterId, {
      type: 'booking',
      title: 'New Booking Request',
      message: `${bookingData.petOwnerName} wants to book you for ${bookingData.date} from ${bookingData.startTime} to ${bookingData.endTime} at ₱${bookingData.hourlyRate}/hour`,
      action: 'View Request',
      data: {
        sitterId: bookingData.sitterId,
        sitterName: bookingData.sitterName,
        petOwnerId: bookingData.petOwnerId,
        petOwnerName: bookingData.petOwnerName,
        bookingId: bookingData.bookingId,
        date: bookingData.date,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        hourlyRate: bookingData.hourlyRate,
      }
    });
    
    console.log('✅ Booking notification created:', notification);
    return notification;
  }

  // Create booking confirmation notification
  async createBookingConfirmationNotification(bookingData: {
    sitterId: string;
    sitterName: string;
    petOwnerId: string;
    petOwnerName: string;
    bookingId: string;
    date: string;
    startTime: string;
    endTime: string;
    status: 'confirmed' | 'cancelled';
  }) {
    console.log('🔔 Creating booking confirmation notification for pet owner:', bookingData.petOwnerId);
    console.log('🔔 Booking data:', bookingData);
    
    const statusText = bookingData.status === 'confirmed' ? 'confirmed' : 'cancelled';
    const emoji = bookingData.status === 'confirmed' ? '✅' : '❌';
    
    // Different messages and actions for confirmed vs cancelled
    let message: string;
    let action: string;
    
    if (bookingData.status === 'confirmed') {
      message = `${emoji} Great news! ${bookingData.sitterName} has confirmed your booking for ${bookingData.date} from ${bookingData.startTime} to ${bookingData.endTime}. You can now message them to coordinate details.`;
      action = 'Message';
    } else {
      message = `${emoji} ${bookingData.sitterName} has cancelled your booking for ${bookingData.date} from ${bookingData.startTime} to ${bookingData.endTime}. Sorry for the inconvenience.`;
      action = 'View';
    }
    
    console.log('🔔 Notification message:', message);
    console.log('🔔 Notification action:', action);
    
    // Create notification specifically for the pet owner
    const notification = await this.addNotificationForUser(bookingData.petOwnerId, {
      type: 'booking',
      title: `Booking ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`,
      message,
      action,
      data: {
        sitterId: bookingData.sitterId,
        sitterName: bookingData.sitterName,
        petOwnerId: bookingData.petOwnerId,
        petOwnerName: bookingData.petOwnerName,
        bookingId: bookingData.bookingId,
        date: bookingData.date,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        status: bookingData.status,
      }
    });
    
    console.log('✅ Booking confirmation notification created:', notification);
    return notification;
  }

  // Create message notification
  async createMessageNotification(messageData: {
    senderId: string;
    senderName: string;
    message: string;
    isBookingRelated?: boolean;
  }) {
    const title = messageData.isBookingRelated ? 'New Message (Booking Related)' : 'New Message';
    
    return this.addNotification({
      type: 'message',
      title,
      message: `${messageData.senderName}: ${messageData.message.substring(0, 50)}${messageData.message.length > 50 ? '...' : ''}`,
      action: 'Reply',
      data: {
        senderId: messageData.senderId,
        senderName: messageData.senderName,
        message: messageData.message,
        isBookingRelated: messageData.isBookingRelated,
      }
    });
  }

  // Create sample notifications for testing
  private async createSampleNotifications(): Promise<Notification[]> {
    const now = new Date();
    
    // Get current user to determine user type
    const user = await this.getCurrentUser();
    const isPetSitter = user?.userType === 'pet_sitter' || user?.role === 'pet_sitter';
    
    let sampleNotifications: Notification[] = [];
    
    if (isPetSitter) {
      // Pet Sitter notifications - they receive booking requests, messages, reviews
      sampleNotifications = [
        {
          id: '1',
          type: 'booking',
          title: 'New Booking Request',
          message: 'Sarah Johnson wants to book you for tomorrow from 2:00 PM to 6:00 PM at $25/hour',
          time: new Date(now.getTime() - 2 * 60 * 60 * 1000).toLocaleString(), // 2 hours ago
          isRead: false,
          action: 'View Request',
          data: {
            bookingId: '123',
            petOwnerName: 'Sarah Johnson',
            date: 'Tomorrow',
            startTime: '2:00 PM',
            endTime: '6:00 PM',
            hourlyRate: 25
          }
        },
        {
          id: '2',
          type: 'message',
          title: 'New Message',
          message: 'Hi! I have a few questions about the booking. Can you confirm the location?',
          time: new Date(now.getTime() - 4 * 60 * 60 * 1000).toLocaleString(), // 4 hours ago
          isRead: false,
          action: 'Reply',
          data: {
            senderId: '456',
            senderName: 'Mike Wilson',
            message: 'Hi! I have a few questions about the booking. Can you confirm the location?'
          }
        },
        {
          id: '3',
          type: 'system',
          title: 'Profile Update Required',
          message: 'Please complete your profile verification to get more bookings',
          time: new Date(now.getTime() - 24 * 60 * 60 * 1000).toLocaleString(), // 1 day ago
          isRead: true,
          action: 'Update Profile',
          data: {
            type: 'profile_verification'
          }
        },
        {
          id: '4',
          type: 'review',
          title: 'New Review Received',
          message: 'You received a 5-star review from Emma Davis!',
          time: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toLocaleString(), // 2 days ago
          isRead: true,
          data: {
            reviewId: '789',
            rating: 5,
            reviewerName: 'Emma Davis'
          }
        }
      ];
    } else {
      // Pet Owner notifications - they only receive confirmations/cancellations from sitters
      sampleNotifications = [
        {
          id: '1',
          type: 'booking',
          title: 'Booking Confirmed!',
          message: 'John Smith has confirmed your booking for tomorrow from 2:00 PM to 6:00 PM',
          time: new Date(now.getTime() - 1 * 60 * 60 * 1000).toLocaleString(), // 1 hour ago
          isRead: false,
          action: 'View Details',
          data: {
            bookingId: '123',
            sitterName: 'John Smith',
            date: 'Tomorrow',
            startTime: '2:00 PM',
            endTime: '6:00 PM',
            status: 'confirmed'
          }
        },
        {
          id: '2',
          type: 'booking',
          title: 'Booking Cancelled',
          message: 'Lisa Brown has cancelled your booking for Friday due to an emergency',
          time: new Date(now.getTime() - 3 * 60 * 60 * 1000).toLocaleString(), // 3 hours ago
          isRead: false,
          action: 'Find New Sitter',
          data: {
            bookingId: '124',
            sitterName: 'Lisa Brown',
            date: 'Friday',
            startTime: '10:00 AM',
            endTime: '2:00 PM',
            status: 'cancelled',
            reason: 'emergency'
          }
        },
        {
          id: '3',
          type: 'message',
          title: 'New Message from Sitter',
          message: 'Hi! I\'m on my way to your location. I\'ll be there in 10 minutes.',
          time: new Date(now.getTime() - 6 * 60 * 60 * 1000).toLocaleString(), // 6 hours ago
          isRead: true,
          action: 'Reply',
          data: {
            senderId: '789',
            senderName: 'Alex Johnson',
            message: 'Hi! I\'m on my way to your location. I\'ll be there in 10 minutes.'
          }
        },
        {
          id: '4',
          type: 'system',
          title: 'Payment Processed',
          message: 'Your payment of $100 has been processed for the booking with John Smith',
          time: new Date(now.getTime() - 12 * 60 * 60 * 1000).toLocaleString(), // 12 hours ago
          isRead: true,
          data: {
            type: 'payment_processed',
            amount: 100,
            sitterName: 'John Smith'
          }
        }
      ];
    }

    console.log(`📱 Created sample notifications for ${isPetSitter ? 'Pet Sitter' : 'Pet Owner'}:`, sampleNotifications.length);
    return sampleNotifications;
  }
}

export const notificationService = NotificationService.getInstance();