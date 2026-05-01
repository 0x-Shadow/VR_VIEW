document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById('file-input');
    const uploadContainer = document.getElementById('upload-container');
    const gyroOverlay = document.getElementById('gyro-overlay');
    const viewerContainer = document.getElementById('viewer-container');
    const sceneWrapper = document.getElementById('scene-wrapper');
    const closeBtn = document.getElementById('close-viewer-btn');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const enableGyroBtn = document.getElementById('enable-gyro-btn');
    const skipGyroBtn = document.getElementById('skip-gyro-btn');
    const dropZone = document.getElementById('drop-zone');

    let objectURL = null;
    let videoElement = null;

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Detect video by MIME type or file extension (some OS/cameras don't set MIME type)
        const isVideo = file.type.startsWith('video/') || 
                        file.name.toLowerCase().match(/\.(mp4|mov|mkv|webm)$/i);
        
        window.uploadedFileType = isVideo ? 'video/mp4' : 'image/jpeg';

        if (isVideo) {
            window.uploadedFileUrl = URL.createObjectURL(file);
            proceedWithUpload();
        } else {
            // Using ObjectURL instead of DataURL to preserve pure 4K/8K image quality without Base64 compression
            window.uploadedFileUrl = URL.createObjectURL(file);
            proceedWithUpload();
        }

        function proceedWithUpload() {
            uploadContainer.classList.remove('active');
            if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
                gyroOverlay.classList.add('active');
            } else {
                showViewer();
            }
        }
    });

    // Drag and Drop UI Effects
    if (dropZone) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
        });
    }

    enableGyroBtn.addEventListener('click', () => {
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
                .then(permissionState => {
                    if (permissionState === 'granted') {
                        showViewer();
                    } else {
                        alert('Gyroscope permission denied. You can still swipe to look around.');
                        showViewer();
                    }
                })
                .catch(console.error);
        } else {
            showViewer();
        }
    });

    skipGyroBtn.addEventListener('click', () => {
        showViewer();
    });

    fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                // Force lock the screen to horizontal (landscape) to prevent reloading
                if (screen.orientation && screen.orientation.lock) {
                    screen.orientation.lock("landscape").catch(err => {
                        console.log('Orientation lock failed:', err);
                    });
                }
            }).catch(err => {
                console.log(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    });

    closeBtn.addEventListener('click', () => {
        if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen();
        }
        viewerContainer.classList.remove('active');
        uploadContainer.classList.add('active');
        sceneWrapper.innerHTML = ''; 
        if (videoElement) {
            videoElement.pause();
            videoElement.removeAttribute('src');
            videoElement.load();
            videoElement.remove();
            videoElement = null;
        }
        if (window.uploadedFileUrl) {
            URL.revokeObjectURL(window.uploadedFileUrl);
        }
        window.uploadedFileUrl = null;
        window.uploadedFileType = null;
        fileInput.value = '';
    });

    function showViewer() {
        gyroOverlay.classList.remove('active');
        viewerContainer.classList.add('active');
        
        if (window.uploadedFileType && window.uploadedFileType.startsWith('video/')) {
            // Setup for 360 video - Create element directly to ensure A-Frame maps it properly
            videoElement = document.createElement('video');
            videoElement.id = 'pano-video';
            videoElement.autoplay = true;
            videoElement.loop = true;
            videoElement.playsInline = true;
            videoElement.webkitPlaysInline = true;
            videoElement.crossOrigin = 'anonymous';
            videoElement.src = window.uploadedFileUrl;
            videoElement.style.display = 'none'; // Hide the raw element
            document.body.appendChild(videoElement);

            sceneWrapper.innerHTML = `
                <a-scene embedded renderer="antialias: true; colorManagement: true; highRefreshRate: true;" style="width: 100%; height: 100%;">
                    <!-- Segments increased to 128x64 for smoother 4K texture wrapping -->
                    <a-videosphere src="#pano-video" segments-width="128" segments-height="64"></a-videosphere>
                    <a-entity camera look-controls></a-entity>
                </a-scene>
            `;
            
            // Trigger playback specifically since mobile often blocks autoplay
            setTimeout(() => {
                if (videoElement) {
                    videoElement.play().catch(e => console.log('Autoplay blocked:', e));
                }
            }, 500);
        } else {
            // Setup for 360 image
            sceneWrapper.innerHTML = `
                <a-scene embedded renderer="antialias: true; colorManagement: true; highRefreshRate: true;" style="width: 100%; height: 100%;">
                    <!-- Segments increased to 128x64 for smoother 4K texture wrapping -->
                    <a-sky src="${window.uploadedFileUrl}" segments-width="128" segments-height="64"></a-sky>
                    <a-entity camera look-controls></a-entity>
                </a-scene>
            `;
        }
    }
});
