# calculator-js-lite · AITECC

> 招新考核训练场：一个只会加法的计算器网页——`js/main.js` 里只留了一个空的 `add()`，其余全靠你们的 PR 在这里长出来。怎么做、怎么评，一律看 [guidelines](https://github.com/GXMZU-AITECC/guidelines)，本仓不重复。

## 这个仓的特别之处

它是组织里**唯一对外部候选人开放**的仓库：还没入社的人靠在这里提 PR 进社团。所以除了 guidelines 的 12 条强制条款，本仓另有下面几条补充，只在这个仓生效。入社之后就不用在这里贡献了，内部协作走各项目仓库。

## 考核流程（本仓专属）

| 步 | 做什么 | 看哪条 |
| --- | --- | --- |
| 1 | 在 Issue 里选题并占题：评论写「认领：姓名 + fork 链接 + 计划分支名」 | B1 |
| 2 | fork 本仓，从 `develop` 拉 `feature/...` 分支 | B1 / B2 |
| 3 | 只改这一个功能；开工前 `git fetch upstream && git rebase upstream/develop` | B1 |
| 4 | 向 `develop` 提 PR，标题 `feat:` / `fix:`，描述三段，自查清单逐条勾 | C1–C4 |
| 5 | 在 **Reviewers 里 assign 至少 2 名技术部成员**（见下表），别只在正文打 @ | C5-1 |
| 6 | 至少 1 人批准，由技术部部长合并；合并后自动上线到 Pages，可点开验收 | C5 / E1 |

评审人（本仓可直接 assign）：`xwms`、`valacoynocecio475-prog`。

线上预览：<https://gxmzu-aitecc.github.io/calculator-interview/>（合并进 `develop` 后自动重建）

## 本仓补充要求（guidelines 没写的）

1. **只用原生 JS**：不引框架、不装依赖、不加构建工具；逻辑写在 `js/main.js` 一个文件里，不拆分层文件。
2. **一个 PR 只做一件事**：不许顺手重构、不许顺带改别人的函数、不许改 `css/style.css` 与显示区结构。
3. **验收要有图**：PR 描述附一张浏览器截图（打开 `index.html` 的实际效果），没图不算完成。
4. **题目与讨论不外传**：本仓技术上公开，但题目、代码、Issue 与 PR 讨论都是社团内部资产（D3），不要截图外发、不要挂到公开简历或博客。
5. **同题撞车**：以 Issue 里先占题的为准，后写的 PR 会被关闭，不算失败。

## 入社之后

合并过合格 PR 就通过考核，会被拉进组织；成员专属的入社指引（部门分化、权限、保密）在组织主页上，只有成员看得见。