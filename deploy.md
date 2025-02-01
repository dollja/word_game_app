# Prerequisites
Before starting, make sure you have: -
- ✅ A Google Cloud account (Sign up)
- ✅ -Google Cloud SDK installed (Install Guide)
- ✅ -A Firebase project set up (Firebase Console)
- ✅ The backend code with Firebase integration (from the previous step)

### Step 1: Set Up Google Cloud Project
1.1. Log in to Google Cloud
Run the following command in your terminal:

```python
gcloud auth login
```
This opens a browser window to authenticate your Google account.

#### 1.2. Set Your Google Cloud Project

```python
gcloud config set project word-game-app-449405
```
Replace YOUR_PROJECT_ID with your Google Cloud project ID.

#### 1.3. Enable Required Google Cloud APIs
Run these commands to enable necessary services:


```python
gcloud services enable run.googleapis.com firestore.googleapis.com
```
Cloud Run API → Allows deployment of containerized applications.
Firestore API → Enables interaction with the Firebase Firestore database.

### Step 2: Prepare the Backend for Deployment
2.1. Navigate to the Backend Directory
Ensure you're in the backend directory:

```python
cd word_game_app/backend
```

#### 2.2. Create a Firebase Admin Service Account
Google Cloud Run needs Firebase permissions to read and write data.

Go to the Firebase Console → Project Settings → Service accounts
Click Generate new private key (this downloads a .json file).
Move the file to your project directory:

```python
mv ~/Downloads/YOUR-FIREBASE-ADMIN-KEY.json ./firebase-admin-sdk.json
```
#### 2.3. Add Firebase Service Account to Environment Variables
Create an .env file in the backend directory:
```python

touch .env
```
Edit the .env file and add:

```python
makefile
GOOGLE_APPLICATION_CREDENTIALS=firebase-admin-sdk.json
PORT=8080
```
### Step 3: Deploy to Google Cloud Run
#### 3.1. Build a Docker Container
Google Cloud Run runs containerized applications. Create a Dockerfile:

```python
touch Dockerfile
```
Paste the following into the Dockerfile:

```# Use official Node.js image
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
# ENV GOOGLE_APPLICATION_CREDENTIALS=/usr/src/app/firebase-admin-sdk.json
ENV GOOGLE_APPLICATION_CREDENTIALS=/usr/src/app/word-game-fc90d-firebase-adminsdk-fbsvc-457781f2ce.json
# Expose port 8080 for Cloud Run
EXPOSE 8080

# Start the server
CMD ["node", "server.js"]
```

### Step 1: Build the Docker Image

```python
gcloud builds submit --tag gcr.io/word-game-app-449405/word-game-backend
```
Replace YOUR_PROJECT_ID with your Google Cloud project ID.

### Step 2: Deploy to Cloud Run

```python
gcloud run deploy word-game-backend \
  --image gcr.io/YOUR_PROJECT_ID/word-game-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
  
```
--image → Specifies the Docker image to deploy.
--platform managed → Deploys to fully managed Cloud Run.
--region us-central1 → Choose the region closest to your users.
--allow-unauthenticated → Allows anyone to access the game (you can restrict this later).
### Step 3: Get the Public URL
After deployment, Google Cloud Run provides a URL (e.g., https://word-game-backend-xyz.a.run.app). Copy this URL for use in the frontend.

### Step 4: Connect Frontend to the Deployed Backend
4.1. Update index.html
Open frontend/index.html and replace:
```python
const BACKEND_URL = "https://word-game-backend-xyz.a.run.app";
```
Replace word-game-backend-xyz.a.run.app with your actual Cloud Run URL.
#### 4.2. Deploy Frontend (Optional)
You can deploy the frontend using:

- Vercel (vercel deploy)
- Netlify (drag and drop index.html)
- Firebase Hosting (firebase deploy)

### Step 5: Verify Deployment
Open your backend URL (https://word-game-backend-xyz.a.run.app) in the browser → Should return a 404 or JSON response.
Run the game from the frontend and check if:
- Players can join.
- The game state persists across refreshes.
- Word submissions are validated via OpenAI.
- Player scores are stored in Firebase Firestore.

### Step 6: Secure API Keys
For security:

Restrict OpenAI API Key usage to your backend's IP.
Restrict Cloud Run access:
bash
Copy
Edit
gcloud run services update word-game-backend --no-allow-unauthenticated
Use Firebase Authentication if you want login-based access.