# Glarivo 服务器环境安装指令

> 用途：把本文从“给服务器 AI 的任务”开始完整发送给能够操作腾讯云 Linux 服务器的 AI。
>
> 当前范围仅是服务器基础环境安装和验收，不部署 Glarivo 项目代码，不修改域名或 Cloudflare，不配置 AI、邮件、支付等服务。

---

# 给服务器 AI 的任务

你正在配置一台新购买的腾讯云 Linux 服务器。服务器使用宝塔 Linux 面板镜像，未来用于运行 `glarivo.com` 的简洁版独立站。

请完成服务器基础环境安装、最小化安全配置和验收，并用中文返回最终报告。先探测现状，再决定安装方式；不得假设操作系统、包管理器、宝塔路径、Nginx 用户或 PostgreSQL 配置路径。

## 一、最终目标

服务器最终应具备以下环境：

| 项目 | 目标 |
|---|---|
| Web 入口 | 宝塔管理的单一 Nginx 实例 |
| JavaScript 运行时 | Node.js 24 LTS 最新补丁版本 |
| 包管理器 | Node.js 自带的 npm |
| 进程管理 | 宝塔 Node 项目管理器自带 PM2，或单一系统级 PM2 |
| 数据库 | PostgreSQL 16 或宝塔稳定支持的更高版本 |
| 数据库监听 | 仅 `127.0.0.1` / localhost，不允许公网访问 |
| 应用用户 | 非 root 用户 `glarivo` |
| 应用目录 | `/www/wwwroot/glarivo` |
| Next.js 预留端口 | `127.0.0.1:3000`，不得对公网开放 |
| 公网端口 | 仅业务端口 80、443；SSH 和宝塔端口限制可信管理员 IP |

Node.js 必须选择 24 LTS，不要安装已经停止维护的 Node.js 20，也不要选择仍处于 Current、尚未进入 LTS 的版本。

## 二、严格范围与禁止事项

本次可以执行：

- 只读检查服务器现状；
- 安装系统安全更新和必要基础工具；
- 复用或安装 Nginx、Node.js 24 LTS、npm、PM2、PostgreSQL；
- 创建低权限应用用户、项目目录、数据库和数据库角色；
- 创建生产环境变量文件；
- 验证服务、端口、权限和开机启动状态；
- 输出腾讯云控制台和宝塔防火墙仍需人工核对的规则。

本次禁止执行：

- 不部署或上传 Glarivo 项目代码；
- 不执行 `prisma migrate`、`npm run build` 或启动 Next.js；
- 不配置 Nginx 的 `glarivo.com` 正式站点或反向代理；
- 不修改 DNS、Cloudflare、域名解析或 SSL 模式；
- 不申请正式域名证书；
- 不安装 Docker、MySQL、MariaDB、Redis、PHP、Apache、FTP、phpMyAdmin；
- 不安装邮件服务器、SMTP、AI 服务、支付、聊天、对象存储或监控 SaaS；
- 不卸载或覆盖宝塔镜像中已有的软件；
- 不删除任何已有网站、数据库、用户、证书、配置或备份；
- 不运行来源不明的脚本，不使用未经检查的 `curl | bash`；
- 不把密码、私钥、令牌或完整环境变量内容输出到聊天或命令日志；
- 不擅自修改 SSH 端口、禁用 root 登录、关闭密码登录或重启服务器。

如需重启才能完成更新，先完成其余工作，在最终报告中标记 `REBOOT_REQUIRED`，等待用户明确批准后再重启。重启后必须重新验收。

## 三、停止条件

遇到以下任一情况时停止有风险的写操作，保留已经收集的证据并向用户说明：

1. 操作系统已经停止维护，或不是受支持的 64 位 Linux；
2. 根分区剩余空间不足 10 GB；
3. 发现两个 Nginx、两个 PostgreSQL 或两套 Node.js 管理方式可能冲突；
4. 发现服务器已有网站、数据库或自定义配置，而修改可能影响它们；
5. 当前 SSH/宝塔管理端口不明确，防火墙改动可能导致失联；
6. 宝塔安装的软件与系统包管理器安装的软件占用同一端口；
7. 软件安装需要不可信第三方仓库或无法校验的二进制文件；
8. 数据库已经存在同名角色或数据库，且无法确认其用途；
9. 需要用户提供腾讯云账号、API 密钥、域名权限或其他秘密信息；
10. 任一关键验证失败且原因不明。

