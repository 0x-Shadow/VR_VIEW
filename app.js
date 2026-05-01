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

    // Drag and Drop Handling
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('drag-over'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('drag-over'), false);
    });

    dropZone.addEventListener('drop', (e) => {
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleFile(file);
    });

    function handleFile(file) {
        const isVideo = file.type.startsWith('video/') || 
                        file.name.toLowerCase().match(/\.(mp4|mov|mkv|webm)$/i);
        
        window.uploadedFileType = isVideo ? 'video/mp4' : 'image/jpeg';
        
        if (isVideo) {
            // Videos use ObjectURL — they are referenced by element ID, not as a src string
            if (window.uploadedFileUrl) URL.revokeObjectURL(window.uploadedFileUrl);
            window.uploadedFileUrl = URL.createObjectURL(file);
            proceedToViewer();
        } else {
            // Images must use DataURL so A-Frame can trust and load the texture
            const reader = new FileReader();
            reader.onload = (ev) => {
                window.uploadedFileUrl = ev.target.result;
                proceedToViewer();
            };
            reader.readAsDataURL(file);
        }

        function proceedToViewer() {
            uploadContainer.classList.remove('active');
            if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
                gyroOverlay.classList.add('active');
            } else {
                showViewer();
            }
        }
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
            // Setup for 360 video
            videoElement = document.createElement('video');
            videoElement.id = 'pano-video';
            videoElement.autoplay = true;
            videoElement.loop = true;
            videoElement.playsInline = true;
            videoElement.webkitPlaysInline = true;
            videoElement.crossOrigin = 'anonymous';
            videoElement.src = window.uploadedFileUrl;
            videoElement.style.display = 'none';
            document.body.appendChild(videoElement);

            sceneWrapper.innerHTML = `
                <a-scene embedded renderer="antialias: true; colorManagement: true; physicallyCorrectLights: false;" style="width: 100%; height: 100%;">
                    <a-videosphere src="#pano-video" segments-width="128" segments-height="64"></a-videosphere>
                    <a-entity camera look-controls></a-entity>
                </a-scene>
            `;
            
            setTimeout(() => {
                if (videoElement) {
                    videoElement.play().catch(e => console.log('Autoplay blocked:', e));
                }
            }, 500);
        } else {
            // Setup for 360 image - High res segments for 4K/8K
            sceneWrapper.innerHTML = `
                <a-scene embedded renderer="antialias: true; colorManagement: true;" style="width: 100%; height: 100%;">
                    <a-sky src="${window.uploadedFileUrl}" segments-width="128" segments-height="64"></a-sky>
                    <a-entity camera look-controls></a-entity>
                </a-scene>
            `;
        }
    }
});
