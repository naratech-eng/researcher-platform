import boto3
import os
import requests
import json
from typing import Dict, Any

# Initialize AWS clients
ec2 = boto3.client('ec2')
autoscaling = boto3.client('autoscaling')

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, str]:
    """
    Lambda function to manage EIP association and DDNS updates based on EC2 state changes.
    """
    print(f"Event received: {json.dumps(event, indent=2)}")

    try:
        # Get environment variables
        allocation_id = os.environ['ALLOCATION_ID']
        asg_name = os.environ['ASG_NAME']
        stack_name = os.environ['STACK_NAME']
        ddns_password = os.environ.get('DDNS_PASSWORD', '')
        domain = os.environ.get('DOMAIN', '')
        host = os.environ.get('HOST', '@')

        # Verify the event is one we should process
        if not (event.get("source") == "aws.ec2" and event.get("detail-type") == "EC2 Instance State-change Notification"):
            print(f"Ignoring event from source: {event.get('source')} and type: {event.get('detail-type')}")
            return {"status": "ignored", "reason": "Not an EC2 state change event"}

        instance_id = event['detail']['instance-id']
        state = event['detail']['state']

        # Check if the instance belongs to our ASG before taking action
        if not is_instance_in_asg(instance_id, asg_name):
            print(f"Instance {instance_id} is not in target ASG '{asg_name}'. Ignoring.")
            return {"status": "ignored", "reason": f"Instance not in target ASG"}

        # Route to the correct handler based on instance state
        if state == 'running':
            print(f"Handling 'running' state for instance {instance_id}")
            return handle_instance_launch(allocation_id, instance_id, ddns_password, domain, host, stack_name)
        elif state == 'terminated':
            print(f"Handling 'terminated' state for instance {instance_id}")
            return handle_instance_terminate(allocation_id, asg_name, stack_name)
        else:
            print(f"Ignoring state '{state}' for instance {instance_id}")
            return {"status": "ignored", "reason": f"State is {state}"}

    except Exception as e:
        print(f"Error processing event: {str(e)}")
        return {"status": "error", "message": str(e)}

def is_instance_in_asg(instance_id: str, target_asg_name: str) -> bool:
    """Check if the given instance ID belongs to our target ASG."""
    try:
        response = autoscaling.describe_auto_scaling_instances(InstanceIds=[instance_id])
        if not response['AutoScalingInstances']:
            # This can happen if the instance is terminated and already detached from the ASG
            print(f"Instance {instance_id} not found in any ASG.")
            return False
        
        instance_asg_name = response['AutoScalingInstances'][0]['AutoScalingGroupName']
        print(f"Instance {instance_id} belongs to ASG: {instance_asg_name}. Target ASG: {target_asg_name}")
        return instance_asg_name == target_asg_name
    except Exception as e:
        print(f"Error checking instance ASG membership: {str(e)}")
        return False

def handle_instance_launch(allocation_id: str, instance_id: str, ddns_password: str, domain: str, host: str, stack_name: str) -> Dict[str, str]:
    """Handle EC2 instance launch - associate EIP and update DDNS"""
    try:
        # Check if EIP is already associated
        eip_response = ec2.describe_addresses(AllocationIds=[allocation_id])
        eip_info = eip_response['Addresses'][0]
        
        current_instance = eip_info.get('InstanceId')
        current_ip = eip_info.get('PublicIp')
        
        if current_instance == instance_id:
            print(f"EIP {allocation_id} already associated with instance {instance_id}")
            return {"status": "already_associated", "ip": current_ip}
        
        # Associate EIP with the new instance
        print(f"Associating EIP {allocation_id} to instance {instance_id}")
        ec2.associate_address(InstanceId=instance_id, AllocationId=allocation_id)
        
        # Get the public IP after association
        eip_response = ec2.describe_addresses(AllocationIds=[allocation_id])
        public_ip = eip_response['Addresses'][0]['PublicIp']
        
        print(f"EIP successfully associated. Public IP: {public_ip}")
        
        # Update DDNS if components are provided
        if ddns_password and domain:
            update_ddns(ddns_password, domain, host, public_ip, stack_name)
        else:
            print("DDNS_PASSWORD or DOMAIN not provided, skipping DDNS update")
        
        return {
            "status": "success", 
            "action": "associated",
            "instance_id": instance_id,
            "public_ip": public_ip
        }
        
    except Exception as e:
        print(f"Error in handle_instance_launch: {str(e)}")
        raise

def handle_instance_terminate(allocation_id: str, asg_name: str, stack_name: str) -> Dict[str, str]:
    """Handle EC2 instance termination - check if ASG is empty and release EIP if needed"""
    try:
        # Check ASG desired capacity
        asg_response = autoscaling.describe_auto_scaling_groups(
            AutoScalingGroupNames=[asg_name]
        )
        
        if not asg_response['AutoScalingGroups']:
            print(f"ASG {asg_name} not found")
            return {"status": "asg_not_found"}
        
        asg = asg_response['AutoScalingGroups'][0]
        desired_capacity = asg['DesiredCapacity']
        
        print(f"ASG {asg_name} desired capacity: {desired_capacity}")
        
        if desired_capacity == 0:
            # Check if EIP is currently associated
            eip_response = ec2.describe_addresses(AllocationIds=[allocation_id])
            eip_info = eip_response['Addresses'][0]
            
            if 'InstanceId' in eip_info:
                # Disassociate EIP
                print(f"Disassociating EIP {allocation_id} as ASG is scaled to 0")
                ec2.disassociate_address(AllocationId=allocation_id)
                
                return {
                    "status": "success",
                    "action": "disassociated",
                    "reason": "asg_scaled_to_zero"
                }
            else:
                print("EIP is not currently associated with any instance")
                return {"status": "already_disassociated"}
        else:
            print(f"ASG still has desired capacity of {desired_capacity}, keeping EIP associated")
            return {"status": "no_action", "reason": "asg_not_empty"}
            
    except Exception as e:
        print(f"Error in handle_instance_terminate: {str(e)}")
        raise

def update_ddns(ddns_password: str, domain: str, host: str, public_ip: str, stack_name: str) -> None:
    """Update Namecheap DDNS with the new public IP"""
    try:
        # Construct Namecheap DDNS URL
        ddns_url = f"https://dynamicdns.park-your-domain.com/update?host={host}&domain={domain}&password={ddns_password}&ip={public_ip}"
        
        print(f"Updating Namecheap DDNS for {host}.{domain} with IP: {public_ip}")
        
        response = requests.get(ddns_url, timeout=30)
        response.raise_for_status()
        
        print(f"DDNS update successful. Response: {response.text}")
        
    except requests.exceptions.RequestException as e:
        print(f"Failed to update DDNS: {str(e)}")
        # Don't raise the exception - DDNS failure shouldn't fail the entire operation
    except Exception as e:
        print(f"Unexpected error updating DDNS: {str(e)}")
