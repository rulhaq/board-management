import { writable } from 'svelte/store';
import { db } from '$lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, where } from 'firebase/firestore';

export interface Meeting {
  id?: string;
  title: string;
  description: string;
  date: Date;
  startTime: string;
  endTime: string;
  location: string;
  meetingType: 'board' | 'committee' | 'special' | 'emergency';
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'postponed';
  agenda: AgendaItem[];
  attendees: Attendee[];
  requiredQuorum: number;
  actualAttendance?: number;
  minutes?: string;
  decisions?: Decision[];
  documents?: string[]; // Document IDs
  createdBy: string;
  createdAt: Date;
  lastModified: Date;
  isRecurring?: boolean;
  recurringPattern?: 'weekly' | 'monthly' | 'quarterly' | 'annually';
  meetingLink?: string;
  recordingUrl?: string;
}

export interface AgendaItem {
  id: string;
  title: string;
  description: string;
  duration: number; // minutes
  presenter: string;
  documents?: string[];
  order: number;
  status: 'pending' | 'in-progress' | 'completed' | 'deferred';
  notes?: string;
}

export interface Attendee {
  userId: string;
  name: string;
  role: string;
  status: 'invited' | 'accepted' | 'declined' | 'tentative' | 'attended' | 'absent';
  joinedAt?: Date;
  leftAt?: Date;
}

export interface Decision {
  id: string;
  title: string;
  description: string;
  type: 'resolution' | 'motion' | 'approval' | 'directive';
  proposedBy: string;
  votingResults?: {
    for: number;
    against: number;
    abstain: number;
    total: number;
  };
  status: 'proposed' | 'voting' | 'approved' | 'rejected' | 'deferred';
  implementationDate?: Date;
}

export const meetings = writable<Meeting[]>([]);
export const meetingsLoading = writable(false);

const COLLECTION_NAME = 'meetings';

export async function getMeetings(): Promise<Meeting[]> {
  if (!db) throw new Error('Database not initialized');
  
  meetingsLoading.set(true);
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    const meetingsList = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate() || new Date(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      lastModified: doc.data().lastModified?.toDate() || new Date(),
    })) as Meeting[];
    
    meetings.set(meetingsList);
    return meetingsList;
  } catch (error) {
    console.error('Error fetching meetings:', error);
    throw error;
  } finally {
    meetingsLoading.set(false);
  }
}

export async function getUpcomingMeetings(): Promise<Meeting[]> {
  if (!db) throw new Error('Database not initialized');
  
  try {
    const now = new Date();
    const q = query(
      collection(db, COLLECTION_NAME),
      where('date', '>=', now),
      orderBy('date', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate() || new Date(),
    })) as Meeting[];
  } catch (error) {
    console.error('Error fetching upcoming meetings:', error);
    throw error;
  }
}

export async function createMeeting(meetingData: Omit<Meeting, 'id' | 'createdAt' | 'lastModified'>): Promise<string> {
  if (!db) throw new Error('Database not initialized');
  
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...meetingData,
      createdAt: new Date(),
      lastModified: new Date(),
      status: 'scheduled'
    });
    
    // Refresh meetings list
    await getMeetings();
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating meeting:', error);
    throw error;
  }
}

export async function updateMeeting(id: string, updates: Partial<Meeting>): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...updates,
      lastModified: new Date()
    });
    
    // Refresh meetings list
    await getMeetings();
  } catch (error) {
    console.error('Error updating meeting:', error);
    throw error;
  }
}

export async function deleteMeeting(id: string): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    
    // Refresh meetings list
    await getMeetings();
  } catch (error) {
    console.error('Error deleting meeting:', error);
    throw error;
  }
}

export async function startMeeting(id: string): Promise<void> {
  await updateMeeting(id, {
    status: 'in-progress'
  });
}

export async function completeMeeting(id: string, minutes: string, decisions: Decision[]): Promise<void> {
  await updateMeeting(id, {
    status: 'completed',
    minutes,
    decisions
  });
} 