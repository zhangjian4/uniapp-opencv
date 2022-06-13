<template>
  <view class="content">
    <canvas style="width: 100px; height: 100px" canvas-id="first"></canvas>
    <canvas style="width: 100px; height: 100px" canvas-id="second"></canvas>
  </view>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import cv, { Mat, Rect } from "@/uni_modules/zj-opencv";
console.log(cv);
const init = new Promise<void>((resolve) => {
  cv.onRuntimeInitialized = () => {
    resolve();
  }
})

export default defineComponent({
  async onReady() {
    await init;
    var context = uni.createCanvasContext("first");

    const height = 100;
    const width = 100
    context.drawImage("/static/logo.png", 0, 0, width, height);
    context.draw(false, (result) => {
      console.log(result);
      uni.canvasGetImageData({
        canvasId: 'first',
        x: 0,
        y: 0,
        width,
        height,
        success: (imageData) => {
          let src = cv.matFromImageData(imageData);
          let dst = new cv.Mat();
          // 灰度化
          cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY, 0);
          const result = this.imageDataFromMat(dst);
          uni.canvasPutImageData({
            canvasId: 'second',
            x: 0,
            y: 0,
            width,
            height,
            data: result.data,
            success(res) { }
          })
        }
      })
    });

  },
  methods: {
    imageDataFromMat(mat: Mat) {
      // converts the mat type to cv.CV_8U
      const img = new cv.Mat();
      const depth = mat.type() % 8;
      const scale =
        depth <= cv.CV_8S ? 1.0 : depth <= cv.CV_32S ? 1.0 / 256.0 : 255.0;
      const shift = depth === cv.CV_8S || depth === cv.CV_16S ? 128.0 : 0.0;
      mat.convertTo(img, cv.CV_8U, scale, shift);

      // converts the img type to cv.CV_8UC4
      switch (img.type()) {
        case cv.CV_8UC1:
          cv.cvtColor(img, img, cv.COLOR_GRAY2RGBA);
          break;
        case cv.CV_8UC3:
          cv.cvtColor(img, img, cv.COLOR_RGB2RGBA);
          break;
        case cv.CV_8UC4:
          break;
        default:
          throw new Error(
            'Bad number of channels (Source image must have 1, 3 or 4 channels)'
          );
      }
      const imageData = {
        data: new Uint8ClampedArray(img.data),
        width: img.cols,
        height: img.rows
      };
      // mat.delete();
      img.delete();
      return imageData;
    }
  }
});
</script>

<style>
.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.logo {
  height: 200rpx;
  width: 200rpx;
  margin-top: 200rpx;
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 50rpx;
}

.text-area {
  display: flex;
  justify-content: center;
}

.title {
  font-size: 36rpx;
  color: #8f8f94;
}
</style>
