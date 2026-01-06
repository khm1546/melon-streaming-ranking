pipeline {
  agent any

  environment {
    // Backend
    BACKEND_IMAGE_NAME = 'melon-backend-image'
    BACKEND_CONTAINER_NAME = 'melon-backend-container'
    BACKEND_PORT = '5555'
    
    // Frontend
    FRONTEND_IMAGE_NAME = 'melon-frontend-image'
    FRONTEND_CONTAINER_NAME = 'melon-frontend-container'
    FRONTEND_PORT = '3000'
  }

  stages {
    stage('📥 Clone') {
      steps {
        git url: 'https://github.com/khm1546/nmixx_food.git', branch: 'main', credentialsId: 'khm1546'
      }
    }

    stage('🐳 Docker Build - Backend') {
      steps {
        dir('backend') {
          sh '''
            docker build -t $BACKEND_IMAGE_NAME .
          '''
        }
      }
    }

    stage('🐳 Docker Build - Frontend') {
      steps {
        dir('frontend') {
          script {
            // API URL 설정
            // 브라우저에서 접근 가능한 백엔드 URL 필요
            // 환경변수 BACKEND_API_URL이 설정되어 있으면 사용, 없으면 localhost 사용
            // 실제 배포 시에는 서버 IP나 도메인으로 변경 필요
            // 예: 'http://your-server-ip:5555/api' 또는 'https://api.yourdomain.com/api'
            def apiUrl = env.BACKEND_API_URL ?: "http://localhost:${BACKEND_PORT}/api"
            sh """
              docker build -t ${FRONTEND_IMAGE_NAME} --build-arg VITE_API_URL=${apiUrl} .
            """
          }
        }
      }
    }

    stage('🧹 Remove Existing Containers') {
      steps {
        sh '''
          docker stop $BACKEND_CONTAINER_NAME || true
          docker rm $BACKEND_CONTAINER_NAME || true
          docker stop $FRONTEND_CONTAINER_NAME || true
          docker rm $FRONTEND_CONTAINER_NAME || true
        '''
      }
    }

    stage('🚀 Run Backend Container') {
      steps {
        sh '''
          docker run -d --name $BACKEND_CONTAINER_NAME -p $BACKEND_PORT:5000 --network pickgall-network \
            -v /home/centos/melon/uploads:/app/uploads \
            -v /home/centos/melon/.env:/app/.env \
            $BACKEND_IMAGE_NAME
        '''
      }
    }

    stage('🚀 Run Frontend Container') {
      steps {
        sh '''
          docker run -d --name $FRONTEND_CONTAINER_NAME -p $FRONTEND_PORT:80 --network pickgall-network \
            $FRONTEND_IMAGE_NAME
        '''
      }
    }
  }

  post {
    success {
      echo "✅ Docker 배포 완료!"
      echo "Backend: http://localhost:$BACKEND_PORT"
      echo "Frontend: http://localhost:$FRONTEND_PORT"
    }
    failure {
      echo "❌ Docker 배포 실패. 로그를 확인하세요."
    }
  }
}
