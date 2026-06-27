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
  default = "DCAM-terraform-state"
}

variable "dynamodb_table_name" {
  default = "DCAM-terraform-locks"
}

variable "mongo_user" {
  default = "admin"
}

variable "mongo_password" {
  default = "password123"
}

variable "mongo_instance_type" {
  default = "db.r5.large"
}
