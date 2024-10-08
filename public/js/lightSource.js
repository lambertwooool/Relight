import { hexToRgb, loadImage, waitForNonEmpty, EventEmitter } from './utils.js';

class Light {
    constructor(x, y, lightSources) {
        this.lightSources = lightSources;

        this.element = document.createElement('div');
        this.element.className = 'light-source';
        this.element.style.left = `${x - 20}px`;
        this.element.style.top = `${y - 20}px`;

        this.dot = document.createElement('div');
        this.dot.className = 'light-source-dot';
        
        this.effect = document.createElement('div');
        this.effect.className = 'light-source-effect';
        this.effect.style.display = 'none';

        this.deleteButton = document.createElement('div');
        this.deleteButton.className = 'delete-button';
        this.deleteButton.innerHTML = 'X';
        this.deleteButton.style.display = 'none';

        this.element.appendChild(this.dot);
        this.element.appendChild(this.effect);
        this.element.appendChild(this.deleteButton);

        this.lightSources.imageContainer.appendChild(this.element);

        this.color = lightSources.defaultLightProp.color || '#ffffff';
        this.power = lightSources.defaultLightProp.power || 30;
        this.distance = lightSources.defaultLightProp.distance || 50;
        this.radius = lightSources.defaultLightProp.radius || 50;
        this.isPressed = false;

        this.element.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.deleteButton.addEventListener('click', this.handleDelete.bind(this));
    }

    handleMouseDown(e) {
        e.stopPropagation();
        this.isPressed = true;
        this.effect.style.display = 'block';
        this.deleteButton.style.display = 'block';
        this.lightSources.selectLight(this);
        this.lightSources.startDragging(e, this);
    }

    handleDelete(e) {
        e.stopPropagation();
        this.lightSources.deleteLight(this);
    }

    select() {
        this.element.classList.add('selected');
        // this.effect.style.display = 'block';
        if (this.lightSources.getAllLights().length > 1) {
            this.deleteButton.style.display = 'block';
        }
        this.isPressed = true;
    }

    deselect() {
        this.element.classList.remove('selected');
        this.effect.style.display = 'none';
        this.deleteButton.style.display = 'none';
        this.isPressed = false;
    }

    showEffect() {
        this.effect.style.display = 'block';
    }

    updatePosition(x, y) {
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
    }

