const functions = require('firebase-functions');
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');

admin.initializeApp();

// Initialize SendGrid with your API key
// Set this in Firebase Functions config: firebase functions:config:set sendgrid.key="YOUR_API_KEY"
const SENDGRID_API_KEY = functions.config().sendgrid?.key;
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

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
 * Helper function to send email notifications
 */
async function sendDateNotification(email, name, dateData, type) {
  if (!SENDGRID_API_KEY) {
    console.warn('SendGrid API key not configured. Skipping email notification.');
    return;
  }

  const dateTime = new Date(dateData.dateTime);
  const formattedDate = dateTime.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  let subject, text, html;

  if (type === 'request') {
    subject = `📬 Date Request from ${dateData.createdByName}: ${dateData.title}`;
    text = `Hi ${name},\n\n${dateData.createdByName} would like to schedule a date with you!\n\nTitle: ${dateData.title}\nDate & Time: ${formattedDate}\n${dateData.notes ? `\nMessage: ${dateData.notes}` : ''}\n\nLog in to accept or decline this request.\n\nWith love,\nSoulSync`;
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">📬 You Have a Date Request!</h2>
        <p>Hi ${name},</p>
        <p><strong>${dateData.createdByName}</strong> would like to schedule a date with you!</p>
        <div style="background: #fef3c7; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h3 style="margin-top: 0;">${dateData.title}</h3>
          <p><strong>📅 Date & Time:</strong> ${formattedDate}</p>
          ${dateData.notes ? `<p style="font-style: italic; color: #6b7280;">"${dateData.notes}"</p>` : ''}
        </div>
        <p>Log in to your app to <strong>accept or decline</strong> this request.</p>
        <p style="color: #6b7280; margin-top: 30px;">With love,<br>SoulSync</p>
      </div>
    `;
  } else if (type === 'accepted') {
    subject = `✅ Date Request Accepted: ${dateData.title}`;
    text = `Hi ${name},\n\nGreat news! Your date request has been accepted!\n\nTitle: ${dateData.title}\nDate & Time: ${formattedDate}\n\nYour partner is looking forward to it!\n\nWith love,\nSoulSync`;
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">✅ Date Request Accepted!</h2>
        <p>Hi ${name},</p>
        <p>Great news! Your date request has been <strong>accepted</strong>!</p>
        <div style="background: #d1fae5; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #10b981;">
          <h3 style="margin-top: 0;">${dateData.title}</h3>
          <p><strong>📅 Date & Time:</strong> ${formattedDate}</p>
        </div>
        <p>Your partner is looking forward to spending quality time with you!</p>
        <p style="color: #6b7280; margin-top: 30px;">With love,<br>SoulSync</p>
      </div>
    `;
  } else if (type === 'declined') {
    subject = `Date Request Update: ${dateData.title}`;
    text = `Hi ${name},\n\nYour date request couldn't be accepted this time.\n\nTitle: ${dateData.title}\nDate & Time: ${formattedDate}\n${dateData.declineReason ? `\nReason: ${dateData.declineReason}` : ''}\n\nDon't worry - try suggesting another time that works better!\n\nWith love,\nSoulSync`;
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6b7280;">Date Request Update</h2>
        <p>Hi ${name},</p>
        <p>Your date request couldn't be accepted this time.</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #6b7280;">
          <h3 style="margin-top: 0;">${dateData.title}</h3>
          <p><strong>📅 Proposed Time:</strong> ${formattedDate}</p>
          ${dateData.declineReason ? `<p style="font-style: italic; color: #6b7280;"><strong>Reason:</strong> ${dateData.declineReason}</p>` : ''}
        </div>
        <p>Don't worry - try suggesting another time that works better for both of you!</p>
        <p style="color: #6b7280; margin-top: 30px;">With love,<br>SoulSync</p>
      </div>
    `;
  } else if (type === 'created') {
    subject = `💕 New Date Scheduled: ${dateData.title}`;
    text = `Hi ${name},\n\nA new date has been scheduled!\n\nTitle: ${dateData.title}\nDate & Time: ${formattedDate}\n\nLog in to see more details.\n\nWith love,\nSoulSync`;
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #a855f7;">💕 New Date Scheduled</h2>
        <p>Hi ${name},</p>
        <p>A new date has been scheduled!</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${dateData.title}</h3>
          <p><strong>📅 Date & Time:</strong> ${formattedDate}</p>
        </div>
        <p>Log in to see more details and get ready for quality time together!</p>
        <p style="color: #6b7280; margin-top: 30px;">With love,<br>SoulSync</p>
      </div>
    `;
  } else if (type === 'reminder') {
    subject = `⏰ Reminder: Your date is in 1 hour!`;
    text = `Hi ${name},\n\nYour date "${dateData.title}" is happening in about 1 hour!\n\nDate & Time: ${formattedDate}\n\nGet ready to connect with your partner!\n\nWith love,\nSoulSync`;
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #a855f7;">⏰ Date Reminder</h2>
        <p>Hi ${name},</p>
        <p>Your date is happening in about <strong>1 hour</strong>!</p>
        <div style="background: #fef3c7; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h3 style="margin-top: 0;">${dateData.title}</h3>
          <p><strong>📅 Date & Time:</strong> ${formattedDate}</p>
        </div>
        <p>Get ready to connect with your partner and make beautiful memories!</p>
        <p style="color: #6b7280; margin-top: 30px;">With love,<br>SoulSync</p>
      </div>
    `;
  }

  const msg = {
    to: email,
    from: 'noreply@soulsync.app', // Change this to your verified sender
    subject,
    text,
    html
  };

  try {
    await sgMail.send(msg);
    console.log(`Email sent to ${email}`);
  } catch (error) {
    console.error('Error sending email:', error);
    if (error.response) {
      console.error(error.response.body);
    }
  }
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