不要为了“继续执行”而删除旧服务、全开放端口或降低安全设置。

## 四、阶段 1：只读预检

先执行只读检查，并把结果保存在本次任务记录中。不要输出宝塔初始密码、数据库密码、SSH 私钥或环境变量值。

至少检查：

```bash
cat /etc/os-release
uname -a
uname -m
id
uptime
free -h
df -hT
timedatectl
ip -brief address
ss -lntup
```

然后检查以下内容，命令不存在时记录为“未安装”，不要因此中断：

```bash
command -v bt
command -v nginx
command -v node
command -v npm
command -v pm2
command -v psql
command -v postgres
```

检查宝塔但不要执行会显示初始账号密码的 `bt 14`。可以检查：

- `/www/server/panel` 是否存在；
- 宝塔服务是否运行；
- 宝塔实际管理端口，但最终报告只写端口号，不写安全入口、用户名或密码；
- 宝塔是否已经管理 Nginx、Node.js 或 PostgreSQL；
- 宝塔 Nginx 是否位于 `/www/server/nginx`；
- 当前有哪些站点和数据库，仅报告名称和数量，不读取业务数据。

检查服务来源，防止重复安装：

```bash
systemctl list-unit-files --type=service | grep -Ei 'nginx|postgres|pm2|bt' || true
ps -ef | grep -Ei '[n]ginx|[p]ostgres|[p]m2|BT-Panel' || true
```

预检结论必须明确回答：

- 操作系统及版本是否仍受维护；
- CPU 架构是 `x86_64` 还是 `aarch64`；
- 内存、Swap 和磁盘是否足够；
- 宝塔是否正常；
- Nginx、Node.js、PM2、PostgreSQL 是已安装、缺失还是存在冲突；
- 22、80、443、3000、5432 和宝塔端口当前如何监听；
- 服务器是否看起来是干净新机。

若没有命中停止条件，可以继续后续阶段，不必为普通且可安全判断的分支反复询问用户。

## 五、阶段 2：系统基础环境

### 5.1 更新系统

根据实际发行版选择对应包管理器，先刷新软件索引，再安装安全更新。不得把 Ubuntu/Debian 命令直接用于 RHEL 系发行版，反之亦然。

建议安装的基础工具：

- `ca-certificates`
- `curl`
- `wget`
- `git`
- `rsync`
- `unzip`
- `xz` 或 `xz-utils`
- `tar`
- `jq`
- `openssl`
- `lsof`
- `acl`
- `logrotate`
- `python3`
- C/C++ 编译工具链和 `make`

安装后不要自动清理不认识的软件包，也不要执行具有扩大删除范围风险的 autoremove。

如果更新提示需要重启，只记录，不立即重启。

### 5.2 条件式 Swap

只有同时满足以下条件时才创建 Swap：

- 物理内存小于 4 GB；
- 当前没有可用 Swap；
- 根分区剩余空间至少 10 GB；
- 云平台或系统没有明确禁止 Swap。

满足条件时创建 2 GB Swap 文件，权限必须为 `600`，启用后以幂等方式写入 `/etc/fstab`，避免重复条目。创建完成后验证：

```bash
swapon --show
free -h
```

若条件不满足，不创建，只在报告中说明。

### 5.3 时间与主机信息

- 确认 NTP 时间同步正常；
- 不随意更改现有时区；
- 记录服务器时区供应用部署时使用；
- 不修改公网 IP、内网 IP、路由或 DNS resolver。

## 六、阶段 3：应用用户和目录

### 6.1 创建应用用户

检查 `glarivo` 用户是否存在。

- 不存在：创建普通用户 `glarivo`，home 为 `/home/glarivo`，shell 为 `/bin/bash`；
- 已存在：检查 UID、home、shell 和所属组，不覆盖；
- 不给它设置可公开使用的密码；
- 不加入 root 组；
- 不授予无范围限制的免密 sudo；
- 当前阶段不要求该用户直接通过 SSH 登录。

后续 Next.js 和 PM2 进程必须以 `glarivo` 用户运行，不能以 root 运行。

### 6.2 创建目录

创建以下目录，操作必须幂等：

