# Word Quest — 项目开发与维护指南（中文版）

**从教材学习需求到可持续维护的双语英语闯关网站**  
**GitHub：** https://github.com/realnt/wordquest  
**文档基线：** `main` 为 **v1.5.4**（[PR #21](https://github.com/realnt/wordquest/pull/21)），此前为 v1.5.3（[PR #20](https://github.com/realnt/wordquest/pull/20)）和 v1.5.2（[PR #9](https://github.com/realnt/wordquest/pull/9) 于 2026 年 10 月 21 日合并）  
**Cloudflare 正式网址：** https://wordquest.orbitlab.workers.dev/  
**GitHub Pages：** https://realnt.github.io/wordquest/  
**配套文档：** [项目总蓝图](Master_Blueprint.md) · [English Development Guide](Development_Guide_EN.md) · [AI 协作流程](AI_COLLABORATION.md)

本指南回答 **“Word Quest 是怎样一步步开发出来的、如何在自己的电脑上运行、怎样继续开发与发布？”**。它主要记录技术方法和维护流程。产品理念、教育原则、已经确认的需求与禁止随意改变的决策，以《[Master Blueprint](Master_Blueprint.md)》为准。

## 一、项目缘起：为什么要做这个网站？

最初的需求是为上海五四学制 **2024 年新版七年级英语上册**制作一款与教材同步的**英语构词、词义推理与词源闯关游戏**。单纯的中英单词卡或中文选择题达不到目标：学生应当利用英文情境、词块与逐级提示来思考，并在解出答案后获得简洁而准确的知识解释。

开发过程中逐步明确的核心要求：

- **教材同步：**单词、单元主题和 Word Study 重点以指定教材为依据。
- **英语优先：**通过英文完成主要任务；中文可以整体开启，也可以按段查看。
- **重视推理：**原创情境、选择题、词块拼装、两级提示、即时反馈。
- **词源严谨：**将构词法、语法作用、语义联系、借词历史区别开来，避免望文生义。
- **跨设备：**在 Windows 电脑和 iPhone 上以网页形式使用，不必注册。
- **保留进度：**同一浏览器、同一网站源（origin）下升级代码不能清空 XP 或已完成关卡。

目前数据集为 **6 个单元、109 关、265 个教材词汇及表达条目**。这些数量来自项目源数据，不代表本次又与纸质教材独立核对了一遍。

| 单元 | 单元名称 | 关卡 | 词汇/表达 | 能力目标 |
|---|---|---:|---:|---|
| U1 | Trying New Things | 23 | 43 | 复合词、发明主题、词语历史 |
| U2 | Strong Mind | 17 | 48 | 反义词、词族 |
| U3 | Jobs | 17 | 56 | 职业相关后缀 |
| U4 | Smart Home | 17 | 40 | 智能家居、语义网络 |
| U5 | Films | 17 | 42 | 否定、重复等前缀 |
| U6 | Mountains and Rivers | 18 | 36 | 词典使用、复合词 |
| **合计** | | **109** | **265** | |

## 二、开发过程：从一个单元到六个单元

Word Quest 不是一次性生成的网站，而是逐步通过学生使用体验、界面反馈与代码重构完成的。

| 阶段 | 关键工作 |
|---|---|
| v1.1–v1.2 | 完成第一单元的 23 关、43 词词汇库；支持中英文提示与解释 |
| v1.2.1–v1.3.2 | 校正词源表述与 `printing` 等语法说明；删除过长的词史面板，将核心故事直接放在解题结果中 |
| 学期扩展、v1.4 | 新增 U2–U6，合计 109 关；优化手机端紧凑布局 |
| v1.4.2–v1.4.6 | 加入单词/句子发音、英美口音、语速调节、声音选择与试听 |
| v1.4.7 | 声音设置收纳为小按钮；所有页面显示统一版本号 |
| v1.5.0 | 提取公共页头/页脚 `site-shell.js`，统一公共设计系统 `site.css` |
| **v1.5.1** | U1–U6 统一使用 `quest.js` 和 `quest.css`，U1 内容仍独立存放，旧存档兼容 |
| **v1.5.2** | [PR #9](https://github.com/realnt/wordquest/pull/9)（2026 年 10 月 21 日已合并）：修复已完成关卡重玩、增加内容校验和 Playwright 浏览器回归测试 |
| **v1.5.3** | [PR #20](https://github.com/realnt/wordquest/pull/20)：选项稳定随机排序、地图不再泄露答案、重复点错不再扣次数、所有单元“显示答案”均为 0 XP、页面语言标注 |
| **v1.5.4** | [PR #21](https://github.com/realnt/wordquest/pull/21)：22 个选择题改用更可信的同类干扰项；泄露答案的关卡标题与中文译文已改写；新增答案完整性及中文释义检查 |

**工程方法上的关键选择：**没有因为页面变复杂就全面重写成 React 应用，而是先保证已有功能与学习进度，再通过小型 Pull Request 逐步统一结构。这种方式也方便日后更换开发者或由 ChatGPT / Codex 继续维护。

## 三、代码架构：所有单元共用一个游戏引擎

```text
wordquest/
├── index.html                 学期主页
├── unit1.html ... unit6.html   各单元的轻量 HTML 入口
├── unit1-data.js              U1 关卡、译文、词史、章节和词汇
├── content.js                 U2–U6 的关卡、单元信息和词汇库
├── quest.js                   六个单元共用的游戏引擎
├── quest.css                  游戏关卡通用样式
├── site-shell.js              公共页头、导航和页脚
├── site.css                   设计变量、导航和响应式布局
├── site-version.js            网站可见版本号
├── speech.js                  浏览器发音、声音与口音偏好
├── speech.css                 发音按钮和设置弹层
├── tests/
│   ├── check_site.py          文件结构和页面检查
│   ├── test_engine.js         关卡、XP、存档兼容性
│   ├── test_layout.js         公共布局和版本号
│   └── test_speech.js         英美口音、声音选择、语速
├── .github/workflows/pages.yml   GitHub Actions 检查及发布
├── wrangler.jsonc             Cloudflare Worker 静态资源配置
└── docs/                      项目总蓝图与中英文开发指南
```

**v1.5.2 新增文件：**`package.json`、`playwright.config.js`、`tests/browser/wordquest.spec.js` 和 `tests/check_content.js` 均已合并到 `main`。

项目本体是**纯 HTML + CSS + JavaScript**。不依赖 React、构建打包器、用户数据库或后端业务 API，因而部署与离线开发相对简单。

### 页面运行流程

1. 学生打开 `unitN.html`；浏览器加载对应单元的题目数据及公共脚本。
2. `quest.js` 根据 `document.body.dataset.unit` 确认当前单元。
3. U1 的旧题目字段（如 `type`、`tokens`、词块数组 `answer`）由适配逻辑转换；U2–U6 使用 `mode`、`parts`、`options` 等字段。
4. 引擎从 `localStorage` 加载这个单元的旧学习进度，渲染 Play、Map、Word Vault、Results 等界面。
5. 学生点选答案或词块，事件处理更新状态、奖励 XP（首次完成时），再重新渲染。
6. `speech.js` 增强界面：句子朗读、单词发音、可折叠的声音控制。
7. `site-version.js` 在 Word Quest 名称旁添加版本标签。

### 为什么内容和引擎要分离？

每次增删教学题目，不应该同时复制六套 HTML 与业务逻辑。U1 的 23 关、五个章节、词语历史以及译文保留在 `unit1-data.js`，U2–U6 在 `content.js`。只有渲染和作答逻辑放进共用的 `quest.js`。

此前 U1 是一个庞大的自包含页面，而其余单元使用共享代码。v1.5.0 与 v1.5.1 分两步消除了这一不一致，并通过保留旧数据结构、旧存档键避免损害用户已有进度。

## 四、教材内容如何变成可以玩的关卡

建议每次增加或修改一道题时，按以下流程：

1. 从指定教材核对单元主题、目标词、拼写与 Word Study 学习重点。
2. 确定要锻炼的能力：词块组合、前后缀、语境推理、反义词、词典技能等。
3. 编写短小、有趣、信息充分的英文情境。
4. 编写一个明确的问题，再设计选项或词块（包含有意义的干扰项）。
5. 编写**两级提示**：先提示思考方法，再逐步缩小答案范围，不要提前泄题。
6. 编写解题说明；如果涉及词源，应核对证据并明确标为“构词”还是“借词历史”。
7. 补充自然的中文对应译文，检查单独查看和“中文辅助 ON”两种模式。
8. 实测正确答案、错误尝试、词块顺序、提示、结果、下关和旧存档。

### 选择题的数据结构（示意）

```js
{
  word: "example",
  mode: "choice",
  title: "Mission title",
  scene: "Original English situation.",
  question: "Which word fits?",
  options: ["example", "distractor"],
  answer: 0,
  hints: ["First hint", "Second hint"],
  explain: "Why the answer is correct."
  // 另有对应中文字段及正确分类的构词/词源说明
}
```

### 词块拼装题的数据结构（示意）

```js
{
  word: "waterfall",
  mode: "build",
  parts: ["FALL", "RIVER", "WATER"]
  // 学生依次选择 WATER + FALL。
}
```

U1 保留较早的题目格式，并明确保存正确词块顺序；验证程序不能只看字母拼接结果，还应考虑 U1 的老规则。**不能把拼写相似当成词源同源的证明。**

## 五、学习进度与本地存档：最不能破坏的部分

Word Quest 没有账号、云端学习记录或数据库。浏览器的 `localStorage` 保存已完成关卡、XP、错误次数、当前页签等。

| 数据 | 存储键 | 主要字段或内容 |
|---|---|---|
| U1 进度 | `wordquest_g7u1_v1` | 旧格式：`earned`、`maxUnlocked`、`misses`、`score` |
| U2–U6 进度 | `wordquest_g7uN_semester_v1` | `completed`、`unlocked`、`mistakes`、`points` |
| 英美口音 | `wordquest_speech_accent_v1` | `en-GB` / `en-US` |
| 声音选择 | `wordquest_speech_voice_v1` | 不同口音分别保存声线信息 |
| 朗读速度 | `wordquest_speech_speed_v1` | 0.80–1.20 |

**请勿随意修改或清除这些键。** U1 和其他单元存档格式不同，但游戏引擎已经兼容读写，无需以“统一结构”为理由清空或重建原有用户数据。

还要注意：

- 换浏览器、换设备或清理网站数据会造成原本的本地记录无法直接读取。
- Cloudflare Workers 网站与 GitHub Pages 网站是两个不同源，不会共享 `localStorage`。
- 同一网站源发布新的前端文件，通常不会影响该源现存的浏览器记录。
- 本阶段**不开发导入/导出存档、用户账号或自动跨设备同步**，除非产品需求明确改变。

**重玩状态：**v1.5.2 已包含 **Practice（练习）模式**：完成过的关卡可重新作答，但不重复获得 XP、不修改已保存的完成状态和错误记录。此处描述的是已合并代码；线上是否更新仍需单独核验。

## 六、中英文交互与语音朗读

### 双语学习

**中文辅助 OFF：**默认以英文呈现，学习者可按需打开特定情境、问题、提示和解释的中文。

**中文辅助 ON：**英文后紧跟中文辅助内容；答案和英语选择词仍以英文为主。翻译必须准确、简洁，不能在解题前泄露答案。

### 为什么选择浏览器原生发音？

项目采用 Web Speech API：`SpeechSynthesisUtterance` 和 `speechSynthesis.getVoices()`。因此**不用引入收费 TTS API，也不依赖某个国家或地区一定可以访问的 Google 语音服务**。

用户可以：

- 选择 UK（`en-GB`）或 US（`en-US`）发音。
- 从浏览器实际提供的声音列表里选择具体声音，并试听。
- 调整 0.80×–1.20× 的语速，默认 1.00×。
- 分口音保存声线，关闭弹层后界面保留一个简洁的声音设置按钮。

实际设备测试发现，某些 Windows 电脑上 Microsoft Hazel 和 Susan 虽是不同声音对象，却可能听起来一样；某些 iOS 声音虽然出现在列表中，实际播放不自然。根据特定 iPhone 的测试经验，可优先选 **Daniel（UK）**与 **Samantha（US）**，但无法保证所有系统版本都有这些声音。**真实设备体验仍需真人在 iPhone 上检验**；WebKit 模拟测试不能替代声线质量测试。

## 七、在本地电脑运行 Word Quest

### 环境准备

- Git：克隆仓库、创建分支。
- Python 3：启动本地 HTTP 静态服务器。
- Node.js：运行现有自动化检查。
- Chrome / Edge / Safari 等现代浏览器。
- 如果有 Cloudflare 部署权限，才需要考虑 Wrangler。

运行：

```bash
git clone https://github.com/realnt/wordquest.git
cd wordquest
python3 -m http.server 8080
```

Windows 下若 `python3` 不可用，可使用：

```powershell
py -m http.server 8080
```

在浏览器打开 **http://localhost:8080/**。推荐 HTTP 模式而不是直接双击本地 HTML，因为它与线上静态资源的加载方式更接近。

### 当前 `main`（v1.5.4）的测试方法

先运行静态检查、单元测试及全部关卡内容检查：

```bash
python3 tests/check_site.py
node --check quest.js
node --check unit1-data.js
node --check site-shell.js
node --check content.js
node --check speech.js
node --check site-version.js
npm run test:unit
```

再运行真实浏览器回归测试（桌面 Chromium 和移动屏幕尺寸 WebKit）：

```bash
npm install --no-audit --no-fund --package-lock=false
npx playwright install chromium webkit
npm run test:browser
```

Playwright 方案覆盖所有六个单元、导航、关卡重玩、存档、版本号和声音设置，分别在桌面 Chromium 与 iPhone 屏幕尺寸的 WebKit 下运行。它验证的是网页交互与布局，**不能证明物理 iPhone 上的系统发音一定正常**。

## 八、GitHub 工作流与版本发布

1. 从 `main` 拉取最新源代码，先查看是否有未合并 PR。
2. 创建独立功能分支，尽量让每个 PR 聚焦一个主题。
3. 修改对应内容、共享代码或样式，同时保留原有教材关卡和存档格式。
4. 增加相关回归测试，并在本地运行。
5. 发起 Pull Request，说明变更范围、风险、验收条件和测试结果。
6. **等待自动检查和人工审核，在获得明确同意前不直接合并到 `main`。**
7. 合并后分别查看 GitHub Actions 与 Cloudflare 的实际部署状态；打开公开网址验收。
8. 发布新版本时更新 `site-version.js` 和文档版本状态，避免“代码已经更新而文档仍是旧版”。

### GitHub Pages 与 Cloudflare 的区别

仓库中的 `.github/workflows/pages.yml` 是 GitHub Actions 测试与 GitHub Pages 发布流程。**浏览器测试任务固定使用 `ubuntu-24.04`**，因为当前 Playwright 1.56.1 无法在 Ubuntu 26.04 上安装浏览器；日后升级 Playwright 时可再评估。推送到 `main` 后，只有启用 Pages 且将构建来源设为 **GitHub Actions**，发布任务才能成功。

正式网站使用 **Cloudflare Worker + 静态资源**。`wrangler.jsonc` 描述 Worker 名称及资源目录；但 Cloudflare 仪表板里的 GitHub 关联、构建设置及访问权限**不包含在仓库源代码中**。因此复制仓库并不等于自动拥有现有 Cloudflare 项目的部署权限。

为延续学生在原浏览器保存的进度，应尽量继续使用同一个正式域名，而不是每次都新建 Worker 或换域名。合并后需分别查看 Cloudflare 的 **Workers Builds: wordquest** 检查结果及线上版本号，以及 GitHub Actions 的 `publish` 任务与 Pages 网址；**合并成功不等于两个站点都发布成功**。

## 九、如何安全维护与继续扩展

**修改内容：**核对教材词、拼写、中文、正确答案、干扰项、两级提示、词史来源；避免拼写似是而非的词根故事。

**修改游戏引擎：**逐一测试正确答案、错误次数、提示、词块顺序、下关、地图、词汇库、成绩页、旧存档恢复以及重复刷 XP 的风险。共享 `quest.js` 的一次改动可能影响所有单元。

**修改发音：**注意声音列表异步加载、不同浏览器的 voiceURI、所选声线暂时不可用、速度设置、弹层开启关闭和移动端系统限制。

**修改样式：**核对 375/390px 手机宽度与大屏桌面，检查可读性、触控目标、焦点状态、按钮遮挡和横向溢出。

**修改文档：**中英文开发指南必须同步更新同一技术事实；产品理念和已确认的设计约束优先更新《Master Blueprint》。

## 十、今后的优先事项

近期应优先提升真实教材核查、推理题型多样性、无障碍支持与真实 iPhone Safari 检查；v1.5.2 的重玩修复已经合并。现阶段不必为了“技术先进”引入重型框架或数据库，也不应在未经同意的情况下开发云同步或存档导入导出。

---

**项目初心：**让学生在英文中推理，发现一个真实且容易记住的词语联系，然后自然地进入下一关。
