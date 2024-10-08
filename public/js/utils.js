// 加载图片
const imageCache = new Map();
const MAX_CACHE_SIZE = 10;

export function loadImage(src) {
    if (imageCache.has(src)) {
        return Promise.resolve(imageCache.get(src));
    }

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            if (imageCache.size >= MAX_CACHE_SIZE) {
                const oldestKey = imageCache.keys().next().value;
                imageCache.delete(oldestKey);
            }
            imageCache.set(src, img);
            resolve(img);
        };
        img.onerror = reject;
        img.src = src;
    });
}

// 等待对象不为空的函数
export function waitForNonEmpty(obj, property, timeout = 3000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        function checkObject() {
            if (obj !== null && obj !== undefined && obj[property] !== null && obj[property] !== undefined) {
                resolve(obj[property]);
            } else if (Date.now() - startTime > timeout) {
                reject(new Error(`等待超时：对象或属性 ${property} 仍然为空`));
            } else {
                setTimeout(checkObject, 100);
            }
        }
        
        checkObject();
    });
}


// 将十六进制颜色转换为 RGB
export function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

// 获取默认语言
export function getDefaultLanguage() {
    const browserLang = navigator.language || navigator.userLanguage;
    const langCode = browserLang.toLowerCase().split('-')[0];
    const supportedLangs = ['en', 'zh-CN', 'ja', 'ko', 'fr', 'it', 'de', 'ru', 'pt', 'ar'];
    
    if (langCode === 'zh') {
        return browserLang.toLowerCase() === 'zh-tw' ? 'zh-TW' : 'zh-CN';
    } else if (supportedLangs.includes(langCode)) {
        return langCode;
    } else {
        return 'en';
    }
}

class EventEmitter {
    constructor() {
        this._events = {};
    }

    on(event, listener) {
        if (!this._events[event]) {
            this._events[event] = [];
        }
        this._events[event].push(listener);
    }

    emit(event, ...args) {
        if (this._events[event]) {
            this._events[event].forEach(listener => listener(...args));
        }
    }

    removeListener(event, listener) {
        if (this._events[event]) {
            this._events[event] = this._events[event].filter(l => l !== listener);
        }
    }
}

export { EventEmitter };