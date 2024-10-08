self.onmessage = function(event) {
    console.log('Web Worker received message', event.data);
    const { resultDataArray, width, height, blurAmount, depthValue, depthStep } = event.data;

    const offscreenCanvas = new OffscreenCanvas(width, height);
    const offscreenCtx = offscreenCanvas.getContext('2d');

    const imageData = new ImageData(new Uint8ClampedArray(resultDataArray), width, height);
    offscreenCtx.putImageData(imageData, 0, 0);
    offscreenCtx.filter = `blur(${blurAmount}px)`;
    offscreenCtx.drawImage(offscreenCanvas, 0, 0);
    const blurredData = offscreenCtx.getImageData(0, 0, width, height).data;

    console.log('Web Worker sending blurred data');
    self.postMessage({
        blurredData: blurredData,
        depthValue: depthValue,
        depthStep: depthStep,
        width: width,
        height: height
    });
};