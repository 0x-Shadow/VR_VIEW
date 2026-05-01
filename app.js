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

    let objectURL = null;
    let videoElement = null;

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        window.uploadedFileType = file.type;

        if (file.type.startsWith('video/')) {
            window.uploadedFileUrl = URL.createObjectURL(file);
            proceedWithUpload();
        } else {
            const reader = new FileReader();
            reader.onload = (e) => {
                window.uploadedFileUrl = e.target.result;
                proceedWithUpload();
            };
            reader.readAsDataURL(file);
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
        if (window.uploadedFileType && window.uploadedFileType.startsWith('video/')) {
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
                <a-scene embedded style="width: 100%; height: 100%;">
                    <a-videosphere src="#pano-video"></a-videosphere>
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
                <a-scene embedded style="width: 100%; height: 100%;">
                    <a-sky src="${window.uploadedFileUrl}"></a-sky>
                    <a-entity camera look-controls></a-entity>
                </a-scene>
            `;
        }
    }
});