```text
/www/wwwroot/glarivo/
  releases/
  shared/
    uploads/
      products/
      blog/
      .trash/
    logs/
  backups/
    database/
    uploads/
    config/
```

此时不要创建 `current` 软链接，因为还没有任何正式 release。

权限要求：

- `/www/wwwroot/glarivo`、`releases`、`shared` 由 `glarivo` 用户管理；
- `shared/.env.production` 最终权限必须为 `600`；
- `uploads` 由 `glarivo` 可写；
- Nginx 运行用户只需对未来公开图片拥有读取和目录遍历权限；
- 不使用 `chmod -R 777`；
- 不把 `backups` 配置成 Nginx 可访问的站点目录；
- 目录使用合理的 `750`、`750/2750` 或 ACL，不对所有系统用户开放写权限。

必须先从实际 Nginx 配置或进程中确定其运行用户，例如宝塔常见的 `www`。不要盲目假设用户名。如果使用组权限或 ACL 让 Nginx 读取 uploads，记录实际采用的方式。

## 七、阶段 4：Nginx

### 7.1 只保留一套 Nginx

优先复用宝塔镜像已经安装和管理的 Nginx。

- 若宝塔已有 Nginx：不要再通过 `apt`、`dnf` 或其他方式安装第二套；
- 若系统已有非宝塔 Nginx：确认宝塔是否管理它，不能直接覆盖；
- 若完全未安装：优先通过宝塔软件商店安装稳定版 Nginx；
- 若服务器 AI 无法安全使用宝塔软件商店，不要自行叠加第二种安装方式，先向用户报告。

当前阶段只要求 Nginx 服务正常，不创建 `glarivo.com` 虚拟主机、不配置反向代理、不申请证书。

验证：

- 找到正在使用的 Nginx 二进制绝对路径；
- 输出版本；
- 使用对应二进制执行配置测试；
- 确认服务运行；
- 确认实际配置目录和日志目录；
- 本机访问 `http://127.0.0.1` 能得到 HTTP 响应即可，状态码可以是宝塔默认站点的 200、403 或 404；
- 不修改已有默认站点来伪装成功。

## 八、阶段 5：Node.js 24 LTS 和 PM2

### 8.1 Node.js 安装原则

先判断宝塔是否已有 Node.js 版本管理器或 Node 项目管理器。

优先顺序：

1. 宝塔已有 Node.js 管理器时，通过它安装 Node.js 24 LTS 最新补丁版本并设为本项目可用版本；
2. 宝塔没有相关能力时，使用 Node.js 官方发布的 64 位 Linux 二进制，并验证官方 `SHASUMS256.txt`；
3. 不使用无法审计的第三方一键安装脚本；
4. 不从源代码编译已有官方预编译包支持的 Node.js；
5. 不同时保留多套会造成 PATH 混乱的全局 Node.js。

如果服务器已经安装 Node.js：

- v24 LTS：保留并更新到同一大版本最新安全补丁；
- v22 LTS：不要立即删除，先安装并验证 v24，再确认默认 PATH；
- v20 或更旧：视为不满足要求，但不要在未验证 v24 前卸载；
- v26 Current：不能作为本项目默认生产运行时，改用 v24 LTS。

验证时以 `glarivo` 用户执行：

```bash
node --version
npm --version
node -p "process.platform + ' ' + process.arch"
node -p "process.execPath"
npm config get prefix
```

验收条件：`node --version` 必须为 `v24.x.x`，并且 `glarivo` 用户在非交互 shell 中也能找到同一个 Node.js。

### 8.2 PM2

先判断宝塔 Node 项目管理器是否已经提供 PM2。

- 已提供：复用，不再全局安装第二套；
- 未提供：在当前 Node.js 24 环境中安装官方最新版 PM2；
- PM2 守护进程未来必须以 `glarivo` 用户运行；
- 当前没有应用代码，因此只安装并验证 PM2，不创建假进程，不执行 `pm2 save`；
- `pm2 startup` 和 `pm2 save` 留到首次应用部署、PM2 中已有 `glarivo` 进程后执行；
- 不启用 cluster 模式，首版未来只运行一个 fork 实例；
- 不启用 watch。

以 `glarivo` 用户验证：

```bash
pm2 --version
pm2 ping
pm2 list
```

