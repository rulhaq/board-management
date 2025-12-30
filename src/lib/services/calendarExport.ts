/**
 * Calendar Export Service
 * Exports meetings to Outlook and Google Calendar formats
 */

export interface CalendarEvent {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  url?: string;
  organizer?: {
    name: string;
    email: string;
  };
  attendees?: Array<{
    name: string;
    email: string;
  }>;
}

export class CalendarExportService {
  /**
   * Generate Outlook Calendar (.ics) file
   */
  generateICS(event: CalendarEvent): string {
    const formatDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const escapeText = (text: string): string => {
      return text
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n');
    };

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Board Governance AI//Calendar Export//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${Date.now()}@boardgovernance.ai`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${formatDate(event.startDate)}`,
      `DTEND:${formatDate(event.endDate)}`,
      `SUMMARY:${escapeText(event.title)}`,
      `DESCRIPTION:${escapeText(event.description)}`,
      event.location ? `LOCATION:${escapeText(event.location)}` : '',
      event.url ? `URL:${event.url}` : '',
      event.organizer ? `ORGANIZER;CN=${escapeText(event.organizer.name)}:MAILTO:${event.organizer.email}` : '',
      ...(event.attendees || []).map(attendee => 
        `ATTENDEE;CN=${escapeText(attendee.name)}:MAILTO:${attendee.email}`
      ),
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(line => line).join('\r\n');

    return ics;
  }

  /**
   * Generate Google Calendar URL
   */
  generateGoogleCalendarURL(event: CalendarEvent): string {
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${this.formatGoogleDate(event.startDate)}/${this.formatGoogleDate(event.endDate)}`,
      details: event.description,
      location: event.location || '',
      sf: 'true',
      output: 'xml'
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  /**
   * Format date for Google Calendar (YYYYMMDDTHHmmssZ)
   */
  private formatGoogleDate(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
  }

  /**
   * Download ICS file
   */
  downloadICS(event: CalendarEvent, filename?: string): void {
    const icsContent = this.generateICS(event);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `${event.title.replace(/[^a-z0-9]/gi, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Open Google Calendar in new window
   */
  openGoogleCalendar(event: CalendarEvent): void {
    const url = this.generateGoogleCalendarURL(event);
    window.open(url, '_blank');
  }
}

export const calendarExport = new CalendarExportService();

