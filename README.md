# kyokaketsu Photography Portfolio

这是一个简洁的个人摄影作品集网站，使用纯 HTML、CSS 和 JavaScript 制作，适合部署到 GitHub Pages。

## 文件结构

```text
.
├── index.html
├── style.css
├── script.js
├── README.md
└── images/
    ├── photo-01.jpg
    ├── photo-02.jpg
    └── ...
```

## 替换照片

把你的摄影作品放进 `images` 文件夹里。当前项目里的 `photo-01.jpg` 到 `photo-19.jpg` 已经使用不重复照片，并压缩成适合网页展示的版本。

最简单的方式是直接替换这些文件：

- `images/photo-01.jpg`
- `images/photo-02.jpg`
- `images/photo-03.jpg`
- 一直到 `images/photo-19.jpg`

建议上传到网站的图片控制在 2000px 宽以内，这样页面打开会更快。

如果你想改照片标题或地点，打开 `index.html`，修改每个作品卡片里的：

- `data-title`
- `data-place`
- `alt`
- `<figcaption>` 里的文字

## 修改联系方式

邮箱和 Instagram 链接在 `index.html` 的 Contact 区域里。

当前使用：

- 邮箱：`gongjiajie5@icloud.com`
- Instagram：`https://www.instagram.com/kyokaketsu/`

## 本地预览

方式一：直接双击 `index.html`，用浏览器打开。

方式二：在项目文件夹中启动一个本地预览服务：

```bash
python -m http.server 8000
```

然后在浏览器打开：

```text
http://localhost:8000
```

## 部署到 GitHub Pages

1. 新建一个 GitHub 仓库。
2. 上传 `index.html`、`style.css`、`script.js`、`README.md` 和 `images` 文件夹。
3. 打开仓库的 `Settings`。
4. 进入 `Pages`。
5. 在 `Build and deployment` 中选择 `Deploy from a branch`。
6. Branch 选择 `main`，文件夹选择 `/root`。
7. 保存后等待 GitHub 生成网站链接。

这个网站不需要后端、数据库或构建工具，上传后即可作为静态网站运行。
