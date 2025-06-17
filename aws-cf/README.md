# AWS CloudFormation Templates

This directory contains CloudFormation templates for the Animal Genetics Research Platform infrastructure.

## Templates

### dynamodb-stack.yml

DynamoDB tables for the user management backend:

- `Users` - Primary user records with GSIs for email lookup and role-based queries
- `UserIdentities` - Maps identity provider credentials to canonical user IDs
- `ChatSessions` - User chat session metadata
- `ChatMessages` - Individual chat messages
- `NotificationInbox` - User notifications
- `UserWorkspaces` - Research workspace metadata

## Deployment

Deploy the DynamoDB stack:

```bash
aws cloudformation deploy \
  --region us-east-2 \
  --stack-name genetics-dynamodb \
  --template-file dynamodb-stack.yml \
  --capabilities CAPABILITY_IAM
```

## Notes

- All tables use on-demand billing (PAY_PER_REQUEST)
- Point-in-Time Recovery is enabled for all tables
- AWS-managed encryption is used (default)
- The Users table is configured to retain on stack deletion/update
