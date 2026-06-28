variable "aws_region" {
  default = "us-east-1"
}

variable "vpc_cidr" {
  default = "10.0.0.0/16"
}

variable "my_ip" {
  description = "Your IP for SSH access"
  default     = "54.173.49.102/32"
}

variable "ec2_ami" {
  description = "AMI for Jenkins EC2"
  default     = "ami-0b6d9d3d33ba97d99"
}

variable "ec2_type" {
  default = "t3.micro"
}

variable "eks_role_arn" {
  description = "IAM role ARN for EKS cluster"
}

variable "s3_bucket_name" {
  default = "dcam-terraform-state-s3"
}

variable "dynamodb_table_name" {
  default = "dcam-terraform-locks-dynamoDb"
}

variable "postgres_user" {
  default = "terraform"
}
variable "postgres_password"{
  default= "pasword123"
}