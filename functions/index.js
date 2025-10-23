const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * Trigger: When a new date is created
 * Action: Send notifications based on status (request or direct creation)
 */
exports.onDateCreated = functions.firestore
  .document('dates/{dateId}')
  .onCreate(async (snap, context) => {
    const dateData = snap.data();
    const dateId = context.params.dateId;

    try {
      // Get couple information
      const coupleDoc = await admin.firestore()
        .collection('couples')
        .doc(dateData.coupleCode)
        .get();

      if (!coupleDoc.exists) {
        console.error('Couple not found');
        return null;
      }

      const coupleData = coupleDoc.data();
      const users = coupleData.users || {};

      // Check if it's a date request (pending approval)
      if (dateData.status === 'pending') {
        // Send request notification only to the partner (not creator)
        const notifications = Object.entries(users)
          .filter(([userId]) => userId !== dateData.createdBy)
          .map(([userId, userInfo]) => {
            const emailPromise = sendDateNotification(
              userInfo.email,
              userInfo.name,
              dateData,
              'request'
            );
            const pushPromise = sendPushNotification(
              userInfo.fcmToken,
              dateData,
              'request'
            );
            return Promise.all([emailPromise, pushPromise]);
          });

        await Promise.all(notifications);
        console.log(`Date request notifications sent for date ${dateId}`);
      } else {
        // Regular date - send confirmation to both users
        const notifications = Object.entries(users).map(([userId, userInfo]) => {
          const emailPromise = sendDateNotification(
            userInfo.email,
            userInfo.name,
            dateData,
            'created'
          );
          const pushPromise = sendPushNotification(
            userInfo.fcmToken,
            dateData,
            'created'
          );
          return Promise.all([emailPromise, pushPromise]);
        });

        await Promise.all(notifications);
        console.log(`Date created notifications sent for date ${dateId}`);

        // Schedule reminder 1 hour before
        await scheduleReminder(dateId, dateData, users);
      }

      return null;
    } catch (error) {
      console.error('Error sending date created notifications:', error);
      return null;
    }
  });

/**
 * Trigger: When a date request is accepted or declined
 * Action: Notify the requester
 */
exports.onDateUpdated = functions.firestore
  .document('dates/{dateId}')
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    const dateId = context.params.dateId;

    try {
      // Check if request status changed from pending to accepted/declined
      if (beforeData.status === 'pending' && afterData.status !== 'pending') {
        // Get couple information
        const coupleDoc = await admin.firestore()
          .collection('couples')
          .doc(afterData.coupleCode)
          .get();

        if (!coupleDoc.exists) {
          console.error('Couple not found');
          return null;
        }

        const coupleData = coupleDoc.data();
        const users = coupleData.users || {};

        // Notify the original requester
        const requester = users[afterData.createdBy];
        if (requester) {
          const notificationType = afterData.status === 'scheduled' ? 'accepted' : 'declined';
          await Promise.all([
            sendDateNotification(
              requester.email,
              requester.name,
              afterData,
              notificationType
            ),
            sendPushNotification(
              requester.fcmToken,
              afterData,
              notificationType
            )
          ]);
          console.log(`Date ${notificationType} notification sent for date ${dateId}`);

          // If accepted, schedule reminder
          if (afterData.status === 'scheduled') {
            await scheduleReminder(dateId, afterData, users);
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error sending date update notifications:', error);
      return null;
    }
  });

/**
 * Scheduled function: Check for dates happening in 1 hour and send reminders
 * Run every 15 minutes
 */
exports.sendDateReminders = functions.pubsub
  .schedule('every 15 minutes')
  .onRun(async (context) => {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);

    try {
      // Find dates happening in the next hour that haven't been reminded
      const datesSnapshot = await admin.firestore()
        .collection('dates')
        .where('dateTime', '>=', now.toISOString())
        .where('dateTime', '<=', oneHourFromNow.toISOString())
        .where('status', '==', 'scheduled')
        .get();

      const reminderPromises = [];

      for (const doc of datesSnapshot.docs) {
        const dateData = doc.data();
        const dateId = doc.id;

        // Check if reminder already sent
        if (dateData.reminderSent) continue;

        // Get couple information
        const coupleDoc = await admin.firestore()
          .collection('couples')
          .doc(dateData.coupleCode)
          .get();

        if (!coupleDoc.exists) continue;

        const coupleData = coupleDoc.data();
        const users = coupleData.users || {};

        // Send reminders to both users
        Object.entries(users).forEach(([userId, userInfo]) => {
          reminderPromises.push(
            sendDateNotification(
              userInfo.email,
              userInfo.name,
              dateData,
              'reminder'
            )
          );
          reminderPromises.push(
            sendPushNotification(
              userInfo.fcmToken,
              dateData,
              'reminder'
            )
          );
        });

        // Mark reminder as sent
        reminderPromises.push(
          doc.ref.update({ reminderSent: true })
        );
      }

      await Promise.all(reminderPromises);
      console.log(`Sent ${reminderPromises.length / 3} date reminders`);

      return null;
    } catch (error) {
      console.error('Error sending date reminders:', error);
      return null;
    }
  });

/**
 * Helper function to send email notifications (not implemented)
 */
async function sendDateNotification(email, name, dateData, type) {
  // Email notifications not implemented - push notifications only
  return;
}

/**
 * Helper function to send push notifications via FCM
 */
async function sendPushNotification(fcmToken, dateData, type) {
  if (!fcmToken) {
    console.log('No FCM token available for user');
    return;
  }

  const dateTime = new Date(dateData.dateTime);
  const formattedDate = dateTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  let title, body;

  if (type === 'request') {
    title = `📬 Date Request from ${dateData.createdByName}`;
    body = `${dateData.title} • ${formattedDate}`;
  } else if (type === 'accepted') {
    title = `✅ Date Request Accepted!`;
    body = `${dateData.title} is confirmed for ${formattedDate}`;
  } else if (type === 'declined') {
    title = `Date Request Update`;
    body = `Your request for "${dateData.title}" couldn't be accepted`;
  } else if (type === 'created') {
    title = `💕 New Date Scheduled`;
    body = `${dateData.title} • ${formattedDate}`;
  } else if (type === 'reminder') {
    title = `⏰ Date in 1 Hour!`;
    body = `${dateData.title} is happening soon`;
  }

  const message = {
    token: fcmToken,
    notification: {
      title,
      body
    },
    data: {
      dateId: dateData.id || '',
      type: type,
      click_action: '/'
    },
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        priority: 'high',
        channelId: 'date_notifications'
      }
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1
        }
      }
    },
    webpush: {
      notification: {
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        requireInteraction: true,
        tag: `date-${dateData.id || 'notification'}`
      }
    }
  };

  try {
    await admin.messaging().send(message);
    console.log(`Push notification sent to token ${fcmToken.substring(0, 20)}...`);
  } catch (error) {
    console.error('Error sending push notification:', error);
    // Token might be invalid, but don't fail the entire operation
  }
}

/**
 * Helper function to schedule reminder (metadata only)
 */
async function scheduleReminder(dateId, dateData, users) {
  // The scheduled function will check for dates and send reminders
  // This is just for logging purposes
  console.log(`Reminder scheduled for date ${dateId}`);
  return null;
}
