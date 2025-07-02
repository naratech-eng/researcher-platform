# Guide: Deploying Scalable Airflow on AWS

This guide details how to deploy a scalable, persistent Apache Airflow environment on AWS using CloudFormation, Docker, and Amazon EFS. The setup is fully automated and designed for resilience and easy updates.

---

### Step 1: Deploy the CloudFormation Stack

The deployment script handles the creation of all necessary AWS resources, including a dedicated VPC, public subnet, EC2 instances, and an EFS file system for persistent storage.

1.  **Make the script executable:**
    ```bash
    chmod +x aws-cf/deploy-airflow.sh
    ```
2.  **Run the deployment script:**
    ```bash
    ./aws-cf/deploy-airflow.sh
    ```
3.  **Wait for the deployment to complete.** You can monitor the progress in the AWS CloudFormation console. The stack name is `general-purpose-ec2-stack`.

### Step 2: IMPORTANT - Configure EFS for Data Persistence

To ensure your Airflow data (DAGs, logs, etc.) survives instance or stack termination, you must configure the deployment script to reuse the EFS file system created during the first deployment.

1.  **Find your EFS File System ID:**
    *   In the [AWS CloudFormation console](https://us-east-2.console.aws.amazon.com/cloudformation/home?region=us-east-2), select the `general-purpose-ec2-stack`.
    *   Go to the **Outputs** tab.
    *   Copy the value for the `EFSFileSystemId` key. It will look like `fs-0123456789abcdef0`.

2.  **Update the Deployment Script:**
    *   Open the `aws-cf/deploy-airflow.sh` file.
    *   Paste the copied ID into the `EXISTING_EFS_ID` variable:
        ```shell
        # Example:
        EXISTING_EFS_ID="fs-0123456789abcdef0"
        ```

From now on, every time you run `./aws-cf/deploy-airflow.sh`, it will reuse your existing EFS volume, preserving all your data.

---

### Step 3: Connect to the EC2 Instance

Connect to your instance securely using AWS Systems Manager (SSM) Session Manager. This method does not require SSH keys.

1.  **Get the Instance ID:** Find the `InstanceId` from the **Outputs** tab of the CloudFormation stack.
2.  **Start a session:**
    ```bash
    aws ssm start-session --target <your-instance-id> --region us-east-2
    ```

### Step 4: Set Up and Run Airflow

The `UserData` script has already installed Docker, mounted the EFS volume at `/mnt/efs/data`, and created the necessary Airflow directories.

1.  **Navigate to the Airflow directory on EFS:**
    ```bash
    cd /mnt/efs/data/airflow
    ```

2.  **Download the Docker Compose File:**
    ```bash
    # This only needs to be done once.
    if [ ! -f docker-compose.yaml ]; then
      curl -LfO "https://airflow.apache.org/docs/apache-airflow/stable/docker-compose.yaml"
    fi
    ```

3.  **Set the Correct Airflow User ID:**
    This ensures files created inside the container have the correct ownership on the host.
    ```bash
    echo -e "AIRFLOW_UID=$(id -u)" > .env
    ```

4.  **Initialize the Airflow Environment:**
    This command initializes the database and creates the default Airflow user (`airflow`/`airflow`).
    ```bash
    docker compose up airflow-init
    ```

5.  **Start All Airflow Services:**
    ```bash
    docker compose up -d
    ```

6.  **Access the Airflow UI:**
    *   Find the `PublicIpAddress` in the CloudFormation stack's **Outputs** tab.
    *   Navigate to `http://<your-public-ip>:8080`.
    *   Log in with username `airflow` and password `airflow`.

--- 

### Step 5: Managing Your DAGs

Your DAGs, logs, and plugins are stored persistently on the EFS volume.

*   **DAGs Location:** `/mnt/efs/data/airflow/dags`
*   **Logs Location:** `/mnt/efs/data/airflow/logs`
*   **Plugins Location:** `/mnt/efs/data/airflow/plugins`

To add a new DAG, simply place the Python file in the `dags` directory. Airflow will automatically detect and load it.
