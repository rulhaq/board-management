import { writable } from 'svelte/store';
import { db } from '$lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, where } from 'firebase/firestore';

export interface Document {
  id?: string;
  title: string;
  description: string;
  category: 'financial' | 'strategic' | 'operational' | 'legal' | 'quality' | 'compliance';
  confidentialityLevel: 'public' | 'restricted' | 'confidential' | 'top-secret';
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  uploadedBy: string;
  uploadedAt: Date;
  lastModified: Date;
  tags: string[];
  version: number;
  status: 'draft' | 'review' | 'approved' | 'archived';
  reviewers?: string[];
  approvedBy?: string;
  approvedAt?: Date;
}

export const documents = writable<Document[]>([]);
export const documentsLoading = writable(false);

const COLLECTION_NAME = 'documents';

export async function getDocuments(): Promise<Document[]> {
  if (!db) throw new Error('Database not initialized');
  
  documentsLoading.set(true);
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('uploadedAt', 'desc'));
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      uploadedAt: doc.data().uploadedAt?.toDate() || new Date(),
      lastModified: doc.data().lastModified?.toDate() || new Date(),
      approvedAt: doc.data().approvedAt?.toDate() || null,
    })) as Document[];
    
    documents.set(docs);
    return docs;
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw error;
  } finally {
    documentsLoading.set(false);
  }
}

export async function getDocumentsByCategory(category: string): Promise<Document[]> {
  if (!db) throw new Error('Database not initialized');
  
  try {
    const q = query(
      collection(db, COLLECTION_NAME), 
      where('category', '==', category),
      orderBy('uploadedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      uploadedAt: doc.data().uploadedAt?.toDate() || new Date(),
      lastModified: doc.data().lastModified?.toDate() || new Date(),
    })) as Document[];
  } catch (error) {
    console.error('Error fetching documents by category:', error);
    throw error;
  }
}

export async function createDocument(documentData: Omit<Document, 'id' | 'uploadedAt' | 'lastModified' | 'version'>): Promise<string> {
  if (!db) throw new Error('Database not initialized');
  
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...documentData,
      uploadedAt: new Date(),
      lastModified: new Date(),
      version: 1,
      status: 'draft'
    });
    
    // Refresh documents list
    await getDocuments();
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating document:', error);
    throw error;
  }
}

export async function updateDocument(id: string, updates: Partial<Document>): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...updates,
      lastModified: new Date()
    });
    
    // Refresh documents list
    await getDocuments();
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
}

export async function deleteDocument(id: string): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    
    // Refresh documents list
    await getDocuments();
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
}

export async function approveDocument(id: string, approvedBy: string): Promise<void> {
  await updateDocument(id, {
    status: 'approved',
    approvedBy,
    approvedAt: new Date()
  });
}

export async function archiveDocument(id: string): Promise<void> {
  await updateDocument(id, {
    status: 'archived'
  });
} 