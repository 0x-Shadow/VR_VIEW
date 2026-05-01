# 360 Drone VR Viewer 🚁

A sleek, web-based 360-degree panoramic image and video viewer, built specifically for DJI Mini 4K drone footage.

## Features ✨
- **Universal Support**: Seamlessly upload both 360 images (`.jpg`, `.png`) and 360 videos (`.mp4`, `.webm`).
- **Mobile VR Ready**: Fully supports mobile device orientation—just move your phone to look around! (Requires HTTPS).
- **Premium UI**: Features a modern, glassmorphic dark-mode interface with smooth animations.
- **Privacy First**: Everything runs completely locally in your browser. No files are ever uploaded to a server.

## How it Works 🛠️
Built using Vanilla HTML/CSS/JS and the powerful **A-Frame** WebVR library. 
- It uses `FileReader` and `ObjectURLs` to map your local files onto a 3D sphere (`<a-sky>` and `<a-videosphere>`).
- It specifically handles iOS 13+ strict gyroscope permissions with a custom "Enable Motion Controls" prompt.

## Setup & Testing Locally 💻
You can test this application locally by running any standard HTTP server:
```bash
npx serve -p 8080
```
*Note: To test the gyroscope on your mobile device, the site must be served over HTTPS.*

---
*Created for seamless viewing of DJI drone panoramas.*
