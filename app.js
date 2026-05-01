document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById('file-input');
    const uploadContainer = document.getElementById('upload-container');
    const gyroOverlay = document.getElementById('gyro-overlay');
    const viewerContainer = document.getElementById('viewer-container');
    const sceneWrapper = document.getElementById('scene-wrapper');
    const closeBtn = document.getElementById('close-viewer-btn');
    const enableGyroBtn = document.getElementById('enable-gyro-btn');
    const skipGyroBtn = document.getElementById('skip-gyro-btn');

    let objectURL = null;

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

    closeBtn.addEventListener('click', () => {
        viewerContainer.classList.remove('active');
        uploadContainer.classList.add('active');
        sceneWrapper.innerHTML = ''; 
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
        
        let sceneContent = '';

        if (window.uploadedFileType && window.uploadedFileType.startsWith('video/')) {
            // Setup for 360 video
            sceneContent = `
                <a-assets>
                    <video id="pano-video" autoplay loop playsinline webkit-playsinline src="${window.uploadedFileUrl}"></video>
                </a-assets>
                <a-videosphere src="#pano-video"></a-videosphere>
            `;
            // Trigger playback specifically since mobile often blocks autoplay
            setTimeout(() => {
                const vid = document.getElementById('pano-video');
                if (vid) {
                    vid.play().catch(e => console.log('Autoplay blocked:', e));
                }
            }, 500);
        } else {
            // Setup for 360 image
            sceneContent = `
                <a-sky src="${window.uploadedFileUrl}"></a-sky>
            `;
        }

        sceneWrapper.innerHTML = `
            <a-scene embedded style="width: 100%; height: 100%;">
                ${sceneContent}
                <a-entity camera look-controls></a-entity>
            </a-scene>
        `;
    }
});
