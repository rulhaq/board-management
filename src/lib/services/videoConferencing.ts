import { authStore } from '$lib/stores/auth';
import { get } from 'svelte/store';

export interface VideoConferenceConfig {
  platform: 'teams' | 'zoom' | 'google_meet';
  meetingId?: string;
  joinUrl?: string;
  startTime: string;
  endTime: string;
  title: string;
  description?: string;
  attendees: string[];
  recordingEnabled?: boolean;
  waitingRoomEnabled?: boolean;
  chatEnabled?: boolean;
}

export interface VideoConferenceMeeting {
  id: string;
  platform: 'teams' | 'zoom' | 'google_meet';
  meetingId: string;
  joinUrl: string;
  hostUrl?: string;
  password?: string;
  dialInNumbers?: Array<{
    country: string;
    number: string;
  }>;
  recordingUrl?: string;
  status: 'scheduled' | 'active' | 'ended' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

class VideoConferencingService {
  private baseUrl = '/api/video-conference';

  // Microsoft Teams Integration
  async createTeamsMeeting(config: VideoConferenceConfig): Promise<VideoConferenceMeeting> {
    const userProfile = get(authStore.userProfile);
    if (!userProfile) throw new Error('User not authenticated');

    try {
      const response = await fetch(`${this.baseUrl}/teams/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          subject: config.title,
          body: {
            contentType: 'HTML',
            content: config.description || `Board meeting scheduled by ${userProfile.displayName}`
          },
          start: {
            dateTime: config.startTime,
            timeZone: 'Asia/Qatar'
          },
          end: {
            dateTime: config.endTime,
            timeZone: 'Asia/Qatar'
          },
          attendees: config.attendees.map(email => ({
            emailAddress: { address: email, name: email },
            type: 'required'
          })),
          isOnlineMeeting: true,
          onlineMeetingProvider: 'teamsForBusiness',
          allowNewTimeProposals: false,
          recordAutomatically: config.recordingEnabled || false
        })
      });

      if (!response.ok) {
        throw new Error(`Teams API error: ${response.statusText}`);
      }

      const meeting = await response.json();
      
      return {
        id: meeting.id,
        platform: 'teams',
        meetingId: meeting.onlineMeeting?.conferenceId || meeting.id,
        joinUrl: meeting.onlineMeeting?.joinUrl || meeting.webLink,
        hostUrl: meeting.onlineMeeting?.joinUrl,
        password: meeting.onlineMeeting?.tollNumber,
        dialInNumbers: meeting.onlineMeeting?.dialinUrl ? [
          { country: 'Qatar', number: '+974 4003 3333' }
        ] : [],
        status: 'scheduled',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error creating Teams meeting:', error);
      throw new Error('Failed to create Teams meeting');
    }
  }

  // Zoom Integration
  async createZoomMeeting(config: VideoConferenceConfig): Promise<VideoConferenceMeeting> {
    const userProfile = get(authStore.userProfile);
    if (!userProfile) throw new Error('User not authenticated');

    try {
      const response = await fetch(`${this.baseUrl}/zoom/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          topic: config.title,
          type: 2, // Scheduled meeting
          start_time: config.startTime,
          duration: this.calculateDuration(config.startTime, config.endTime),
          timezone: 'Asia/Qatar',
          agenda: config.description,
          settings: {
            host_video: true,
            participant_video: true,
            cn_meeting: false,
            in_meeting: false,
            join_before_host: false,
            mute_upon_entry: true,
            watermark: false,
            use_pmi: false,
            approval_type: 2, // Manual approval
            audio: 'both',
            auto_recording: config.recordingEnabled ? 'cloud' : 'none',
            enforce_login: true,
            enforce_login_domains: 'boardgovernance.ai',
            alternative_hosts: config.attendees.join(','),
            close_registration: false,
            show_share_button: true,
            allow_multiple_devices: true,
            registrants_confirmation_email: true,
            waiting_room: config.waitingRoomEnabled !== false,
            registrants_email_notification: true,
            meeting_authentication: true,
            encryption_type: 'enhanced_encryption'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Zoom API error: ${response.statusText}`);
      }

      const meeting = await response.json();
      
      return {
        id: meeting.uuid,
        platform: 'zoom',
        meetingId: meeting.id.toString(),
        joinUrl: meeting.join_url,
        hostUrl: meeting.start_url,
        password: meeting.password,
        dialInNumbers: meeting.settings?.global_dial_in_countries?.map((country: any) => ({
          country: country.country_name,
          number: country.number
        })) || [],
        status: 'scheduled',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error creating Zoom meeting:', error);
      throw new Error('Failed to create Zoom meeting');
    }
  }

  // Google Meet Integration
  async createGoogleMeetMeeting(config: VideoConferenceConfig): Promise<VideoConferenceMeeting> {
    const userProfile = get(authStore.userProfile);
    if (!userProfile) throw new Error('User not authenticated');

    try {
      const response = await fetch(`${this.baseUrl}/google-meet/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          summary: config.title,
          description: config.description,
          start: {
            dateTime: config.startTime,
            timeZone: 'Asia/Qatar'
          },
          end: {
            dateTime: config.endTime,
            timeZone: 'Asia/Qatar'
          },
          attendees: config.attendees.map(email => ({
            email,
            responseStatus: 'needsAction'
          })),
          conferenceData: {
            createRequest: {
              requestId: this.generateRequestId(),
              conferenceSolutionKey: {
                type: 'hangoutsMeet'
              }
            }
          },
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'email', minutes: 24 * 60 },
              { method: 'popup', minutes: 10 }
            ]
          },
          guestsCanInviteOthers: false,
          guestsCanModify: false,
          guestsCanSeeOtherGuests: true
        })
      });

      if (!response.ok) {
        throw new Error(`Google Meet API error: ${response.statusText}`);
      }

      const meeting = await response.json();
      const conferenceData = meeting.conferenceData;
      
      return {
        id: meeting.id,
        platform: 'google_meet',
        meetingId: conferenceData?.conferenceId || meeting.id,
        joinUrl: conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === 'video')?.uri || meeting.hangoutLink,
        hostUrl: conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === 'video')?.uri,
        password: conferenceData?.conferenceSolution?.key?.type,
        dialInNumbers: conferenceData?.entryPoints?.filter((ep: any) => ep.entryPointType === 'phone')?.map((ep: any) => ({
          country: ep.regionCode || 'QA',
          number: ep.uri?.replace('tel:', '') || '+974 4003 3333'
        })) || [],
        status: 'scheduled',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error creating Google Meet meeting:', error);
      throw new Error('Failed to create Google Meet meeting');
    }
  }

  // Universal meeting creation based on user preference
  async createMeeting(config: VideoConferenceConfig): Promise<VideoConferenceMeeting> {
    const userProfile = get(authStore.userProfile);
    const preferredPlatform = config.platform || userProfile?.preferences.videoConferencing.preferred || 'teams';

    switch (preferredPlatform) {
      case 'teams':
        return this.createTeamsMeeting({ ...config, platform: 'teams' });
      case 'zoom':
        return this.createZoomMeeting({ ...config, platform: 'zoom' });
      case 'google_meet':
        return this.createGoogleMeetMeeting({ ...config, platform: 'google_meet' });
      default:
        throw new Error(`Unsupported platform: ${preferredPlatform}`);
    }
  }

  // Update meeting
  async updateMeeting(meetingId: string, platform: string, updates: Partial<VideoConferenceConfig>): Promise<VideoConferenceMeeting> {
    try {
      const response = await fetch(`${this.baseUrl}/${platform}/${meetingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`Failed to update ${platform} meeting`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating meeting:', error);
      throw new Error('Failed to update meeting');
    }
  }

  // Cancel meeting
  async cancelMeeting(meetingId: string, platform: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${platform}/${meetingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to cancel ${platform} meeting`);
      }
    } catch (error) {
      console.error('Error canceling meeting:', error);
      throw new Error('Failed to cancel meeting');
    }
  }

  // Get meeting details
  async getMeeting(meetingId: string, platform: string): Promise<VideoConferenceMeeting> {
    try {
      const response = await fetch(`${this.baseUrl}/${platform}/${meetingId}`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get ${platform} meeting`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting meeting:', error);
      throw new Error('Failed to get meeting details');
    }
  }

  // Join meeting (opens in new window/tab)
  joinMeeting(meeting: VideoConferenceMeeting): void {
    const userProfile = get(authStore.userProfile);
    
    // Log meeting join for audit purposes
    this.logMeetingActivity(meeting.id, 'join', userProfile?.email || 'unknown');

    // Open meeting in new window
    const features = 'width=1200,height=800,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=yes,menubar=yes';
    window.open(meeting.joinUrl, `meeting_${meeting.id}`, features);
  }

  // Start recording (for hosts)
  async startRecording(meetingId: string, platform: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${platform}/${meetingId}/recording/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to start recording for ${platform} meeting`);
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      throw new Error('Failed to start recording');
    }
  }

  // Stop recording
  async stopRecording(meetingId: string, platform: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${platform}/${meetingId}/recording/stop`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to stop recording for ${platform} meeting`);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      throw new Error('Failed to stop recording');
    }
  }

  // Get meeting recordings
  async getMeetingRecordings(meetingId: string, platform: string): Promise<Array<{
    id: string;
    downloadUrl: string;
    playUrl: string;
    fileType: string;
    recordingStart: string;
    recordingEnd: string;
    fileSize: number;
  }>> {
    try {
      const response = await fetch(`${this.baseUrl}/${platform}/${meetingId}/recordings`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get recordings for ${platform} meeting`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting recordings:', error);
      throw new Error('Failed to get meeting recordings');
    }
  }

  // Utility functions
  private async getAuthToken(): Promise<string> {
    const user = get(authStore.user);
    if (!user) throw new Error('User not authenticated');
    return await user.getIdToken();
  }

  private calculateDuration(startTime: string, endTime: string): number {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // Duration in minutes
  }

  private generateRequestId(): string {
    return `board-governance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async logMeetingActivity(meetingId: string, action: string, userEmail: string): Promise<void> {
    try {
      await fetch('/api/audit-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          event: 'meeting_activity',
          action,
          resource: `meeting:${meetingId}`,
          userEmail,
          timestamp: new Date().toISOString(),
          metadata: { meetingId, action }
        })
      });
    } catch (error) {
      console.error('Error logging meeting activity:', error);
    }
  }

  // Platform-specific utilities
  getDialInInstructions(meeting: VideoConferenceMeeting): string {
    const instructions = [
      `Join ${meeting.platform.toUpperCase()} Meeting`,
      `Meeting ID: ${meeting.meetingId}`,
      ''
    ];

    if (meeting.password) {
      instructions.push(`Password: ${meeting.password}`);
      instructions.push('');
    }

    instructions.push('Join by computer:');
    instructions.push(meeting.joinUrl);
    instructions.push('');

    if (meeting.dialInNumbers && meeting.dialInNumbers.length > 0) {
      instructions.push('Join by phone:');
      meeting.dialInNumbers.forEach(dialIn => {
        instructions.push(`${dialIn.country}: ${dialIn.number}`);
      });
    }

    return instructions.join('\n');
  }

  getPlatformCapabilities(platform: string): {
    maxParticipants: number;
    recordingSupported: boolean;
    waitingRoomSupported: boolean;
    chatSupported: boolean;
    screenShareSupported: boolean;
    breakoutRoomsSupported: boolean;
  } {
    const capabilities = {
      teams: {
        maxParticipants: 1000,
        recordingSupported: true,
        waitingRoomSupported: true,
        chatSupported: true,
        screenShareSupported: true,
        breakoutRoomsSupported: true
      },
      zoom: {
        maxParticipants: 500,
        recordingSupported: true,
        waitingRoomSupported: true,
        chatSupported: true,
        screenShareSupported: true,
        breakoutRoomsSupported: true
      },
      google_meet: {
        maxParticipants: 250,
        recordingSupported: true,
        waitingRoomSupported: false,
        chatSupported: true,
        screenShareSupported: true,
        breakoutRoomsSupported: true
      }
    };

    return capabilities[platform as keyof typeof capabilities] || capabilities.teams;
  }
}

export const videoConferencingService = new VideoConferencingService(); 