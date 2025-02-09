# **Word Association Game**

## **Overview**
The Word Association Game is a multiplayer online game where players take turns submitting words that are logically associated with the previous word. The game uses OpenAI's GPT model to validate word associations and ensure fair gameplay. 

### **Game Rules**
1. Players must enter a valid OpenAI API key to start.
2. The game begins with an initial word generated by the AI.
3. Each player submits a word that is logically associated with the previous word.
4. The AI validates word associations before accepting the new word.
5. Players earn **10 points** for each valid word submission.
6. The game continues indefinitely until players decide to stop.

---

## **Folder Structure**
The application is organized into a **backend** and **frontend** structure:

```
word_game_app/
│── backend/                 # Server-side code
│   ├── server.js            # Express.js and Socket.IO backend
│   ├── package.json         # Backend dependencies
│── frontend/                # Client-side code
│   ├── index.html           # Main game interface
│── README.md                # Documentation
```

---

## **Dependencies**
### **Backend (Node.js)**
- `express` - Web framework for handling API requests.
- `socket.io` - Enables real-time multiplayer communication.
- `body-parser` - Parses incoming API requests.
- `node-fetch` - Fetches data from OpenAI's API.

### **Frontend**
- **TailwindCSS** - For UI styling.
- **Socket.IO Client** - For real-time updates.

---

## **Installation and Running the App Locally**
### **1. Clone the Repository**
```bash
git clone https://github.com/your-username/word-game-app.git
cd word-game-app
```
### **2. Install Backend Dependencies**
```bash
cd backend
npm install
```

### **3. Start the Backend Server**
```bash
npm start
```

### **4. Serve the Frontend**
Use a static server like `http-server`:
```bash
cd ../frontend
npx http-server
```

### **5. Open the Game**
Visit the provided URL from `http-server` in your browser.

---
# **Deploy Backend on Google Cloud Run with Firebase**

This guide walks through deploying the backend of the Word Association Game on Google Cloud Run with Firebase Firestore for persistent game storage.

---

## **Prerequisites**
Before starting, make sure you have:
✅ **A Google Cloud account** ([Sign up](https://cloud.google.com/))  
✅ **Google Cloud SDK installed** ([Install Guide](https://cloud.google.com/sdk/docs/install))  
✅ **A Firebase project set up** ([Firebase Console](https://console.firebase.google.com/))  
✅ **The backend code with Firebase integration** (from the previous step)  

---

## **Step 1: Set Up Google Cloud Project**
### **1.1. Log in to Google Cloud**
Run the following command in your terminal:
```bash
gcloud auth login
```
This opens a browser window to authenticate your Google account.

### **1.2. Set Your Google Cloud Project**
```bash
gcloud config set project YOUR_PROJECT_ID
```
Replace `YOUR_PROJECT_ID` with your **Google Cloud project ID**.

### **1.3. Enable Required Google Cloud APIs**
Run these commands to enable necessary services:
```bash
gcloud services enable run.googleapis.com firestore.googleapis.com
```
- **Cloud Run API** → Allows deployment of containerized applications.
- **Firestore API** → Enables interaction with the Firebase Firestore database.

---

## **Step 2: Prepare the Backend for Deployment**
### **2.1. Navigate to the Backend Directory**
Ensure you're in the backend directory:
```bash
cd word_game_app/backend
```

### **2.2. Create a Firebase Admin Service Account**
Google Cloud Run needs Firebase permissions to read and write data.  
1. Go to the **Firebase Console → Project Settings → Service accounts**  
2. Click **Generate new private key** (this downloads a `.json` file).  
3. Move the file to your project directory:
   ```bash
   mv ~/Downloads/YOUR-FIREBASE-ADMIN-KEY.json ./firebase-admin-sdk.json
   ```

### **2.3. Add Firebase Service Account to Environment Variables**
Create an `.env` file in the backend directory:
```bash
touch .env
```
Edit the `.env` file and add:
```
GOOGLE_APPLICATION_CREDENTIALS=firebase-admin-sdk.json
PORT=8080
```

---

## **Step 3: Deploy to Google Cloud Run**
### **3.1. Build a Docker Container**
Google Cloud Run runs containerized applications. Create a `Dockerfile`:
```bash
touch Dockerfile
```
Paste the following into the `Dockerfile`:
```dockerfile
# Use official Node.js image
FROM node:18

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy all backend files
COPY . .

# Set environment variables
ENV PORT=8080
ENV GOOGLE_APPLICATION_CREDENTIALS=/usr/src/app/firebase-admin-sdk.json

# Expose port 8080 for Cloud Run
EXPOSE 8080

# Start the server
CMD ["node", "server.js"]
```

---

### **3.2. Build and Push the Container to Google Cloud**
#### **Step 1: Build the Docker Image**
```bash
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/word-game-backend
```
Replace `YOUR_PROJECT_ID` with your Google Cloud project ID.

#### **Step 2: Deploy to Cloud Run**
```bash
gcloud run deploy word-game-backend \
  --image gcr.io/YOUR_PROJECT_ID/word-game-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```
- **`--image`** → Specifies the Docker image to deploy.
- **`--platform managed`** → Deploys to **fully managed Cloud Run**.
- **`--region us-central1`** → Choose the region closest to your users.
- **`--allow-unauthenticated`** → Allows anyone to access the game (you can restrict this later).

#### **Step 3: Get the Public URL**
After deployment, Google Cloud Run provides a URL (e.g., `https://word-game-backend-xyz.a.run.app`).
Copy this URL for use in the frontend.

---

## **Step 4: Connect Frontend to the Deployed Backend**
### **4.1. Update `index.html`**
Open `frontend/index.html` and replace:
```javascript
const BACKEND_URL = "https://word-game-backend-xyz.a.run.app";
```
Replace `word-game-backend-xyz.a.run.app` with your actual Cloud Run URL.

### **4.2. Deploy Frontend (Optional)**
You can deploy the frontend using:
- **Vercel** (`vercel deploy`)
- **Netlify** (drag and drop `index.html`)
- **Firebase Hosting** (`firebase deploy`)

---

## **Step 5: Verify Deployment**
1. Open your backend URL (`https://word-game-backend-xyz.a.run.app`) in the browser → Should return a 404 or JSON response.
2. Run the game from the frontend and check if:
   - Players can join.
   - The game state persists across refreshes.
   - Word submissions are validated via OpenAI.
   - Player scores are stored in Firebase Firestore.

---

## **Step 6: Secure API Keys**
For security:
1. **Restrict OpenAI API Key usage** to your backend's IP.
2. **Restrict Cloud Run access**:
   ```bash
   gcloud run services update word-game-backend --no-allow-unauthenticated
   ```
3. **Use Firebase Authentication** if you want login-based access.
=======
update for Google Cloud services
  
---
