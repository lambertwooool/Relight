import { getDefaultLanguage } from './utils.js';
import { updateLanguage, translate } from './i18n.js';

// UI 相关功能

function initializeUI(updateLightSource, updateAperture) {
    const languageSelector = document.getElementById('languageSelector');
    const lightColor = document.getElementById('lightColor');
    const lightPower = document.getElementById('lightPower');
    const lightDistance = document.getElementById('lightDistance');
    const lightRadius = document.getElementById('lightRadius');
    const lightPowerValue = document.getElementById('lightPowerValue');
    const lightDistanceValue = document.getElementById('lightDistanceValue');
    const lightRadiusValue = document.getElementById('lightRadiusValue');
    
    // Set default language
    const defaultLang = getDefaultLanguage();
    languageSelector.value = defaultLang;
    updateLanguage(defaultLang).then(() => {
        updateUILanguage();
    });

    languageSelector.addEventListener('change', async (e) => {
        await updateLanguage(e.target.value);
        updateUILanguage();
    });

    // Initialize language
    updateUILanguage();

    // 控制面板事件监听器
    lightColor.addEventListener('input', updateLightSource);
    lightPower.addEventListener('input', () => {
        lightPowerValue.textContent = `${lightPower.value}%`;
        updateLightSource();
    });
    lightDistance.addEventListener('input', () => {
        lightDistanceValue.textContent = lightDistance.value;
        updateLightSource();
    });
    lightRadius.addEventListener('input', () => {
        lightRadiusValue.textContent = `${lightRadius.value}%`;
        updateLightSource();
    });
    lightAperture.addEventListener('input', () => {
        lightApertureValue.textContent = `f/${(lightAperture.value / 10).toFixed(1)}`;
        clearTimeout(window.apertureUpdateTimeout);
        window.apertureUpdateTimeout = setTimeout(() => {
            updateAperture();
        }, 100);
    });

    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadImage);
    }

    console.log('UI 初始化');
}

function updateUILanguage() {
    console.log('Updating UI language');
    const elements = document.querySelectorAll('[data-i18n]');

    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = translate(key);
        if (element.tagName.toLowerCase() === 'input' && element.type === 'button') {
            element.value = translation;
        } else {
            element.textContent = translation;
        }
    });

    // 更新页面标题
    document.title = translate('title');
}

// 获取控制面板的值
function getControlValues() {
    return {
        color: document.getElementById('lightColor').value,
        power: parseInt(document.getElementById('lightPower').value),
        distance: parseInt(document.getElementById('lightDistance').value),
        radius: parseInt(document.getElementById('lightRadius').value),
        aperture: document.getElementById('lightAperture').value / 10
    };
}

// 设置控制面板的值
function setControlValues(values) {
    const { color, power, distance, radius } = values;
    document.getElementById('lightColor').value = color;
    document.getElementById('lightPower').value = power;
    document.getElementById('lightDistance').value = distance;
    document.getElementById('lightRadius').value = radius;
    document.getElementById('lightPowerValue').textContent = `${power}%`;
    document.getElementById('lightDistanceValue').textContent = distance;
    document.getElementById('lightRadiusValue').textContent = `${radius}%`;
}

function downloadImage() {
    const canvas = document.getElementById('lightingEffectCanvas');
    if (!canvas) {
        console.error('未找到画布');
        return;
    }

    setTimeout(() => {
        const dataURL = canvas.toDataURL('image/png');
        
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = 'effect.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, 100);
}

// 导出需要的函数
export { initializeUI, getControlValues, setControlValues, updateUILanguage };