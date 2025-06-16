# AWS Access Setup Guide for DynamoDB

## Overview

This guide explains how to set up AWS access keys for interacting with DynamoDB in the Animal Genetics Research Platform. We follow AWS security best practices including the principle of least privilege and secure credential management.

## Prerequisites

1. AWS account with administrator access to create IAM roles and users
2. Access to AWS Secrets Manager
3. Appropriate permissions in the platform's development environment

## Steps to Set Up AWS Access

### 1. Create an IAM Policy for DynamoDB Access

1. Log in to the AWS Management Console
2. Navigate to IAM > Policies
3. Create a new policy with the following JSON:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:GetItem",
                "dynamodb:PutItem",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem",
                "dynamodb:Query",
                "dynamodb:Scan",
                "dynamodb:BatchGetItem",
                "dynamodb:BatchWriteItem"
            ],
            "Resource": [
                "arn:aws:dynamodb:*:*:table/YOUR_TABLE_NAME"
            ]
        }
    ]
}
```

Replace `YOUR_TABLE_NAME` with your actual DynamoDB table name. Add additional table ARNs if needed.

### 2. Create an IAM User

1. Navigate to IAM > Users
2. Create a new user with programmatic access
3. Attach the DynamoDB policy created in step 1
4. Save the access key ID and secret access key securely

### 3. Store Credentials in AWS Secrets Manager

1. Navigate to AWS Secrets Manager
2. Create a new secret
3. Select "Other type of secret"
4. Enter the following key-value pairs:
   - `AWS_ACCESS_KEY_ID`: Your access key ID
   - `AWS_SECRET_ACCESS_KEY`: Your secret access key
   - `AWS_REGION`: Your AWS region (e.g., us-east-1)
5. Give the secret a name (e.g., "animal-genetics-dynamodb-credentials")
6. Add appropriate resource tags
7. Configure automatic rotation if desired

### 4. Access the Credentials in Your Application

Use the AWS SDK to access the credentials from Secrets Manager. Here's an example in Python:

```python
import boto3
import json
from botocore.exceptions import ClientError

def get_secret():
    secret_name = "animal-genetics-dynamodb-credentials"
    region_name = "us-east-1"  # Replace with your region

    session = boto3.session.Session()
    client = session.client(
        service_name='secretsmanager',
        region_name=region_name
    )

    try:
        get_secret_value_response = client.get_secret_value(
            SecretId=secret_name
        )
    except ClientError as e:
        raise e
    else:
        if 'SecretString' in get_secret_value_response:
            secret = json.loads(get_secret_value_response['SecretString'])
            return secret

def initialize_dynamodb():
    credentials = get_secret()
    
    dynamodb = boto3.resource('dynamodb',
        aws_access_key_id=credentials['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=credentials['AWS_SECRET_ACCESS_KEY'],
        region_name=credentials['AWS_REGION']
    )
    
    return dynamodb

# Example usage
def example_dynamodb_operations():
    dynamodb = initialize_dynamodb()
    table = dynamodb.Table('YOUR_TABLE_NAME')
    
    # Create/Insert item
    table.put_item(
        Item={
            'id': '123',
            'data': 'example'
        }
    )
    
    # Read item
    response = table.get_item(
        Key={
            'id': '123'
        }
    )
    item = response['Item']
    
    # Update item
    table.update_item(
        Key={
            'id': '123'
        },
        UpdateExpression='SET #data = :val1',
        ExpressionAttributeNames={
            '#data': 'data'
        },
        ExpressionAttributeValues={
            ':val1': 'updated example'
        }
    )
    
    # Delete item
    table.delete_item(
        Key={
            'id': '123'
        }
    )
```

## Security Best Practices

1. **Least Privilege**: Only grant the minimum permissions needed
2. **Credential Rotation**: Regularly rotate access keys
3. **Encryption**: Always use HTTPS/TLS for API calls
4. **Monitoring**: Enable CloudTrail logging for DynamoDB actions
5. **Access Logs**: Monitor and audit DynamoDB access patterns
6. **Secret Management**: Never hardcode credentials in code
7. **IAM Roles**: Use IAM roles instead of access keys when possible

## Troubleshooting

Common issues and solutions:

1. **Access Denied**: Verify IAM policy permissions
2. **Connection Timeout**: Check network/VPC settings
3. **Invalid Credentials**: Ensure credentials are current and correct
4. **Resource Not Found**: Verify table name and region

## Additional Resources

- [AWS DynamoDB Documentation](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [AWS Secrets Manager Documentation](https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html)