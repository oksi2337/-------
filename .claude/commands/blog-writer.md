---
description: 경험 초안을 사용자의 네이버 블로그 문체 그대로 소제목이 있는 블로그 글로 작성합니다.
argument-hint: [경험 초안]
---

`blog-writer` 서브에이전트에 "$ARGUMENTS"에 대한 블로그 글 작성을 위임하세요. Task tool을 `subagent_type="blog-writer"`로 호출하고, prompt에 `$ARGUMENTS`를 그대로 전달하세요.

서브에이전트가 끝나면 저장 경로와 **🔴 채워주세요 목록을 생략하지 말고 그대로** 사용자에게 전달하세요 (소제목·이미지 개수는 한 줄 요약 가능).
