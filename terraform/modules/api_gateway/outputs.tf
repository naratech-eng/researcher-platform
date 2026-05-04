output "api_id" {
  value = aws_apigatewayv2_api.this.id
}

output "api_endpoint" {
  value = aws_apigatewayv2_api.this.api_endpoint
}

output "domain_name" {
  value = aws_apigatewayv2_domain_name.this.domain_name
}

output "domain_target" {
  value = aws_apigatewayv2_domain_name.this.domain_name_configuration[0].target_domain_name
}

output "vpc_link_id" {
  value = aws_apigatewayv2_vpc_link.this.id
}
