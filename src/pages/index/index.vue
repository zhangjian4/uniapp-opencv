<template>
    <view class="content">
        <canvas style="width: 100px; height: 100px" type="2d" id="first"></canvas>
        <canvas style="width: 100px; height: 100px" type="2d" id="second"></canvas>
    </view>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
import cv from '@/uni_modules/zj-opencv';

export default defineComponent({
    async onReady() {
        await this.drawImage();
        cv.then(async () => {
            const src = await cv.imread('first');
            let dst = new cv.Mat();
            // 灰度化
            cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY, 0);
            await cv.imshow('second', dst);
        });
    },
    methods: {
        async drawImage() {
            return new Promise<void>((resolve, reject) => {
                uni.createSelectorQuery()
                    .select('#first')
                    .fields({ context: true, size: true, node: true } as any, (first: any) => {
                        // 微信小程序中canvas的type设为2d走这里
                        if (first.nodeCanvasType === '2d') {
                            const canvas = first.node;
                            if (canvas) {
                                const context: CanvasRenderingContext2D = canvas.getContext('2d');
                                const image = canvas.createImage();
                                canvas.width = first.width;
                                canvas.height = first.height;
                                image.onload = () => {
                                    context.drawImage(image, 0, 0, first.width, first.height);
                                    resolve();
                                };
                                image.src = '/static/logo.png';
                            }
                        } else {
                            const context = first.context as any;
                            uni.createCanvasContext(context.id || context.canvasId);
                            context.drawImage('/static/logo.png', 0, 0, 100, 100);
                            context.draw(false, () => {
                                resolve();
                            });
                        }
                    })
                    .exec();
            });
        },
    },
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
