# NMIXX Streaming Ranking

엔믹스 곡별 스트리밍 인증 및 순위 사이트입니다. 팬들이 스트리밍 인증을 업로드하고 순위를 경쟁할 수 있습니다.

## 기술 스택

### Frontend
- **React** with TypeScript
- **Vite** - 빌드 도구
- **Framer Motion** - 애니메이션
- **Axios** - API 통신
- **React Dropzone** - 파일 업로드

### Backend
- **Flask** - Python 웹 프레임워크
- **Flask-SQLAlchemy** - ORM
- **Flask-CORS** - CORS 지원
- **PostgreSQL** - 데이터베이스

## 주요 기능

- 🎵 엔믹스 곡 목록 조회
- 📸 스트리밍 인증 스크린샷 업로드
- 🏆 실시간 리더보드 (전체/오늘/이번주/이번달)
- 📊 통계 대시보드
- 🎨 홀로그래픽 Y2K 디자인
- 📱 완벽한 반응형 디자인

## 시작하기

### 사전 요구사항

- Node.js 18+
- Python 3.9+
- PostgreSQL 14+

### 데이터베이스 설정

1. PostgreSQL 데이터베이스 생성:
```bash
createdb nmixx_streaming
```

2. 스키마 적용:
```bash
psql -d nmixx_streaming -f database/schema.sql
```

### Backend 설정

1. 가상환경 생성 및 활성화:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

2. 의존성 설치:
```bash
pip install -r requirements.txt
```

3. 환경 변수 설정:
```bash
cp .env.example .env
# .env 파일을 편집하여 데이터베이스 연결 정보 등을 설정
```

4. Flask 서버 실행:
```bash
python app.py
```

서버는 `http://localhost:5000`에서 실행됩니다.

### Frontend 설정

1. 의존성 설치:
```bash
cd frontend
npm install
```

2. 환경 변수 설정:
```bash
cp .env.example .env
# 필요시 API URL 수정
```

3. 개발 서버 실행:
```bash
npm run dev
```

프론트엔드는 `http://localhost:3000`에서 실행됩니다.

## API 엔드포인트

### Songs
- `GET /api/songs` - 모든 곡 조회
- `GET /api/songs/:id` - 특정 곡 조회

### Leaderboard
- `GET /api/leaderboard?filter=all|today|week|month` - 리더보드 조회

### Verifications
- `POST /api/verifications` - 스트리밍 인증 업로드
  - Form Data:
    - `username`: 사용자 이름
    - `songId`: 곡 ID
    - `streamCount`: 스트리밍 횟수
    - `proof`: 인증 스크린샷 (이미지 파일)
- `GET /api/verifications/:id` - 특정 인증 조회
- `PUT /api/verifications/:id/approve` - 인증 승인 (관리자)
- `PUT /api/verifications/:id/reject` - 인증 거부 (관리자)

### Stats
- `GET /api/stats` - 전체 통계 조회

### Users
- `GET /api/users/:username` - 사용자 프로필 조회

## 데이터베이스 스키마

### users
- 사용자 정보 저장
- username은 unique

### songs
- 엔믹스 곡 정보
- 총 스트리밍 횟수 자동 집계

### verifications
- 스트리밍 인증 정보
- 상태: pending, approved, rejected
- 자동으로 song의 total_stream_count 업데이트

## 프로젝트 구조

```
melon-streaming-ranking/
├── backend/
│   ├── app.py              # Flask 애플리케이션
│   ├── config.py           # 설정 파일
│   ├── models.py           # SQLAlchemy 모델
│   ├── requirements.txt    # Python 의존성
│   ├── .env.example        # 환경 변수 예시
│   └── uploads/            # 업로드된 파일
├── frontend/
│   ├── src/
│   │   ├── components/     # React 컴포넌트
│   │   ├── api/            # API 클라이언트
│   │   ├── App.tsx         # 메인 앱
│   │   └── main.tsx        # 엔트리 포인트
│   ├── package.json
│   └── vite.config.ts
├── database/
│   └── schema.sql          # PostgreSQL DDL
└── README.md
```

## 개발 가이드

### 새로운 곡 추가

데이터베이스에 직접 추가하거나 pgAdmin 등의 도구를 사용:

```sql
INSERT INTO songs (title, album, release_date, cover_image)
VALUES ('곡 제목', '앨범명', '2024-01-01', '이미지 URL');
```

### 스타일 커스터마이징

CSS 변수는 `frontend/src/index.css`에 정의되어 있습니다:
- 색상 테마
- 간격 (spacing)
- 글꼴 (typography)
- 애니메이션 속도

## 배포

### Backend (Flask)

추천 옵션:
- **Heroku** - PostgreSQL 애드온과 함께
- **Railway** - PostgreSQL 포함
- **DigitalOcean App Platform**

환경 변수 설정 필수:
- `FLASK_ENV=production`
- `DATABASE_URL` - PostgreSQL 연결 문자열
- `SECRET_KEY` - 강력한 시크릿 키

### Frontend (React)

추천 옵션:
- **Vercel** - 추천!
- **Netlify**
- **GitHub Pages**

빌드 명령어:
```bash
npm run build
```

빌드된 파일은 `dist/` 폴더에 생성됩니다.

## 라이선스

이 프로젝트는 개인 학습 및 팬 프로젝트 목적으로 제작되었습니다.

## 기여

이슈와 Pull Request를 환영합니다!

## 문의

문제가 발생하면 GitHub Issues에 등록해주세요.

---

Made with 💜 for NMIXX & NSWER