允许进程列表为空。记录 PM2 二进制绝对路径，以便未来 Node.js 升级后重新生成 startup 配置。

## 九、阶段 6：PostgreSQL

### 9.1 安装原则

先检查服务器上是否已有 PostgreSQL 以及由谁管理。

- 已有宝塔管理的 PostgreSQL 16 或更高稳定版本：复用；
- 已有兼容版本且包含业务数据：不升级、不覆盖，先报告；
- 完全没有：优先通过宝塔软件商店安装 PostgreSQL 16；
- 宝塔确实不支持时，才考虑发行版官方仓库或 PostgreSQL 官方 PGDG 仓库；
- 不安装第二个占用 5432 的实例；
- 不安装 pgAdmin 或对公网开放的数据库管理工具。

### 9.2 网络与认证

读取实际配置路径，不凭经验硬编码：

```sql
SHOW server_version;
SHOW config_file;
SHOW hba_file;
SHOW listen_addresses;
SHOW port;
SHOW password_encryption;
```

配置目标：

- `listen_addresses` 为 `localhost` 或 `127.0.0.1`；
- 端口保持 `5432`；
- 密码认证使用 `scram-sha-256`；
- `pg_hba.conf` 只允许本机所需连接；
- 不存在把 `glarivo` 数据库开放给 `0.0.0.0/0` 或 `::/0` 的规则；
- 腾讯云安全组和服务器防火墙都不开放 5432。

修改 PostgreSQL 配置前：

1. 备份原配置文件到 `/www/wwwroot/glarivo/backups/config/`；
2. 保留原所有者、权限和时间戳信息；
3. 只做最小改动，不覆盖整个配置文件；
4. 先检查配置，再 reload/restart；
5. 若重启数据库可能影响已有业务，停止并报告。

### 9.3 创建数据库和角色

目标：

- 数据库：`glarivo`
- 登录角色：`glarivo_app`
- 数据库所有者：`glarivo_app`
- 编码：UTF-8
- `glarivo_app` 不得是 superuser；
- 不得拥有 `CREATEDB`、`CREATEROLE` 或 replication 权限。

先判断数据库和角色是否存在：

- 都不存在：创建；
- 任一已存在：检查所有者和权限，不覆盖密码、不删除对象；
- 发现来源不明：停止此步骤并报告。

生成至少 32 字节的随机、URL 安全数据库密码。密码不得：

- 出现在聊天回复中；
- 出现在命令行参数、进程列表或 shell history 中；
- 写入全局可读文件；
- 与 Linux 用户密码或宝塔密码相同。

推荐使用交互式 `createuser --pwprompt`，或在关闭命令回显、禁用历史记录并设置 `umask 077` 的受控会话中完成。用完立即清除临时变量和临时文件。

创建后验证：

- 使用 `glarivo_app` 通过 `127.0.0.1:5432` 登录 `glarivo`；
- 能创建和删除一张仅用于验收的临时表；
- 不能创建其他数据库；
- 不能创建角色；
- 从服务器公网 IP 不能连接 5432；
- `ss -lntp` 不得显示 PostgreSQL 监听 `0.0.0.0:5432` 或 `[::]:5432`。

验收临时表必须在测试结束后删除；不得删除任何非本次创建的数据对象。

## 十、阶段 7：生产环境变量文件

如果 `/www/wwwroot/glarivo/shared/.env.production` 已存在，不覆盖，先报告。

若不存在，创建该文件并设置：

- 所有者：`glarivo`；
- 权限：`600`；
- 不使用 BOM；
- Unix LF 换行；
- 不在最终报告中显示任何秘密值。

文件结构：

```dotenv
NODE_ENV="production"
PORT="3000"
DATABASE_URL="postgresql://glarivo_app:GENERATED_URL_SAFE_PASSWORD@127.0.0.1:5432/glarivo?schema=public"
SESSION_SECRET="GENERATED_RANDOM_SECRET"
NEXT_PUBLIC_SITE_URL="https://glarivo.com"
UPLOAD_DIR="/www/wwwroot/glarivo/shared/uploads"
UPLOAD_PUBLIC_BASE="/uploads"
```

具体要求：

