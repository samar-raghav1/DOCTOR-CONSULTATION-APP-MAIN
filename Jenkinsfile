pipeline {
  agent any

  stages {

    stage('checkout') {
      steps {
        git url: "https://github.com/samar-raghav1/DOCKTOR-CONSULTATION-APP-MAIN.git", branch: "main"
      }
    }

    stage('build') {
      steps {
        echo 'building docker '
        sh 'docker build -t DCAM .'
        echo 'docker image build'
      }
    }

    stage('push to docker hub') {
      steps {
        echo 'pushing image to docker hub'

        withCredentials([usernamePassword(
          credentialsId: 'dockerhub-creds',
          usernameVariable: 'DOCKER_USER',
          passwordVariable: 'DOCKER_PASS'
        )]) {
          echo '$DOCKER_USER'

          sh """
              echo "${DOCKER_PASS}" | docker login -u "${DOCKER_USER}" --password-stdin
            """

          sh 'docker tag DCAM:latest ${DOCKER_USER}/DCAM:latest'

          sh 'docker push ${DOCKER_USER}/DCAM:latest'

          echo 'Image Pushed'
        }
      }
    }

    stage('deploy') {
      steps {
        echo 'deploying image'
    
        sh 'ls -la'
        
        sh 'docker compose -f docker-compose.yaml down && docker compose -f docker-compose.yaml up -d --build'
      }
    }
    
  }
}
