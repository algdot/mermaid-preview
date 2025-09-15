# 图像大小计算算法详解

## 计算公式

最终图像尺寸 = SVG自然尺寸 × 缩放比例

```
width = svg.width * scale
height = svg.height * scale
```

## 实际尺寸获取代码示例

```javascript
// 获取精确尺寸的方法
function getImageDimensions(svgString, scale = 1) {
    return new Promise((resolve) => {
        const img = new Image();
        
        img.onload = () => {
            const dimensions = {
                originalWidth: img.naturalWidth || img.width,
                originalHeight: img.naturalHeight || img.height,
                scaledWidth: (img.naturalWidth || img.width) * scale,
                scaledHeight: (img.naturalHeight || img.height) * scale,
                scaleUsed: scale,
                pixelRatio: window.devicePixelRatio || 1
            };
            resolve(dimensions);
        };
        
        // 解析 SVG 字符串
        const encodedSvg = encodeURIComponent(svgString);
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodedSvg;
    });
}
```

## 影响因素

1. **Mermaid配置**：
   - 图表类型（流程图、时序图、甘特图等）
   - 节点数量和复杂度
   - 文字内容长度
   - 字体大小设置

2. **SVG属性**：
   - `viewBox` 属性定义了 SVG 的坐标系统
   - `width` 和 `height` 属性定义了渲染尺寸
   - 自动换行和节点间距规则

3. **屏幕DPI**：
   - retina屏幕的设备像素比（`devicePixelRatio`）
   - 不影响最终 PNG 的实际像素尺寸

## 实际计算流程

1. Mermaid 根据图表语法计算所需画布
2. 生成 SVG 时自动添加 `width="800" height="600"` 这类属性
3. 浏览器解析 SVG：
   - 读取 `width`/`height` → 最终图像尺寸
   - 如果没有明确尺寸，则根据 `viewBox` 计算
4. JavaScript 通过 `Image.naturalWidth`/`naturalHeight` 获取尺寸
5. 应用缩放因子（scale = 1 表示100%）