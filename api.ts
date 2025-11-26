
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  User 
} from "firebase/auth";
import { getDatabase, ref, onValue, push, update, remove, set } from "firebase/database";
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";

import { templates as initialTemplates } from './db';

// --- CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyBnsBscss_nBG1ITN5-8rl5kUIu8wQKtAY",
  authDomain: "temprl-8fb38.firebaseapp.com",
  databaseURL: "https://temprl-8fb38-default-rtdb.firebaseio.com",
  projectId: "temprl-8fb38",
  storageBucket: "temprl-8fb38.firebasestorage.app",
  messagingSenderId: "724982977717",
  appId: "1:724982977717:web:b1439f3864596263785afc",
  measurementId: "G-8M63Y757FR"
};

// --- INITIALIZATION ---
console.log("Initializing Firebase...");
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getDatabase(app);
const storage = getStorage(app);

// --- TYPES ---

export interface NewTemplateData {
  title: string;
  imageUrl: string;
  description: string;
  category: string;
  price: string;
  fileData?: string;
  fileName?: string;
  fileType?: string;
  externalLink?: string;
}

// Adapting Firebase User to our App's Session Interface
export type Session = {
  user: {
    id: string;
    email?: string;
    user_metadata: {
        avatar_url?: string;
        full_name?: string;
    };
  };
};

export type AuthChangeEvent = 'SIGNED_IN' | 'SIGNED_OUT';

export interface Template {
  id: string;
  title: string;
  author: string;
  imageUrl: string;
  likes: number;
  views: number;
  isLiked: boolean; // Note: isLiked is personalized, often handled on frontend or separate collection
  category: string;
  description: string;
  price: string;
  
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  status: 'approved' | 'pending' | 'rejected';
  sales: number;
  earnings: number;
}

// --- AUTHENTICATION ---

export const signInWithEmail = async (email: string, pass: string) => {
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        console.log("Email Sign In Successful");
    } catch (error: any) {
        console.error("Login failed:", error);
        throw error;
    }
}

export const signUpWithEmail = async (email: string, pass: string, name: string) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        // Update profile with name
        await updateProfile(userCredential.user, {
            displayName: name,
            photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
        });
        console.log("Sign Up Successful");
    } catch (error: any) {
        console.error("Signup failed:", error);
        throw error;
    }
}

export const signInWithGoogle = async () => {
    console.log("Attempting Google Sign In...");
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
        console.log("Google Sign In Successful");
    } catch (error: any) {
        console.error("Login failed:", error);
        alert(`Login failed: ${error.message}`);
    }
};

export const signOut = async () => {
    try {
        await firebaseSignOut(auth);
    } catch (error) {
        console.error("Sign out failed", error);
    }
};

export const onAuthStateChange = (callback: (event: AuthChangeEvent, session: Session | null) => void) => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
            const session: Session = {
                user: {
                    id: firebaseUser.uid,
                    email: firebaseUser.email || '',
                    user_metadata: {
                        avatar_url: firebaseUser.photoURL || '',
                        full_name: firebaseUser.displayName || 'User'
                    }
                }
            };
            callback('SIGNED_IN', session);
        } else {
            callback('SIGNED_OUT', null);
        }
    });

    return { data: { subscription: { unsubscribe } } };
};


// --- DATABASE & STORAGE OPERATIONS ---