- `DATABASE_URL` 使用刚创建并已验证的数据库密码；
- 密码若包含特殊字符必须正确 URL 编码，优先直接生成十六进制或其他 URL 安全密码；
- `SESSION_SECRET` 使用密码学安全随机值，至少 32 字节；
- 只允许公开值使用 `NEXT_PUBLIC_` 前缀；
- 不加入任何 AI、SMTP、邮件、R2、COS、支付、聊天、IndexNow 或分析服务变量；
- 不额外创建包含相同明文秘密的普通文本副本；
- 最终只报告文件路径、所有者、权限和变量名列表，不报告变量值。

检查权限时使用不会打印内容的命令，例如：

```bash
stat -c '%U %G %a %n' /www/wwwroot/glarivo/shared/.env.production
```

## 十一、阶段 8：防火墙和端口核对

需要同时区分三层：

1. 腾讯云 CVM 安全组或轻量应用服务器防火墙；
2. 宝塔/系统防火墙；
3. 服务自身监听地址。

目标矩阵：

| 端口 | 用途 | 公网策略 |
|---|---|---|
| 实际 SSH 端口 | 管理 | 仅管理员公网 IP/CIDR |
| 实际宝塔端口 | 面板 | 仅管理员公网 IP/CIDR |
| 80/TCP | HTTP | 公网允许 |
| 443/TCP | HTTPS | 公网允许 |
| 3000/TCP | Next.js | 腾讯云和本机防火墙均不放行；未来只监听 127.0.0.1 |
| 5432/TCP | PostgreSQL | 腾讯云和本机防火墙均不放行；只监听 localhost |
| 21/FTP | FTP | 不放行 |
| 其他数据库管理端口 | 管理工具 | 不放行 |

服务器 AI 不应要求用户提供腾讯云 API 密钥。若没有腾讯云控制台能力，只输出用户需要在控制台核对的规则，不伪称已经完成。

对宝塔/系统防火墙进行管理端口改动前，必须同时知道：

- 当前实际 SSH 端口；
- 当前实际宝塔端口；
- 用户的管理员公网 IP/CIDR；
- 腾讯云侧对应端口已先行放行；
- 至少保留一个已经测试成功的管理会话。

只要其中一项未知，就不得收紧或变更 SSH/宝塔端口，以免服务器失联。可以安全地核对 80、443，以及确认 3000、5432 没有公网监听。

绝对禁止使用“所有协议、全部端口、所有来源”规则。

## 十二、阶段 9：最终验收

### 12.1 版本和路径

以实际运行用户检查并记录：

```bash
node --version
npm --version
pm2 --version
nginx -v
psql --version
git --version
```

记录：

- Node.js 绝对路径；
- npm 绝对路径；
- PM2 绝对路径；
- Nginx 二进制和配置目录；
- PostgreSQL 版本、数据目录、配置文件和 `pg_hba.conf` 路径；
- 宝塔面板版本及端口，但不输出安全入口和凭据。

### 12.2 服务

确认：

- 宝塔运行正常；
- Nginx 配置测试成功且服务运行；
- PostgreSQL 服务运行且开机启动；
- Node.js 24 对 `glarivo` 用户可用；
- PM2 对 `glarivo` 用户可用；
- PM2 进程列表为空属于正常，因为本次不部署应用；
- 没有额外 Nginx 或 PostgreSQL 实例抢占端口。

宝塔安装的软件未必由标准 systemd 单元管理。应使用实际对应的控制命令检查，不能因为 `systemctl` 找不到服务就误判失败。

### 12.3 网络监听

再次检查：

```bash
ss -lntup
```

必须满足：

- PostgreSQL 只监听 `127.0.0.1:5432`、`[::1]:5432` 或 Unix socket；
- 3000 当前没有进程监听；
- 不存在意外开放的 MySQL、Redis、FTP、邮件或数据库管理端口；
- Nginx 运行后 80 可监听；443 可在正式证书配置阶段启用，若当前未配置证书可标为“待域名部署阶段”；
- SSH 和宝塔管理端口保持可用。

### 12.4 权限

检查但不输出文件内容：

- `glarivo` 不是 root；
- 项目目录由正确用户管理；
- `.env.production` 为 `600`；
- uploads 可由 `glarivo` 写入、Nginx 读取；
- backups 不可通过 Nginx 直接访问；
- 不存在 `777` 项目目录或环境文件。

### 12.5 数据库

确认：

