
export function initializeImageUpload(handleImageLoad) {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');

    // Click to upload
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    // File selection handler
    fileInput.addEventListener('change', handleFileSelect);

    // Drag and drop upload
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.style.backgroundColor = '#e0e0e0';
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.style.backgroundColor = '';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.style.backgroundColor = '';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    function handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    }

    function handleFile(file) {
        if (file.type.startsWith('image/')) {
            const formData = new FormData();
            formData.append('image', file);

            fetch('/upload', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                const img = new Image();
                img.onload = () => {
                    handleImageLoad(img, `/uploads/${data.originalFileName}`, `/normalmaps/${data.normalMapFileName}`);
                };
                img.src = `/uploads/${data.originalFileName}`;
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error uploading file');
            });
        } else {
            alert('Please upload an image file');
        }
    }

    // 加载默认图片
    function loadDefaultImage() {
        const defaultImagePath = '/uploads/dd240e3927519807184762bf29948749.png';
        const defaultNormalMapPath = '/normalmaps/dd240e3927519807184762bf29948749_normal.png';
        
        const img = new Image();
        img.onload = () => {
            const aspectRatio = img.width / img.height;
            const maxWidth = window.innerWidth * 0.5;
            const maxHeight = window.innerHeight * 0.5;
            
            let width, height;
            if (aspectRatio > maxWidth / maxHeight) {
                width = maxWidth;
                height = width / aspectRatio;
            } else {
                height = maxHeight;
                width = height * aspectRatio;
            }
            
            normalMapImage.style.width = `${width}px`;
            normalMapImage.style.height = `${height}px`;
            normalMapImage.src = img.src;
            imageContainer.style.display = 'block';
            imageHint.style.display = 'block';
            dropZone.style.display = 'none';  // 添加这行来隐藏上传框
            console.log('Image loaded');
            
            // Disable image drag
            normalMapImage.draggable = false;
            normalMapImage.addEventListener('mousedown', (e) => e.preventDefault());
    
            // Save original image data
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(img, 0, 0);   

            handleImageLoad(tempCtx, defaultNormalMapPath);
        };
        img.src = defaultImagePath;
    }

    // 在初始化时加载默认图片
    loadDefaultImage();
}