/**
 * Calendar utility functions for adding dates to Google Calendar
 */

/**
 * Generate a Google Calendar link for a date
 * @param {Object} dateData - The date object containing title, dateTime, notes, etc.
 * @returns {string} Google Calendar add event URL
 */
export function generateGoogleCalendarLink(dateData) {
  const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE'

  // Format date for Google Calendar (yyyyMMddTHHmmssZ)
  const startDate = new Date(dateData.dateTime)
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000) // Default 2 hours duration

  const formatGoogleDate = (date) => {
    return date.toISOString().replace(/-|:|\.\d{3}/g, '')
  }

  const params = new URLSearchParams({
    text: dateData.title || 'Date with Partner',
    dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
    details: dateData.notes || 'Scheduled date via SoulSync',
    location: '', // Can add location if you have that field
    // Add reminder: 1 hour before
    reminder: '60' // minutes before
  })

  return `${baseUrl}&${params.toString()}`
}

/**
 * Open Google Calendar to add event
 * @param {Object} dateData - The date object
 */
export function addToGoogleCalendar(dateData) {
  const calendarUrl = generateGoogleCalendarLink(dateData)
  window.open(calendarUrl, '_blank')
}

/**
 * Generate an iCal file content for download (works with Apple Calendar, Outlook, etc.)
 * @param {Object} dateData - The date object
 * @returns {string} iCal file content
 */
export function generateICalContent(dateData) {
  const startDate = new Date(dateData.dateTime)
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000) // 2 hours duration

  const formatICalDate = (date) => {
    return date.toISOString().replace(/-|:|\.\d{3}/g, '')
  }

  // Create VALARM for 1 hour reminder
  const alarm = [
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Date reminder',
    'END:VALARM'
  ].join('\r\n')

  const ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SoulSync//Date Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `DTSTART:${formatICalDate(startDate)}`,
    `DTEND:${formatICalDate(endDate)}`,
    `SUMMARY:${dateData.title || 'Date with Partner'}`,
    `DESCRIPTION:${dateData.notes || 'Scheduled date via SoulSync'}`,
    `UID:${dateData.id || Date.now()}@soulsync.app`,
    `DTSTAMP:${formatICalDate(new Date())}`,
    'STATUS:CONFIRMED',
    alarm,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n')

  return ical
}

/**
 * Download iCal file (works with all calendar apps)
 * @param {Object} dateData - The date object
 */
export function downloadICalFile(dateData) {
  const icalContent = generateICalContent(dateData)
  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `soulsync-date-${dateData.id || Date.now()}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}
