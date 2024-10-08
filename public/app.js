import { initializeUI, getControlValues, setControlValues } from './js/ui.js';
import { initializeImageUpload } from './js/imageUpload.js';
import { LightSources } from './js/lightSource.js';

document.addEventListener('DOMContentLoaded', () => {
    const imageContainer = document.getElementById('imageContainer');
    const normalMapImage = document.getElementById('normalMapImage');
    const lightingEffectCanvas = document.getElementById('lightingEffectCanvas');

    let imageLongerSide = 0;

    let currentNormalMapFileName = '';

    // Add new canvas element to display normal map
    const normalMapCanvas = document.createElement('canvas');
    const normalMapCtx = normalMapCanvas.getContext('2d');
    imageContainer.appendChild(normalMapCanvas);
    normalMapCanvas.style.display = 'none';

    let lightSources;

    function updateLight(light) {    
        if (light) {
            const settings = getControlValues();
            light.updateProperties(settings.color, settings.power, settings.distance, settings.radius, imageLongerSide);
        }
        lightSources.calculateLightingEffect(lightingEffectCanvas);
    }

    function updateAperture(aperture) {
        const settings = getControlValues();
        aperture.updateProperties(settings.aperture);
        lightSources.calculateAperture();
    }

    function selectLight(light) {
        if (light) {
            const { color, power, distance, radius } = { color: light.color, power: light.power, distance: light.distance, radius: light.radius };
            setControlValues({ color, power, distance, radius });
        }
    }

    function handleImageLoad(imgData, normalMapPath) {
        const width = imgData.canvas.width;
        const height = imgData.canvas.height;
        imageLongerSide = Math.max(width, height);
        currentNormalMapFileName = normalMapPath.split('/').pop();

        // Set size of normal map canvas
        normalMapCanvas.width = width;
        normalMapCanvas.height = height;

        // Load and draw normal map
        const normalMapImg = new Image();
        normalMapImg.onload = () => {
            normalMapCtx.drawImage(normalMapImg, 0, 0, width, height);
        };
        normalMapImg.src = normalMapPath;

        const { color, power, distance, radius, aperture } = getControlValues();
        lightSources = new LightSources(imageContainer, normalMapImage, currentNormalMapFileName, { color, power, distance, radius, aperture });
        lightSources.on('select', selectLight);
        lightSources.on('update', updateLight);
        lightSources.on('updateAperture', updateAperture);
        addEventListeners();
    }

    function addEventListeners() {
        normalMapImage.addEventListener('dblclick', (e) => {
            const rect = normalMapImage.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const newLight = lightSources.createLight(x, y);
            if (newLight) {
                lightSources.selectLight(newLight);
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Control') {
                lightSources.setLightsVisibility(false);
                lightSources.setApertureVisibility(false);
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.key === 'Control') {
                lightSources.setLightsVisibility(true);
                lightSources.setApertureVisibility(true);
            }
        });
    }

    // When window size changes, readjust image and light source position
    window.addEventListener('resize', () => {
        const computedStyle = window.getComputedStyle(lightingEffectCanvas);
        const width = parseFloat(computedStyle.width);
        const height = parseFloat(computedStyle.height);
        normalMapImage.style.width = width + 'px';
        normalMapImage.style.height = height + 'px';
        if (normalMapImage.src) {
            const rect = normalMapImage.getBoundingClientRect();
            imageLongerSide = Math.max(rect.width, rect.height);
            updateLight();
        }
    });

    initializeImageUpload(handleImageLoad);
    initializeUI(() => updateLight(lightSources.getSelectedLight()), () => updateAperture(lightSources.getAperture()));
});