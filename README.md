# 马倩怡 · 产品运营作品集

静态HTML、CSS、JavaScript作品集。GitHub保存网站源码，GitHub Pages提供公开访问；面试官访问不需要本机开机或启动服务。

- 公开网站：https://qianyima91.github.io/portfolio/
- 源码仓库：https://github.com/qianyima91/portfolio
- 发布状态：https://github.com/qianyima91/portfolio/actions

## 本地编辑

双击`编辑作品集.cmd`，会自动启动本地服务并打开 http://127.0.0.1:4173/admin/ 。修改文字、字体、图片、PDF和摄影排序后，点击“保存到网站”。原内容自动备份在`docs/backups/`。也可继续使用`启动网站.cmd`。

## 更新公开网站

仓库和Pages已于2026-10-27接通。双击`发布网站.cmd`，它会核对素材、构建公开版本、提交修改并推送GitHub。仓库Actions里的`Publish portfolio`显示绿色后，公开网址即更新。

本地编辑的“保存”仅写入本机。公开网址用于展示，不提供本地编辑接口；目前仍需在本机编辑后发布。GitHub登录由Git凭据管理器处理，不在代码中保存密码或密钥。

## 开发命令

需要Node.js 24和Git。首次克隆后运行`npm ci --ignore-scripts`安装锁定的图片构建依赖（sharp）；当前电脑已安装。

```sh
npm start
npm run check
npm run build
npm run verify:build
npm run publish
```

`content/site.json`管理文案和样式；`assets/`存放展示素材；`scripts/server.mjs`提供仅本机可用的编辑服务。`dist/`为生成文件。公开构建复制当前使用的素材，生成480/960/1600像素WebP预览和最大2400像素放大版本，按屏幕宽度选择；原图保留，不裁切或覆盖。生成缓存位于忽略的`tmp/image-cache/`，新上传图片下次发布自动优化。隐藏缺失材料占位，不包含编辑后台、备份或原始人物源图。

## GitHub Pages首次设置

仓库Settings → Pages → Source选择GitHub Actions。推送到`main`会触发`.github/workflows/pages.yml`，自动检查、构建并发布`dist/`。公开链接以Pages实际返回的地址为准。

免费GitHub Pages使用公开仓库；仅本网站源码和正在使用的素材进入仓库，作品集整理目录中的其他材料不上传。摄影、设计、PDF及经历内容保留原作者权利。
