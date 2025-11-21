// Import Firebase functions
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCXrLouJDmjLlWeuIPMMfd0RJeR_Xqlboy",
  authDomain: "web-project-one.firebaseapp.com",
  projectId: "web-project-one", 
  storageBucket: "web-project-one.appspot.com",
  messagingSenderId: "123456789", // Replace with your actual sender ID
  appId: "your-app-id" // Replace with your actual app ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;