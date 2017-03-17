# 移动web音乐播放器

## 启动方式
```
$ npm install
$ gulp
$ npm start
```
----

## 项目目录结构

```
/
app.js      # 主入口
public/     # 静态文件
    img/
    css/
    js/
node_modules/    # 模块文件夹
src/        # 源代码
    index.html
    less/
    js/
    img/
temp/       # 开发用服务器临时文件夹

```
-----

## 设计思路
1. mysql数据库保存用户信息表，表中包含用户名和经过md5加密的用户密码，通过数据库的增删改查实现用户的登录和注册等功能
2. 移动端touch系列事件的应用
3. 使用网易云音乐歌单API请求歌曲信息
4. 用户根据自身喜好，点击不同的歌单，通过Ajax请求歌曲信息生成相应的歌曲列表
5. 注意跨域问题的解决
7. 实现自动连播、单曲循环等多种播放模式
8. 单页应用的效果，在歌曲播放时可以整屏切换到其他页面而歌曲播放状态不受影响

### 说明
1. zepto.js 是一个适用于移动端的库，比jquery精简很多，但是主要功能都在
2. 更改播放器的src信息可以播放不同的音乐
3. 自动播放下一首的设计思路是在audio 的 ended 事件触发时修改src为新的歌曲，并且执行播放
4. 该音乐API非官方public，因此在解决跨域问题时需要搭建本地代理服务器（express+request）获取数据，得到数据后再返回给浏览器

## 数据库设计
### 用户表
#### 范例
id | username | password |
---| -------- | -------- |
1  | user1    | anyword  |
2  | user2    | anyword  |

#### 格式
item | 格式     | 备注
---  | ----    | ---
id   | int     | 主键，自增长
username | varchar(50) | 用户名
password | varchar(50) | 密码

