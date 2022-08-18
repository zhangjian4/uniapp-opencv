# uniapp-opencv

## 介绍
基于[opencv-ts](https://github.com/theothergrantdavidson/opencv-ts)对uni-app做了适配,目前支持**H5、微信小程序、App**,其中微信小程序适配参考了[WeChat-MiniProgram-AR-WASM](https://github.com/sanyuered/WeChat-MiniProgram-AR-WASM)。

## 使用方法
```typescript
import cv from '@/uni_modules/zj-opencv';
```
```typescript
cv.then(async () => {
    const src = await cv.imread('first');
    const dst = new cv.Mat();
    cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY, 0);
    await cv.imshow('second', dst);
    src.delete();
    dst.delete();
});
```
具体可参考[Demo](https://github.com/zhangjian4/uniapp-opencv/blob/master/src/pages/index/index.vue)

## 注意事项
* 由于uniapp中部分方法需要异步调用,原`imread`和`imshow`方法改为了异步方法,返回的是`Promise`对象,调用时需要在前面加`await`或在`then`里面执行后续操作。
* `imread`和`imshow`方法暂时只支持传入`canvas`的`id`,**注意不是`canvas-id`**。
* Mat对象用完一定要调用`delete`方法,否则会造成OOM。
* 微信小程序中如果使用的不是2d的`canvas`,调试工具不支持`canvasPutImageData`,需要在真机中预览。
* 在`Typescript`中使用时,如果引入的路径为绝对路径如`@/uni_modules/zj-opencv`,需要修改`tsconfig.json`文件。
```json
{
  "compilerOptions": {
    ...
    "paths": {
      "@/*": [
        "./src/*"
      ]
    }
  },
  ...
}
```
* 字节小程序在调试工具上运行会报错，需要在真机上预览
* 字节小程序不支持压缩过的wasm文件，由于上传的大小限制所以只编译了图像处理的模块

## 其他
[opencv.js修改明细](https://github.com/zhangjian4/uniapp-opencv/blob/master/modify.md)