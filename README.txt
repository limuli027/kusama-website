LINGMU · YAYOI KUSAMA INTERACTIVE WEB V16

V16 rebuilds the artwork archive as a pinned editorial scroll sequence:
- At the beginning, the artwork area is intentionally blank.
- The first scroll gently reveals the first work from the center.
- Continued scrolling staggers the remaining works into a 4×2 visual array.
- Native scrolling remains in control; visual movement is scrubbed with a soft requestAnimationFrame damping layer rather than forced page-by-page switching.
- After the array is formed, continued scrolling subtly pans the field like a camera moving across an exhibition wall.
- Copy, crosshair, progress and cards reveal progressively.
- Cards can still be clicked to jump smoothly to their position.
- Existing sidebar/menu, Kusama visual language and other sections are preserved.

Interaction direction references the pinned/scrubbed card movement seen in Orken World and the editorial project-grid / scroll animation approach of Obys Agency, while keeping the Kusama site content and visual identity original.


V14 更新说明
1. 新增开屏动画：红点从屏幕上方快速落下，短暂停顿后向四周扩散，形成覆盖全屏的规则波点矩阵，再平滑淡出进入首页。
2. 开屏动画支持移动端，并兼容 prefers-reduced-motion。
3. 完整加强手机端适配：首页标题、红球、时间线、作品卡片、作品详情弹窗、菜单、About 页面、阵列作品页等均增加移动布局。
4. LIFE 详情栏调整为深灰色，并增加悬停变红、白字效果；位置整体上移。
5. 暂未设置自定义域名。当前正式地址仍为：
   https://limuli027.github.io/kusama-website/
   以后购买域名后，再在 GitHub Pages 的 Custom domain 中配置即可。


V16 ARRAY ARCHIVE 更新：
- 替换前四个图片作品格：Pumpkin、Field（1989）、Bird 2（按提供文件名暂标，正式展签建议核对背签/图录）、Shellfish（1989）。
- 第五格视频保留，改为静态封面，点击后打开视频播放窗口。
- 作品卡支持鼠标点击、触屏点击和键盘 Enter/Space 打开详情。
- 视频关闭时停止播放。
