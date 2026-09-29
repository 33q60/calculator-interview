# calculator-interview · AITECC

> 招新考核训练场：一个只会加法的计算器网页——`js/main.js` 里只留了一个空的 `add()`，其余全靠你们的 PR 在这里长出来。题目自己提、自己认领；规矩只看 [协作规范 · 新人必读](https://github.com/GXMZU-AITECC/guidelines)：P 表管人，T 表管 PR，Issue 怎么写看 I 章，本仓不重复。

## 这个仓的特别之处

组织里**唯一对外部候选人开放**的仓库：还没入社的人靠在这里提 Issue、提 PR 进社团。题目不限计算器现有功能——你觉得它还缺什么，就提什么。除了协作规范的两张表，本仓另有几条只在这里生效的补充，见文末。入社之后不用再回来，内部协作走各项目仓库。

## 考核流程

| 步 | 做什么 | 对应红线 |
| :--- | :--- | :--- |
| 1 | **自己提题**：在 Issues 里按「功能提案」格式提一条（要什么 / 怎么用 / 验收标准 / 不做什么），再在下面回「认领：姓名 ＋ fork 链接 ＋ 分支名」占题。不知道怎么写就看 [23](https://github.com/GXMZU-AITECC/calculator-interview/issues/23)（示范） | **T9** |
| 2 | fork 本仓，从 `develop` 拉 `feature/...` 分支 | **T4** |
| 3 | 开工前同步基线：`git fetch upstream && git rebase upstream/develop` | **T5** |
| 4 | 向 `develop` 提 PR：标题 `feat:` / `fix:`，描述三段，自查清单逐条勾 | **T1、T6、T7、T8** |
| 5 | 在 **Reviewers** 里 assign 至少 2 名评审人，别只在正文打 @ | **T2** |
| 6 | ≥1 人批准，由 Reviewer 或管理员合并；合并后自动上线 Pages，点开就是你的验收 | **T2** |

评审人：管理员 `isryanyhliu`、`xwms`，以及 `reviewers` team 里被指派的人——Reviewers 下拉里搜得到谁就 assign 谁。

线上预览：<https://gxmzu-aitecc.github.io/calculator-interview/>

## 本仓补充（规范之外）

1. **只用原生 JS**：不引框架、不装依赖、不加构建工具；逻辑全写在 `js/main.js` 一个文件里，不拆分层。
2. **不改骨架**：显示区结构与 `css/style.css` 不动（T10 的具体化）。
3. **验收要有图**：PR 描述附一张浏览器实际效果截图，没图不算完成。
4. **不外传**：本仓技术上公开，但题目、代码、Issue 与 PR 讨论都是社团内部资产，不得截图外发或挂到公开简历、博客（**P0**）。
5. **同题撞车**：以 Issue 里先占题的为准，后写的 PR 关闭，不算失败（**P3**）。

## 通过了之后

PR 被合并 ＝ 通过考核，管理员把你拉进组织。之后组织主页会换成只有社员看得见的一页，那里写着你的身份、部门分流和接下来做什么。