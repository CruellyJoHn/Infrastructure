### 为什么使用svg图标代替iconfont图标？

1. **渲染方式不同**

   - iconfont：采用字体渲染，在大屏下渲染效果可能并不好，在细节部分会有锯齿等；**因为浏览器认为其是文本，所以会对其使用抗锯齿**，尤其在火狐浏览器上的渲染比在其它浏览器上的渲染要更重些；

   - svg：传统图片格式的一种，**自身提供的功能集涵盖了嵌套转换、裁剪路径、Alpha通道、滤镜效果等能力，它还具备了传统图片没有的矢量功能**，在任何高清设备都很高清。在浏览器中使用的是图形渲染，所以就是实实在在的路径。

   - 除此之外，由于iconfont是字体图标，所以他还会 **受到font-family字体的影响**

     ![image-20220706152110541](C:\Users\User\AppData\Roaming\Typora\typora-user-images\image-20220706152110541.png)

2. **CSS控制**

   - iconfont：可以通过CSS控制大小（**fontSize支持需要做特殊处理**），颜色，阴影，旋转等
   - svg：CSS能对iconfont能干的事，都能对它干；除此之外，可以使用CSS对svg特有的属性进行操作，比如描边属性以及svg动画等。

3. **颜色支持**

   - iconfont：只支持单色
   - svg：支持多色图标

4. **针对视觉障碍人士**

   - iconfont：在浏览器中会被浏览器通过朗读而出，需要做特殊处理
   - svg：因为是图片，不会被朗读

5. **性能方面** 

   - 通过Svg Sprite的技术，可以将svg体积减少（**未经过实验**）

6. **唯一痛点：兼容性**

   - iconfont：支持ie6+
   - svg：ie9+，以及IOS和安卓部分不支持



### 原理

#### 设置字体大小原理

>  svg图片不能像字体图标一样，天然支持fontSize设置的形式去修改他的大小；说到底svg还是一个图片，只不过是矢量图片，所以这里需要些处理，使svg图片能够支持fontSize设置大小

1. em单位；em单位是长度单位，该单位相对于当前对象的字体尺寸（即fontSize）进行换算，若当前对象没有设置fontSize，则继承其父属性的单位进行换算。
2. 对svg的宽高都设置 **1em**，从而使svg能够支持外部设置fontSize的形式设置大小

```less
svg {
	width: 1em;
	height: 1em;
}
```

##### svg雪碧图

> https://www.zhangxinxu.com/wordpress/2014/07/introduce-svg-sprite-technology/

通过symbol的标签，对svg图片进行**定义（是定义不是使用）**，将所有svg图进行整合并定义；再利用**svg的特性**在业务中进行使用

```html
<svg>
    <symbol>
        <!-- 第1个图标路径形状之类代码 -->
        <path ..../>
    </symbol>
    <symbol>
        <!-- 第2个图标路径形状之类代码 -->
    </symbol>
    <symbol>
        <!-- 第3个图标路径形状之类代码 -->
    </symbol>
</svg>
```



#### svg特性（是svg雪碧图的原理）：

  1. 可重复调用svg

     > 一处定义，多处使用

     ```html
     <svg>
       <defs>
         <g id="shape">
             <rect x="0" y="0" width="50" height="50" />
             <circle cx="0" cy="0" r="50" />
         </g>
       </defs>
     
       <use xlink:href="#shape" x="50" y="50" />
       <use xlink:href="#shape" x="200" y="50" />
     </svg>
     ```

     

  2. 跨svg调用

     > 只要在同一个html文档内定义svg元素，在各个地方都能调用（**不局限在一个svg标签内**）
     >
     > 这也是svg雪碧图的核心所在
     
     ```html
     <svg>
       <defs>
         <g id="shape">
             <rect x="0" y="0" width="50" height="50" />
             <circle cx="0" cy="0" r="50" />
         </g>
       </defs>
     
       <use xlink:href="#shape" x="50" y="50" />
       <use xlink:href="#shape" x="200" y="50" />
     </svg>
     ...
     ...
     <!-- 在文档某处，使用上方定义的svg元素 -->
     <div>
         <i>
             <svg width="500" height="110"><use xlink:href="#shape" x="50" y="50" /></svg>
         </i>
     </div>
     ```
     

##### defs和symbol的区别

> https://blog.csdn.net/chy555chy/article/details/53364561

### 怎么引用？

##### 引入svg图标

> 引入svg图标有两种方式，分别是 **手动引入** 以及 通过**阿里iconfont平台**引入

1.手动引入

- 在项目某个文件夹下，创建一个svg文件夹，专门存放svg图片
- 通过webpack的svg-sprite-loader将svg文件夹进行合并，产生svg 雪碧图

2.通过阿里iconfont平台引入

- 将下载好的文件，按照字体图标的方式引入即可；**因为下载的文件已经是svg雪碧图**

##### 使用svg图标

1.手动引入方式的使用

- svg-sprite-loader产生雪碧图后，还会帮我们将产生好的**雪碧图挂到根节点（body下的首个子元素）**
- 将雪碧图挂好后，利用 **svg的特性**，即可在业务中随意使用

2.通过阿里平台的引入方式的使用

- 引入后，引入的文件中有脚本帮我们将雪碧图挂到根节点
- 将雪碧图挂好后，利用 **svg的特性**，即可在业务中随意使用

##### 组件封装（业务中使用svg图标的统一入口）

```vue
<template>
  <i class="svg-icon">
      <svg>
        <use :xlink:href="`#${name}`"></use>
      </svg>
  </i>
</template>

<script>
  export default {
    name: 'icon',
    props: {
      name: {
        type: String,
        required: true,
      },
    },
  }
</script>
<style lang="less" scoped>
    .svg-icon {
        box-sizing: border-box;
        display: inline-block;
        color: inherit;
        font-style: normal;
        vertical-align: -0.125em;
        line-height: 0;
        text-align: center;
        
        // 防止图标加载时，突然出现产生抖动，所以添加最小宽高
        min-width: 1em;
        min-height: 1em;
        
        svg {
            width: 1em;
            height: 1em;
            line-height: 1;
            fill: currentcolor;
        }
    }
</style>
```

##### 动态引入和静态引入（减少包体积）
