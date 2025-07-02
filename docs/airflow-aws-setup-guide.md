# Guide: Deploying Scalable Airflow on AWS

This guide details how to deploy a scalable, persistent Apache Airflow environment on AWS. Our architecture uses a generic EC2 host with a persistent EFS volume, ensuring that your Airflow data (DAGs, logs, plugins, and database) is safe and reusable across different EC2 instances.

---

### Core Concepts

*   **Generic EC2 Host:** The CloudFormation template provisions a basic EC2 instance with Docker and an EFS mount. It does not install Airflow directly, making it a reusable and flexible host for any containerized application.
*   **Persistent EFS Storage:** All Airflow data is stored on an Amazon EFS volume. The deployment script automatically discovers and reuses this volume, so your data is preserved even if you terminate the EC2 instance and launch a new one.
*   **Two-Step Deployment:**
    1.  **Provision Infrastructure:** Run a script to deploy the CloudFormation stack, which sets up the VPC, EC2, and EFS.
    2.  **Configure Airflow:** Manually connect to the EC2 instance to set up and launch Airflow using Docker Compose. This only needs to be done once; the configuration will be persisted on the EFS volume.

---

### Step 1: Deploy the Infrastructure

The deployment script handles the creation of all necessary AWS resources and intelligently manages the EFS volume.

1.  **Make the script executable:**
    ```bash
    chmod +x aws-cf/deploy-airflow.sh
    ```

2.  **Run the deployment script:**
    ```bash
    ./aws-cf/deploy-airflow.sh
    ```

    The script will automatically search for an existing EFS volume with the tag `AirflowCluster=<stack-name>`. If found, it reuses it. If not, CloudFormation creates a new one.

3.  **Wait for the deployment to complete.** You can monitor the progress in the AWS CloudFormation console.

