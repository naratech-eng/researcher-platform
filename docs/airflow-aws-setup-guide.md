# Guide: Deploying the Migration Pipeline with Airflow on AWS

This guide details how to set up Apache Airflow in a Docker container on an AWS EC2 instance and run the database migration. It includes securely connecting to your local MySQL database and the destination AWS RDS PostgreSQL database.

---

### Step 1: Deploy Infrastructure

This step uses the provided shell script to deploy the CloudFormation stack, which creates the EC2 instance and all necessary IAM roles and security groups.

1.  **Make the script executable:**
    ```bash
    chmod +x aws-cf/deploy-airflow.sh
    ```
2.  **Run the deployment script:**
    ```bash
    ./aws-cf/deploy-airflow.sh
    ```
3.  **Wait for the deployment to complete.** You can monitor the progress in the AWS CloudFormation console.

---

### Step 2: Connect to the EC2 Instance

Connect to your new general-purpose instance securely using AWS Systems Manager (SSM) Session Manager. This method does not require SSH keys or public IP addresses.

1.  **Install the Session Manager Plugin** on your local machine if you haven't already. Follow the official AWS documentation:
    *   [Installing the Session Manager plugin](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html)
2.  **Get the Instance ID:** Find the `InstanceId` from the **Outputs** tab of your `general-purpose-ec2-stack` in the CloudFormation console.
3.  **Start a session:**
    ```bash
    aws ssm start-session --target <your-instance-id>
    ```
    *Note: The default user for an Ubuntu instance is `ubuntu`.*

### Step 3: Set Up Airflow

1.  **Create an Airflow Directory and Download the Docker Compose File:**
    ```bash
    mkdir ~/airflow
    cd ~/airflow
    curl -LfO "https://airflow.apache.org/docs/apache-airflow/3.0.2/docker-compose.yaml"
    ```

2.  **Create Directories and Set Permissions:**
    ```bash
    mkdir -p ./dags ./logs ./plugins ./config
    echo -e "AIRFLOW_UID=$(id -u)" > .env
    ```

3.  **Initialize the Airflow Environment:**
    Run the `airflow-init` service to initialize the database and create the default Airflow user. Note the modern command syntax (`docker compose` with a space).
    ```bash
    docker compose up airflow-init
    ```
    After this command finishes successfully, you should see a message confirming the user `airflow` was created with the password `airflow`.

4.  **Start All Airflow Services:**
    ```bash
    docker compose up -d
    ```
    This command starts all services in the background.

5.  **Access the Airflow UI:**
    The Airflow UI will be available at `http://<your-ec2-public-ip>:8080`. Log in with:
    *   **Username:** `airflow`
    *   **Password:** `airflow`

### Step 4: Deploy and Configure Your DAG

1.  **Create the DAG File:**
    Inside the `~/airflow/dags` directory on your EC2 instance, create a new file named `sheep_db_migration_dag.py` and paste your DAG code into it.

2.  **Install Python Dependencies:**
    A simpler way to install dependencies is to add them to your `docker-compose.yaml` file. Open it and add the following environment variable to the `airflow-worker` and `airflow-scheduler` services:
    ```yaml
    environment:
      - _PIP_ADDITIONAL_REQUIREMENTS=mysql-connector-python psycopg2-binary pandas python-dotenv sqlalchemy
    ```
    Then, restart the services with `docker compose up -d --force-recreate`.

---

### Troubleshooting Common Setup Issues

If you encounter errors like `permission denied` or `docker-compose: not found`, it likely means the instance's startup script failed. Here is how to diagnose and fix the two most common issues manually.

#### A. Fixing `docker-compose: not found`

If you see this error, it means Docker Compose was not installed. You can install it with the following commands:

1.  **Download and Install Docker Compose:**
    ```bash
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    ```

2.  **Make it Executable:**
    ```bash
    sudo chmod +x /usr/local/bin/docker-compose
    ```
    You should now be able to run `docker-compose --version` successfully.

#### B. Fixing Docker `permission denied`

If you see this error when running `docker` commands, it means your user is not in the `docker` group. Here’s how to fix it:

1.  **Check Your User and Groups:**
    ```bash
    whoami
    groups
    ```
    If `docker` is not in the list of groups, proceed to the next step.

2.  **Add Your User to the Docker Group:**
    ```bash
    sudo usermod -aG docker $(whoami)
    ```

3.  **Crucial Step: Exit and Reconnect:**
    Group changes only apply on a new login. You **must** exit the SSM session and start a new one.
    ```bash
    # In your current session:
    exit

    # From your local machine, reconnect:
    aws ssm start-session --target <your-instance-id>
    ```

4.  **Verify the Fix:**
    In the new session, run `docker ps`. It should now work correctly.
2.  **Configure its Security Group:** Ensure the RDS security group allows **inbound** traffic on port `5432` from your EC2 instance's security group (`airflow-sg`).
3.  **Create Airflow Connection:** In the Airflow UI (`Admin -> Connections`), create a new connection:
    *   **Connection ID:** `postgres_rds_destination`
    *   **Connection Type:** `Postgres`
    *   **Host:** Your RDS endpoint URL.
    *   **Schema:** The name of your database.
    *   **Login:** Your RDS master username.
    *   **Password:** Your RDS master password.
    *   **Port:** `5432`

#### B. Source: Local MySQL via SSH Reverse Tunnel

Since your EC2 instance cannot see your local machine, you must create a secure tunnel **from your local machine to the EC2 instance**.

1.  **On your local machine**, run this command in a new terminal window. This window must stay open for the entire duration of the migration.
    ```bash
    # This forwards port 3307 on your EC2 instance to port 3306 on your local machine.
    ssh -N -R 3307:localhost:3306 ubuntu@<your-ec2-public-ip> -i /path/to/your-key.pem
    ```
2.  **Create Airflow Connection:** In the Airflow UI, create another new connection:
    *   **Connection ID:** `mysql_local_source`
    *   **Connection Type:** `MySQL`
    *   **Host:** `host.docker.internal` (This special DNS name lets the Docker container connect to the host EC2 machine).
    *   **Schema:** `sheep_db`
    *   **Login:** Your local MySQL username.
    *   **Password:** Your local MySQL password.
    *   **Port:** `3307` (The port you forwarded from your local machine).

3.  **Update your ETL code to use these connection IDs** in the `.env` file for the Airflow environment.

---

### Step 5: Run the Migration

1.  Go to the Airflow UI at `http://<your-ec2-public-ip>:8080`.
2.  You should see your `sheep_db_migration` DAG on the main page. Un-pause it.
3.  Click the "Play" button to trigger a manual run.
4.  Click on the running DAG to view the Graph or Grid view and monitor the progress of the `extract`, `transform`, and `load` tasks.
