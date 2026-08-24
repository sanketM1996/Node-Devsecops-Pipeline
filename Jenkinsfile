pipeline {

    agent any

    environment {
        DOCKER_IMAGE = 'sanketmahajan/nodeapp'
        SONAR_PROJECT = 'node-devsecops'
        APP_CONTAINER = 'node-app'
        APP_PORT = '5000'
    }

    stages {

        // =========================================================
        // CHECKOUT
        // =========================================================

        stage('Checkout') {
            steps {

                git branch: 'main',
                    url: 'https://github.com/sanketM1996/Node-Devsecops-Pipeline.git'

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
                    echo "Git Commit SHA  : ${env.GIT_COMMIT_ID}"
                    echo "Docker Image Tag: ${env.IMAGE_TAG}"
                    echo "======================================"
                }
            }
        }


        // =========================================================
        // SECURITY SCANS
        // =========================================================

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
                            checkov \
                              -d . \
                              --framework dockerfile \
                              --output json \
                              > checkov-docker.json
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


        // =========================================================
        // NODE DEPENDENCIES
        // =========================================================

        stage('Dependencies & Audit') {
            steps {

                sh '''
                    echo "Installing Node.js dependencies..."

                    npm ci

                    echo "Running npm audit..."

                    npm audit --audit-level=high
                '''
            }
        }


        // =========================================================
        // LINT & TEST
        // =========================================================

        stage('Lint & Test') {
            steps {

                sh '''
                    npm run lint
                '''

                /*
                 * If your package.json contains a test script,
                 * uncomment this:
                 *
                 * npm test
                 */
            }
        }


        // =========================================================
        // SONARQUBE
        // =========================================================

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


        // =========================================================
        // SONAR QUALITY GATE
        // =========================================================

        stage('Quality Gate') {
            steps {

                timeout(
                    time: 5,
                    unit: 'MINUTES'
                ) {

                    waitForQualityGate(
                        abortPipeline: true
                    )
                }
            }
        }


        // =========================================================
        // DOCKER BUILD
        // =========================================================

        stage('Docker Build') {
            steps {

                sh '''
                    echo "Building Docker image..."

                    docker build \
                      --no-cache \
                      -t ${DOCKER_IMAGE}:${IMAGE_TAG} .

                    echo "======================================"
                    echo "Docker Image Built"
                    echo "Image: ${DOCKER_IMAGE}:${IMAGE_TAG}"
                    echo "======================================"

                    docker image inspect \
                      ${DOCKER_IMAGE}:${IMAGE_TAG} > /dev/null
                '''
            }
        }


        // =========================================================
        // TRIVY IMAGE SCAN
        // =========================================================

        stage('Trivy Image Scan') {
            steps {

                sh '''
                    echo "Scanning Docker image..."

                    trivy image \
                      --severity HIGH,CRITICAL \
                      --ignore-unfixed \
                      --exit-code 1 \
                      ${DOCKER_IMAGE}:${IMAGE_TAG}
                '''
            }
        }


        // =========================================================
        // PUSH IMAGE
        // =========================================================

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
                        set -e

                        echo "$DOCKER_PASS" | docker login \
                          -u "$DOCKER_USER" \
                          --password-stdin

                        echo "Pushing image:"
                        echo "${DOCKER_IMAGE}:${IMAGE_TAG}"

                        docker push \
                          ${DOCKER_IMAGE}:${IMAGE_TAG}

                        echo "Creating latest tag..."

                        docker tag \
                          ${DOCKER_IMAGE}:${IMAGE_TAG} \
                          ${DOCKER_IMAGE}:latest

                        docker push \
                          ${DOCKER_IMAGE}:latest

                        docker logout
                    '''
                }
            }
        }


        // =========================================================
        // DEPLOY NODE APP
        // =========================================================

        stage('Deploy') {
            steps {

                sh '''
                    set -e

                    echo "Pulling Docker image..."

                    docker pull \
                      ${DOCKER_IMAGE}:${IMAGE_TAG}


                    echo "Stopping old container..."

                    docker stop ${APP_CONTAINER} || true

                    docker rm ${APP_CONTAINER} || true


                    echo "Starting Node.js application..."

                    docker run -d \
                      --name ${APP_CONTAINER} \
                      --restart unless-stopped \
                      -p ${APP_PORT}:5000 \
                      ${DOCKER_IMAGE}:${IMAGE_TAG}


                    echo "Waiting for application..."

                    sleep 5


                    echo "Checking container..."

                    docker ps \
                      --filter "name=${APP_CONTAINER}"


                    echo "Testing Node.js application..."

                    curl -f \
                      http://localhost:${APP_PORT}/


                    echo "======================================"
                    echo "Application deployed successfully"
                    echo "URL:"
                    echo "http://localhost:${APP_PORT}"
                    echo "======================================"
                '''
            }
        }
    }


    // =============================================================
    // POST ACTIONS
    // =============================================================

    post {

        always {

            echo "======================================"
            echo "Pipeline result: ${currentBuild.currentResult}"
            echo "Git Commit SHA  : ${env.GIT_COMMIT_ID ?: 'N/A'}"
            echo "Docker Image    : ${env.DOCKER_IMAGE}:${env.IMAGE_TAG ?: 'N/A'}"
            echo "======================================"
        }


        success {

            echo "======================================"
            echo "Node.js DevSecOps pipeline completed successfully."
            echo "Image: ${env.DOCKER_IMAGE}:${env.IMAGE_TAG}"
            echo "======================================"
        }


        failure {

            echo "======================================"
            echo "Pipeline failed."
            echo "Check the failed stage and Jenkins console log."
            echo "======================================"
        }
    }
}