4.  **Start an Instance Refresh:**
    After any change to the `UserData` in the CloudFormation template, you must refresh the Auto Scaling Group to launch a new instance with the updated configuration.

    First, get the Auto Scaling Group name. You can find it in the **Outputs** tab of your CloudFormation stack in the AWS console, or you can retrieve it with the following AWS CLI command (replace `<stack-name>` with your stack's name, e.g., `ec2-airflow-from-scratch`):
    ```bash
    aws cloudformation describe-stacks --stack-name <stack-name> --query "Stacks[0].Outputs[?OutputKey=='AutoScalingGroupName'].OutputValue" --output text
    ```

    Then, run the following command, replacing `<your-asg-name>` with the name you just retrieved:
    ```bash
    aws autoscaling start-instance-refresh --auto-scaling-group-name <your-asg-name>
    ```

    You can monitor the progress of the refresh in the "Instance refresh" tab of your Auto Scaling Group in the EC2 console.

---

### Step 2: Configure and Launch Airflow (One-Time Setup)

Connect to your new EC2 instance to perform the initial Airflow setup. This configuration is stored on the EFS volume and will be automatically reused by any future instances.

1.  **Get the Instance ID:** Find the `InstanceId` from the **Outputs** tab of the CloudFormation stack.

2.  **Connect to the instance using SSM:**
    ```bash
    aws ssm start-session --target <your-instance-id>
    ```

3.  **Switch to the `ubuntu` user:**
    The application environment is set up for the `ubuntu` user. Switch to this user to ensure all commands have the correct permissions.
    ```bash
    sudo -i -u ubuntu
    ```

4.  **Navigate to the persistent Airflow directory:**
    The `UserData` script creates a symlink from `/home/ubuntu/airflow` to the persistent EFS mount.
    ```bash
    cd /home/ubuntu/airflow
    ```

5.  **Create the Docker Compose File**

    Create a file named `docker-compose.yml` (e.g., with `nano docker-compose.yml`) and paste the following content. This file defines the Airflow services and is configured to use the EFS directories for persistence.

    ```yaml
    version: '3.8'
    x-airflow-common:
      image: apache/airflow:3.0.2
      env_file:
        - ./.env
      environment:
        &airflow-common-env
        AIRFLOW__CORE__EXECUTOR: LocalExecutor
        AIRFLOW__DATABASE__SQL_ALCHEMY_CONN: postgresql+psycopg2://airflow:airflow@postgres/airflow
        AIRFLOW__CORE__FERNET_KEY: ${AIRFLOW__CORE__FERNET_KEY}
        AIRFLOW__CORE__DAGS_ARE_PAUSED_AT_CREATION: 'true'
        AIRFLOW__CORE__LOAD_EXAMPLES: 'false'
        AIRFLOW__API__AUTH_BACKENDS: 'airflow.api.auth.backend.basic_auth'
      volumes:
        - ./dags:/opt/airflow/dags
        - ./logs:/opt/airflow/logs
        - ./plugins:/opt/airflow/plugins
        - ./config:/opt/airflow/config

    services:
      postgres:
        image: postgres:13
        container_name: postgres
        environment:
          - POSTGRES_USER=airflow
          - POSTGRES_PASSWORD=airflow
          - POSTGRES_DB=airflow
        volumes:
          - ./postgres-db:/var/lib/postgresql/data
        healthcheck:
          test: ["CMD", "pg_isready", "-U", "airflow"]
          interval: 5s
          retries: 5

      airflow-init:
        <<: *x-airflow-common
        container_name: airflow_init
        depends_on:
          postgres:
            condition: service_healthy
        command: >
          bash -c "
            airflow db init &&
            airflow users create \
              --username airflow \
              --firstname Admin \
              --lastname User \
              --role Admin \
              --email admin@example.com \
              --password airflow
          "

      airflow-webserver:
        <<: *x-airflow-common
        container_name: airflow_webserver
        restart: always
        depends_on:
          airflow-init:
            condition: service_completed_successfully
        ports:
          - "8080:8080"
        command: webserver
        healthcheck:
          test: ["CMD", "curl", "--fail", "http://localhost:8080/health"]
          interval: 30s
          timeout: 10s
          retries: 5

      airflow-scheduler:
        <<: *x-airflow-common
        container_name: airflow_scheduler
        restart: always
        depends_on:
          airflow-init:
            condition: service_completed_successfully
        command: scheduler
    ```

6.  **Create the Environment File**

    Create a file named `.env` to store necessary environment variables.

    First, set the `AIRFLOW_UID` to match the current user (`ubuntu`). This ensures files created by the container match the host user's permissions.
    ```bash
    echo "AIRFLOW_UID=$(id -u)" > .env
    ```

    Next, generate a Fernet key for encrypting connections and add it to the `.env` file.
    ```bash
    echo "AIRFLOW__CORE__FERNET_KEY=$(docker run --rm apache/airflow:3.0.2 bash -c 'airflow-fernet')" >> .env
    ```

    Your final `.env` file should look like this (the Fernet key will be different):
    ```
    AIRFLOW_UID=1000
    AIRFLOW__CORE__FERNET_KEY=...your_generated_key...
    ```

7.  **Initialize the Airflow Database and User:**
    This command uses Docker Compose to run a one-time initialization service. It sets up the PostgreSQL database and creates the default admin user (`airflow`/`airflow`).
    ```bash
    docker compose up airflow-init
    ```

8.  **Launch all Airflow services:**
    This command starts the Airflow webserver, scheduler, and other components in the background.
    ```bash
    docker compose up -d
    ```

---

### Step 3: Access and Manage Airflow

Your Airflow instance is now running and fully persistent.

1.  **Access the Airflow UI:**
    *   Find the `PublicIpAddress` in the CloudFormation stack's **Outputs** tab.
    *   Navigate to `http://<your-public-ip>:8080`.
    *   Log in with username `airflow` and password `airflow`.

2.  **Managing Your DAGs:**
    Your DAGs, logs, and plugins are stored on the EFS volume and are safe from instance termination.
    *   **DAGs:** `/home/ubuntu/airflow/dags`
    *   **Logs:** `/home/ubuntu/airflow/logs`
    *   **Plugins:** `/home/ubuntu/airflow/plugins`
    *   **Database:** `/home/ubuntu/airflow/postgres-db`

### Reusability and Persistence

Because all your data and configurations are on the EFS volume, you can terminate your EC2 instance at any time. When you are ready to run Airflow again, simply:

1.  Run `./aws-cf/deploy-airflow.sh` to launch a new stack and a fresh EC2 instance.
2.  The script will automatically find and mount your existing EFS volume.
3.  Connect to the new instance, switch to the application user with `sudo -i -u ubuntu`, and then run `cd /home/ubuntu/airflow && docker compose up -d`.

All your DAGs, history, and connections will be exactly as you left them.

To add a new DAG, simply place the Python file in the `dags` directory. Airflow will automatically detect and load it.
