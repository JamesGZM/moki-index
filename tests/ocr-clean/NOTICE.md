# OCR 规则的来源

算法参考用户维护的 jev-chat-jarvis `main` @ `290317ca38f9df471279c9afdd1dc4f5c0210c08`。来源清单见 `docs/upstream/jev-ocr-rule-source.json`。

保留时间、标题范围、行距分组、循环尾巴及飞书判断的可迁移部分；没有复制无障碍节点采集、联系人或昵称逻辑。fixture 的消息与会话名均为合成数据；旧测试未给出的纵坐标不冒充设备采样。全宽飞书气泡不能仅凭 OCR 证明说话人，迁移结果保守为 `unknown`。所有 `# CAL` 和 calibration 项均待用户真机校准。

上游许可：

```text
MIT License

Copyright (c) 2026 Finderchangchang and the jev-chat contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
