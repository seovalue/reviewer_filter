GitHub PR Review Filter

개요
- GitHub PR(풀 리퀘스트) 페이지에서 특정 리뷰어의 코멘트만 간단히 필터링하는 Chrome/Edge 확장 프로그램입니다.
- Manifest V3 기반의 콘텐츠 스크립트로 동작하며, 추가 권한 없이 GitHub PR 페이지에서만 실행됩니다.

지원 브라우저
- Chrome 88+ (Chromium 기반)
- Microsoft Edge 88+
- Brave, Arc 등 Chromium 기반 브라우저

설치 방법 (Unpacked)
1) 이 저장소를 다운로드합니다.
   - GitHub 페이지 우측 상단의 `Code` → `Download ZIP` 선택 후 압축을 해제합니다.
   - 또는 `git clone`으로 가져옵니다.
2) 브라우저에서 확장 프로그램 관리 페이지를 엽니다.
   - Chrome/Brave: `chrome://extensions`
   - Edge: `edge://extensions`
3) 우측 상단의 개발자 모드(Developer mode)를 켭니다.
4) `Load unpacked`(압축해제된 확장 프로그램을 로드) 버튼을 누르고, 방금 받은 폴더를 선택합니다.
   - 폴더에는 `manifest.json`, `src/`, `icons/`가 포함되어 있어야 합니다.

사용 방법
- GitHub의 PR 페이지로 이동하면 우측 상단에 "Filter reviews:" 셀렉트 박스가 나타납니다.
- 드롭다운에서 리뷰어를 선택하면 해당 리뷰어의 코멘트만 보이도록 필터링됩니다.
- "All reviewers"로 되돌리면 모든 코멘트를 다시 볼 수 있습니다.

권한 및 동작 범위
- `content_scripts`가 `https://github.com/*/*/pull/*` URL에서만 동작합니다.
- 추가적인 권한(`permissions`)은 사용하지 않습니다.
- 사용자 데이터 수집/전송을 하지 않으며, 모든 로직은 로컬에서만 실행됩니다.

업데이트 방법
- 저장소의 최신 코드를 다시 받아 기존 폴더를 교체하면 됩니다.
- 이미 로드된 확장 프로그램은 확장 프로그램 페이지에서 "Reload"(새로고침) 버튼으로 갱신하세요.

문제 해결
- UI가 보이지 않거나 동작이 이상하면:
  - PR 페이지를 새로고침해 보세요.
  - 확장 프로그램 페이지에서 해당 확장을 "Reload"한 뒤 다시 시도하세요.
  - GitHub DOM 변경으로 선택자(Note: `.author`, `.js-timeline-item` 등)가 바뀌면 동작이 달라질 수 있습니다. 이 경우 이슈를 등록해 주세요.

제거 방법
- 확장 프로그램 페이지(`chrome://extensions` 또는 `edge://extensions`)에서 이 확장을 제거(Remove)하면 됩니다.

라이선스
- 별도 명시가 없으면 회사/프로젝트 정책에 따라 사용해 주세요.