export const uploadFile = async (file: File, path: string, onProgress?: (progress: number) => void): Promise<string> => {
    if (file.size === 0) {
        return Promise.reject(new Error("File is empty (0 bytes). Please select a valid file."));
    }

    return new Promise((resolve, reject) => {
        const sRef = storageRef(storage, path);
        
        // Setting Content-Type metadata helps avoid some browser interpretation issues
        const metadata = {
            contentType: file.type || 'application/octet-stream'
        };

        const uploadTask = uploadBytesResumable(sRef, file, metadata);

        let hasStarted = false;

        // Watchdog: If upload doesn't start (0%) within 20 seconds, assume CORS error or Auth issue.
        const watchdog = setTimeout(() => {
            if (!hasStarted) {
                uploadTask.cancel();
                console.error("Upload Timeout: Likely missing CORS configuration on Firebase Storage bucket.");
                reject(new Error("Upload timed out at 0%. This usually means 'CORS' is not configured on your Firebase Storage bucket."));
            }
        }, 20000);

        uploadTask.on('state_changed', 
            (snapshot) => {
                hasStarted = true;
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log(`Upload is ${progress}% done`);
                if (onProgress) onProgress(progress);
            }, 
            (error) => {
                clearTimeout(watchdog);
                console.error("Upload failed in API:", error);
                
                if (error.code === 'storage/unauthorized') {
                    reject(new Error("Permission denied. You must be logged in to upload."));
                } else if (error.code === 'storage/canceled') {
                    reject(new Error("Upload was canceled."));
                } else if (error.code === 'storage/retry-limit-exceeded') {
                    reject(new Error("Upload failed. Max retries exceeded. Check your connection."));
                } else {
                    reject(error);
                }
            }, 
            async () => {
                clearTimeout(watchdog);
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve(downloadURL);
                } catch (e) {
                    console.error("Failed to get download URL:", e);
                    reject(e);
                }
            }
        );
    });
};

/**
 * Listens for real-time updates to the templates data.
 */
export const listenForTemplates = (callback: (templates: Template[]) => void) => {
    const templatesRef = ref(db, 'templates');
    onValue(templatesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            // Convert object to array
            const loadedTemplates: Template[] = Object.entries(data).map(([key, value]: [string, any]) => ({
                id: key,
                ...value
            }));
            callback(loadedTemplates.reverse());
        } else {
            // If DB is empty, maybe seed it or return empty
            // For now, if empty, we might want to seed mock data for demo purposes
            // But usually, we just return empty.
            // Let's seed if completely empty for better first-run experience
            seedDatabaseIfEmpty();
            callback([]);
        }
    });
};

export const detachTemplatesListener = () => {
    // Firebase listeners are persistent, but we can off() if needed.
    // In this simple app, we mostly rely on React useEffect cleanup or just let it be.
};

const seedDatabaseIfEmpty = () => {
    const templatesRef = ref(db, 'templates');
    onValue(templatesRef, (snapshot) => {
        if (!snapshot.exists()) {
           // Seed initial data
           initialTemplates.forEach(t => {
               // We push without ID, let firebase generate one, or use existing IDs if we want to preserve them
               // Better to let firebase generate keys
               const { id, ...rest } = t;
               push(templatesRef, rest);
           });
        }
    }, { onlyOnce: true });
}


/**
 * Adds a new template to the database.
 */
export const addTemplate = async (templateData: NewTemplateData, user: Session['user']): Promise<void> => {
    const templatesRef = ref(db, 'templates');
    
    // File Handling: We use externalLink field to pass the file URL (whether external or uploaded)
    let finalFileUrl = '';
    if (templateData.externalLink) {
        finalFileUrl = templateData.externalLink;
    } else {
        // Fallback
        finalFileUrl = 'https://example.com/download-placeholder.zip';
    }

    const newTemplate = {
        title: templateData.title,
        imageUrl: templateData.imageUrl || 'https://picsum.photos/seed/placeholder/600/400',
        description: templateData.description,
        category: templateData.category,
        price: templateData.price,
        author: user.user_metadata?.full_name || 'Anonymous',
        
        likes: 0,
        views: 0,
        isLiked: false,
        status: 'pending',
        sales: 0,
        earnings: 0,
        fileUrl: finalFileUrl,
        fileName: templateData.fileName || 'External Link',
        fileType: templateData.fileType || 'link',
        createdAt: Date.now()
    };

    await push(templatesRef, newTemplate);
};

/**
 * Updates an existing template.
 */
export const updateTemplate = async (templateId: string, updates: Partial<Template>): Promise<void> => {
    const templateRef = ref(db, `templates/${templateId}`);
    await update(templateRef, updates);
};

/**
 * Delete a template.
 */
export const deleteTemplate = async (templateId: string): Promise<void> => {
    const templateRef = ref(db, `templates/${templateId}`);
    await remove(templateRef);
};