- 数据库 `glarivo` 存在；
- 角色 `glarivo_app` 存在且无超级权限；
- 应用凭据通过 localhost 连接成功；
- 密码认证为 SCRAM；
- 5432 不对公网监听或放行；
- 临时验收表已删除。

### 12.6 不重启验证的边界

本次在没有用户明确批准前不要重启服务器。最终报告必须说明：

- 当前是否需要重启；
- 哪些更新需要重启；
- Nginx/PostgreSQL 是否已配置开机启动；
- PM2 startup 为什么要等首次应用部署后再配置；
- 重启后的最终恢复验证仍是否待完成。

## 十三、最终报告格式

完成后只返回一份中文报告，不回显秘密。使用以下结构：

```text
# Glarivo 服务器环境安装报告

总体结果：PASS / PASS WITH WARNINGS / FAIL
完成时间：
服务器系统：
CPU 架构：
内存 / Swap：
磁盘可用空间：
时区与 NTP：

## 已完成
- ...

## 软件版本与实际路径
- 宝塔：版本、状态、端口（不写安全入口和凭据）
- Nginx：版本、二进制、配置目录、管理方式
- Node.js：版本、绝对路径
- npm：版本、绝对路径
- PM2：版本、绝对路径、运行用户
- PostgreSQL：版本、配置路径、监听地址

## 用户与目录
- glarivo 用户：
- /www/wwwroot/glarivo：所有者和权限
- .env.production：只写路径、所有者、权限和变量名，不写值
- uploads 权限方案：

## 数据库
- glarivo 数据库：存在/失败
- glarivo_app 角色：权限摘要
- localhost 连接测试：通过/失败
- 公网监听：否/是

## 端口检查
- SSH：端口和来源限制状态
- 宝塔：端口和来源限制状态
- 80：
- 443：
- 3000：不得公网监听
- 5432：只允许 localhost
- 其他异常监听：

## 腾讯云控制台仍需用户核对
- 实例类型：CVM / Lighthouse / 无法从服务器确定
- 安全组或实例防火墙规则：
- 管理员公网 IP/CIDR 是否已限制：

## 未执行且符合范围
- 未部署项目代码
- 未配置 Nginx 正式站点
- 未修改 DNS/Cloudflare
- 未配置 SSL 证书
- 未安装 AI、邮件、支付、对象存储等服务

## 警告或待办
- ...

REBOOT_REQUIRED=true/false
REBOOT_VERIFICATION_PENDING=true/false
```

如果总体结果不是 PASS，必须给出：

1. 失败的准确步骤；
2. 原始错误摘要，但要脱敏；
3. 已经尝试的安全处理；
4. 当前服务是否仍正常；
5. 下一步建议；
6. 不得用开放端口、关闭认证或删除数据的方式绕过失败。

---

# 用户发送前需要知道的两件事

1. 如果希望服务器 AI 同时收紧 SSH 和宝塔面板来源 IP，请另行提供你当前的固定公网 IP/CIDR；不知道时不要让它自动修改管理端口规则。
2. 腾讯云安全组或轻量应用服务器防火墙通常需要在腾讯云控制台核对。服务器内部 AI 无法仅凭 SSH 命令证明腾讯云侧规则已经正确。

# 当前阶段完成后仍未做的工作

环境安装完成不代表网站已经上线。后续还需要：

1. 完成 Glarivo 项目代码；
2. 上传或从私有 Git 仓库拉取 release；
3. 执行依赖安装、Prisma migration 和生产构建；
4. 建立 `current` 软链接；
5. 配置 PM2 应用和开机恢复；
6. 配置宝塔 Nginx 反向代理；
7. 配置域名 DNS、SSL 和 Cloudflare；
8. 进行数据库、uploads 和配置文件备份；
9. 完成上线验收。

# 参考依据

- [Node.js 发布状态](https://nodejs.org/en/about/previous-releases)
- [Next.js 自托管指南](https://nextjs.org/docs/app/guides/self-hosting)
- [PostgreSQL pg_hba.conf](https://www.postgresql.org/docs/current/auth-pg-hba-conf.html)
- [PM2 开机启动说明](https://pm2.keymetrics.io/docs/usage/startup/)
- [宝塔端口规则](https://docs.bt.cn/user-guide/security/firewall/port-rule)
- [腾讯云安全组问题](https://cloud.tencent.com/document/faq/213/43698)