    updateProperties(color, power, distance, radius, imageLongerSide) {
        this.color = color;
        this.power = power;
        this.distance = distance;
        this.radius = radius;

        const minOpacity = 0.3;
        const maxOpacity = 0.6;
        const opacity = minOpacity + (maxOpacity - minOpacity) * (power / 100);

        const actualRadius = (radius / 100) * imageLongerSide / 2;

        this.dot.style.backgroundColor = `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
        
        const shadowBlur = Math.abs(parseFloat(distance)) / 2;
        const shadowSpread = 20 - Math.abs(parseFloat(distance)) / 10;
        
        this.effect.style.width = `${actualRadius * 2}px`;
        this.effect.style.height = `${actualRadius * 2}px`;
        this.effect.style.backgroundColor = color;
        this.effect.style.opacity = this.isPressed ? opacity : 0;
        this.effect.style.boxShadow = `0 0 ${shadowBlur}px ${shadowSpread}px ${color}`;

        const minCircleSize = 12;
        const maxCircleSize = 48;
        const circleSize = minCircleSize + ((parseFloat(distance) + 100) / 200) * (maxCircleSize - minCircleSize);
        
        this.dot.style.width = `${circleSize}px`;
        this.dot.style.height = `${circleSize}px`;
        
        const offset = (40 - circleSize) / 2;
        this.dot.style.left = `${offset}px`;
        this.dot.style.top = `${offset}px`;
    }

    getPosition() {
        const rect = this.lightSources.originalImage.getBoundingClientRect();
        const elementRect = this.element.getBoundingClientRect();
        return {
            x: (elementRect.left - rect.left + 20) / rect.width,
            y: (elementRect.top - rect.top + 20) / rect.height
        };
    }
}

class Aperture {
    constructor(x, y, lightSources) {
        this.lightSources = lightSources;

        this.element = document.createElement('div');
        this.element.className = 'aperture';
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;

        // 创建十字线
        this.crosshair = document.createElement('div');
        this.crosshair.className = 'aperture-crosshair';

        // 创建边框
        this.border = document.createElement('div');
        this.border.className = 'aperture-border';

        this.element.appendChild(this.crosshair);
        this.element.appendChild(this.border);

        this.lightSources.imageContainer.appendChild(this.element);

        this.value = lightSources.defaultLightProp.aperture || 2.8;
        this.isPressed = false;

        this.element.addEventListener('mousedown', this.handleMouseDown.bind(this));
    }

    handleMouseDown(e) {
        e.stopPropagation();
        this.isPressed = true;
        this.lightSources.startDraggingAperture(e, this);
    }

    updatePosition(x, y) {
        this.element.style.left = `${x + 20}px`;
        this.element.style.top = `${y + 20}px`;
    }

    updateProperties(aperture) {
        this.value = aperture;
    }

    getPosition() {
        const rect = this.lightSources.originalImage.getBoundingClientRect();
        const elementRect = this.element.getBoundingClientRect();
        return {
            x: (elementRect.left - rect.left) / rect.width,
            y: (elementRect.top - rect.top) / rect.height
        };
    }
}

class LightSources extends EventEmitter {
    constructor(imageContainer, originalImage, currentNormalMapFileName, defaultLightProp) {
        super();
        this.lights = [];
        this.selectedLight = null;
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.imageContainer = imageContainer;
        this.originalImage = originalImage;
        this.width = originalImage.naturalWidth;
        this.height = originalImage.naturalHeight;
        this.defaultLightProp = defaultLightProp || {};
        this.currentNormalMapFileName = currentNormalMapFileName;
        this.aperture = null;
        this.apertureImageData = null;

        setTimeout(() => {
            this.initializeLight();
            this.initializeAperture();

            document.addEventListener('mousemove', (e) => {
                this.updateLightPosition(e, originalImage);
                this.updateAperturePosition(e, originalImage);
            });
    
            document.addEventListener('mouseup', () => {
                this.stopDragging();
                this.stopDraggingAperture();
            });
        }, 1);
    }

    initializeLight() {
        if (this.lights.length === 0) {
            const rect = this.originalImage.getBoundingClientRect();
            const initialLight = this.createLight(
                rect.width / 3 + 20,
                rect.height / 3 + 20
            );
            this.selectLight(initialLight, this.updateLightCallback);
        }
    }

    createLight(x, y) {
        const light = new Light(x, y, this);
        this.lights.push(light);
        return light;
    }

    deleteLight(light) {
        const index = this.lights.indexOf(light);
        if (index > -1) {
            this.lights.splice(index, 1);
            light.element.remove();
            if (this.selectedLight === light) {
                this.selectedLight = this.lights.length > 0 ? this.lights[0] : null;
                if (this.selectedLight) {
                    this.selectLight(this.selectedLight);
                } else {
                    this.emit('update', this.selectedLight);
                }
            }
        }
    }

    selectLight(light) {
        if (this.selectedLight) {
            this.selectedLight.deselect();
        }
        this.selectedLight = light;
        light.select();
        
        this.emit('select', this.selectedLight);
        this.emit('update', this.selectedLight);
    }

    startDragging(e, light) {
        this.isDragging = true;
        this.selectedLight = light;
        const rect = this.selectedLight.element.getBoundingClientRect();
        this.startX = e.clientX - rect.left;
        this.startY = e.clientY - rect.top;
        this.selectedLight.showEffect();
        e.preventDefault();
    }

    updateLightPosition(e, originalImage) {
        if (this.isDragging && this.selectedLight) {
            const rect = originalImage.getBoundingClientRect();
            let newX = e.clientX - rect.left - this.startX + 40;
            let newY = e.clientY - rect.top - this.startY + 40;
            
            this.selectedLight.updatePosition(newX, newY);
            this.emit('update', this.selectedLight);
        }
    }

    stopDragging() {
        this.isDragging = false;
        if (this.selectedLight) {
            this.selectedLight.isPressed = false;
            this.selectedLight.effect.style.display = 'none';
            this.emit('update', this.selectedLight);
        }
    }

    getSelectedLight() {
        return this.selectedLight;
    }

    getAllLights() {
        return this.lights;
    }

    setLightsVisibility(isVisible) {
        this.lights.forEach(light => {
            light.element.style.display = isVisible ? 'block' : 'none';
            if (!isVisible) {
                light.effect.style.display = 'none';
                light.isPressed = false;
            }
        });
    }

    setApertureVisibility(isVisible) {
        if (this.aperture) {
            this.aperture.element.style.display = isVisible ? 'block' : 'none';
        }
    }

    initializeAperture() {
        if (!this.aperture) {
            const rect = this.originalImage.getBoundingClientRect();
            this.aperture = new Aperture(
                rect.width / 2 + 20,
                rect.height / 2 + 20,
                this
            );
            this.aperture.updateProperties(this.defaultLightProp.aperture || 2.8);

            this.calculateAperture();
        }
    }

    startDraggingAperture(e, aperture) {
        this.isDraggingAperture = true;
        const rect = aperture.element.getBoundingClientRect();
        this.startX = e.clientX - rect.left;
        this.startY = e.clientY - rect.top;
        e.preventDefault();
    }

    updateAperturePosition(e, originalImage) {
        if (this.isDraggingAperture && this.aperture) {
            const rect = originalImage.getBoundingClientRect();
            let newX = e.clientX - rect.left - this.startX + 20;
            let newY = e.clientY - rect.top - this.startY + 20;
            
            this.aperture.updatePosition(newX, newY);
            clearTimeout(window.apertureEmitTimeout);
            window.apertureEmitTimeout = setTimeout(() => {
                this.emit('updateAperture', this.aperture);
            }, 100);
        }
    }

    stopDraggingAperture() {
        this.isDraggingAperture = false;
    }

    getAperture() {
        return this.aperture;
    }

    calculateLightingEffect(lightingEffectCanvas) {
        const ctx = lightingEffectCanvas.getContext('2d');
        lightingEffectCanvas.width = this.width;
        lightingEffectCanvas.height = this.height;

        Promise.all([
            loadImage(`/normalmaps/${this.currentNormalMapFileName}`),
            loadImage(`/normalmaps/${this.currentNormalMapFileName.replace('_normal', '_depth')}`),
            waitForNonEmpty(this, 'apertureImageData')
        ]).then(([normalMapImg, depthMapImg]) => {
            const width = this.width;
            const height = this.height;
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = width;
            tempCanvas.height = height;
            const tempCtx = tempCanvas.getContext('2d');

            let originalData;
            if (!this.apertureImageData) {  
                tempCtx.drawImage(this.originalImage, 0, 0, width, height);
                originalData = tempCtx.getImageData(0, 0, width, height);
            } else {
                originalData = this.apertureImageData;
            }

            tempCtx.drawImage(normalMapImg, 0, 0, width, height);
            const normalMapData = tempCtx.getImageData(0, 0, width, height);
            tempCtx.drawImage(depthMapImg, 0, 0, width, height);
            const depthMapData = tempCtx.getImageData(0, 0, width, height);

            const resultData = new ImageData(width, height);

            for (let i = 0; i < resultData.data.length; i += 4) {
                resultData.data[i] = originalData.data[i];
                resultData.data[i + 1] = originalData.data[i + 1];
                resultData.data[i + 2] = originalData.data[i + 2];
                resultData.data[i + 3] = 255; // 设置 alpha 通道为不透明
            }

            // calculateAperture(this.aperture, width, height, depthMapData, resultData);

            this.lights.forEach(light => {
                const { x: lightX, y: lightY } = light.getPosition();
                const lightZ = parseFloat(light.distance) / 100;

                const power = light.power / 100;
                const color = hexToRgb(light.color);
                const radius = light.radius / 100;

                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        const i = (y * width + x) * 4;

                        // 从法线图读取法线信息
                        const nx = (normalMapData.data[i] / 255) * 2 - 1;
                        const ny = (normalMapData.data[i + 1] / 255) * 2 - 1;
                        const nz = (normalMapData.data[i + 2] / 255) * 2 - 1;

                        // 从深度图读取深度信息
                        const depth = depthMapData.data[i] / 255;

                        // 计算光源和当前像素之间的距离
                        const dx = x / width - lightX;
                        const dy = y / height - lightY;
                        const dz = depth - lightZ;
                        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

                        // 计算光照强度
                        const lightIntensity = Math.max(0, 1 - distance / radius);
                        
                        // 计算法线和光照方向的点积
                        const lightDirX = dx / distance;
                        const lightDirY = dy / distance;
                        const lightDirZ = dz / distance;
                        const dotProduct = -nx * lightDirX + ny * lightDirY + nz * lightDirZ;

                        // 结合光照强和法线方向计算最终亮度
                        const finalIntensity = Math.max(0, dotProduct) * lightIntensity * power;
                        
                        // 将光照效果应用到结果数据并增加对比度
                        const baseContrastFactor = 1.0; // 基础对比度因子
                        const contrastFactor = 1.0 + baseContrastFactor * finalIntensity; // 受光照强度影响的对比度
                        const applyContrast = (value, factor) => {
                            return Math.min(255, Math.max(0, Math.round(((value / 255 - 0.5) * factor + 0.5) * 255)));
                        };

                        resultData.data[i] += color.r * finalIntensity;
                        resultData.data[i + 1] += color.g * finalIntensity;
                        resultData.data[i + 2] += color.b * finalIntensity;

                        resultData.data[i] = applyContrast(resultData.data[i], contrastFactor);
                        resultData.data[i + 1] = applyContrast(resultData.data[i + 1], contrastFactor);
                        resultData.data[i + 2] = applyContrast(resultData.data[i + 2], contrastFactor);
                    }
                }
            });

            ctx.putImageData(resultData, 0, 0);
        });
    }

    calculateAperture() {
        const aperture = this.aperture;
        const originalImage = this.originalImage;
        const width = this.width;
        const height = this.height;
        const focusPosition = aperture.getPosition();
        const focusX = focusPosition.x * width;
        const focusY = focusPosition.y * height;
        console.log(aperture.value);
    
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');
    
        loadImage(`/normalmaps/${this.currentNormalMapFileName.replace('_normal', '_depth')}`).then(depthMapImg => {
            tempCtx.drawImage(originalImage, 0, 0, width, height);
            const originalImageData = tempCtx.getImageData(0, 0, width, height);
            tempCtx.drawImage(depthMapImg, 0, 0, width, height);
            const depthMapData = tempCtx.getImageData(0, 0, width, height);
    
            // 从深度图获取焦点的Z坐标
            const focusIndex = (Math.floor(focusY) * width + Math.floor(focusX)) * 4;
            const focus_depth = depthMapData.data[focusIndex];
            const blur_strength = Math.max(1, Math.min(20, Math.round(100 / aperture.value)));
            let depth_step = 8;
    
            // 从焦点向前向后延展计算
            const maxDepth = 255;
            const minDepth = 0;
    
            // 预先获取所有需要的图像数据
            const originalImageDataArray = originalImageData.data;
            const depthMapDataArray = depthMapData.data;
    
            // 创建一个离屏 canvas 用于模糊处理
            const offscreenCanvas = new OffscreenCanvas(width, height);
            const offscreenCtx = offscreenCanvas.getContext('2d');
    
            for (let offset = 0; offset <= maxDepth; offset += depth_step) {
                const forwardDepth = Math.min(focus_depth + offset, maxDepth);
                const backwardDepth = Math.max(focus_depth - offset, minDepth);
                
                [forwardDepth, backwardDepth].forEach(depth_value => {
                    const blur_amount = Math.floor(blur_strength * Math.abs(depth_value - focus_depth) / 256);
                    
                    if (blur_amount > 0) {
                        // 使用离屏 canvas 进行模糊处理
                        offscreenCtx.putImageData(originalImageData, 0, 0);
                        offscreenCtx.filter = `blur(${blur_amount}px)`;
                        offscreenCtx.drawImage(offscreenCanvas, 0, 0);
                        const blurredData = offscreenCtx.getImageData(0, 0, width, height).data;
                        
                        // 使用 Uint8ClampedArray 直接操作像素数据，避免重复的 getImageData 调用
                        for (let i = 0; i < depthMapDataArray.length; i += 4) {
                            if (depthMapDataArray[i] >= depth_value && depthMapDataArray[i] < depth_value + depth_step) {
                                originalImageDataArray[i] = blurredData[i];
                                originalImageDataArray[i + 1] = blurredData[i + 1];
                                originalImageDataArray[i + 2] = blurredData[i + 2];
                            }
                        }
                    }
                });
    
                // depth_step *= 1.5;
                
                // 如果已经处理到了最大和最小深度，就退出循环
                if (forwardDepth === maxDepth && backwardDepth === minDepth) {
                    break;
                }
            }
    
            this.apertureImageData = originalImageData;
        });
    }

    setApertureValue(value) {
        this.apertureValue = value;
    }
}

export { LightSources };