pipeline {

    agent any

    environment {
        DOCKER_IMAGE = 'sanketmahajan/mern-app'
        SONAR_PROJECT = 'react-devsecops'
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/sanketM1996/Npm-Devsecops-Pipeline.git'

                script {
                    def commitId = sh(
                        script: 'git rev-parse HEAD',
                        returnStdout: true
                    ).trim()

                    if (!commitId) {
                        error("Git commit SHA could not be determined.")
                    }

                    env.GIT_COMMIT_ID = commitId
                    env.IMAGE_TAG = commitId.substring(0, 7)

                    echo "======================================"
                    echo "Git Commit SHA  : ${commitId}"
                    echo "Docker Image Tag: ${env.IMAGE_TAG}"
                    echo "======================================"
                }
            }
        }

        stage('Security Scans') {
            parallel {

                stage('Gitleaks') {
                    steps {
                        sh '''
                            gitleaks detect \
                              --source . \
                              --report-format json \
                              --report-path gitleaks-report.json \
                              --redact \
                              --exit-code 1
                        '''
                    }
                }

                stage('Checkov') {
                    steps {
                        sh '''
                            checkov -d . \
                              --framework dockerfile \
                              --output json > checkov-docker.json || true
                        '''
                    }
                }

        

                stage('Trivy FS') {
                    steps {
                        sh '''
                            trivy fs . \
                              --severity HIGH,CRITICAL \
                              --ignore-unfixed \
                              --exit-code 1
                        '''
                    }
                }
            }
        }
          stage('SonarQube') {
            steps {
                withSonarQubeEnv('sonarqube') {
                    script {
                        def scanner = tool 'sonar-scanner'

                        sh """
                            ${scanner}/bin/sonar-scanner \
                              -Dsonar.projectKey=${SONAR_PROJECT}
                        """
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Dependencies & Audit') {
            steps {
                sh '''
                    npm ci
                    npm audit --audit-level=high
                '''
            }
        }

        stage('Lint & Test') {
            steps {
                sh 'npm run lint'
            }
        }

        stage('React Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Docker Build') {
            steps {
                sh '''
                    docker build --no-cache \
                      -t ${DOCKER_IMAGE}:${IMAGE_TAG} .
                '''

                sh '''
                    echo "Built Docker image:"
                    echo "${DOCKER_IMAGE}:${IMAGE_TAG}"

                    docker images | grep mern-app
                '''
            }
        }

        stage('Trivy Image Scan') {
            steps {
                sh '''
                    trivy image \
                      --severity HIGH,CRITICAL \
                      --ignore-unfixed \
                      --exit-code 1 \
                      ${DOCKER_IMAGE}:${IMAGE_TAG}
                '''
            }
        }

        stage('Push Image') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-creds',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )
                ]) {
                    sh '''
                        echo "$DOCKER_PASS" | docker login \
                          -u "$DOCKER_USER" \
                          --password-stdin

                        echo "Pushing image:"
                        echo "${DOCKER_IMAGE}:${IMAGE_TAG}"

                        docker push ${DOCKER_IMAGE}:${IMAGE_TAG}

                        echo "Creating latest tag..."

                        docker tag \
                          ${DOCKER_IMAGE}:${IMAGE_TAG} \
                          ${DOCKER_IMAGE}:latest

                        docker push ${DOCKER_IMAGE}:latest

                        docker logout
                    '''
                }
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    docker pull ${DOCKER_IMAGE}:${IMAGE_TAG}

                    docker stop react-app || true
                    docker rm react-app || true

                    docker run -d \
                      --name react-app \
                      --restart unless-stopped \
                      -p 80:80 \
                      ${DOCKER_IMAGE}:${IMAGE_TAG}

                    sleep 5

                    docker ps | grep react-app

                    curl -f http://localhost:80/
                '''
            }
        }
    }

    post {

        always {
            echo "======================================"
            echo "Pipeline result: ${currentBuild.currentResult}"
            echo "Git Commit SHA  : ${env.GIT_COMMIT_ID ?: 'N/A'}"
            echo "Docker Image    : ${env.DOCKER_IMAGE}:${env.IMAGE_TAG ?: 'N/A'}"
            echo "======================================"
        }

        success {
            echo "React DevSecOps pipeline completed successfully."
            echo "Image: ${env.DOCKER_IMAGE}:${env.IMAGE_TAG}"
        }

        failure {
            echo "Pipeline failed. Check the failed stage."
        }
    }
}