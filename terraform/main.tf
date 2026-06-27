provider "aws" {
    region = "us-east-1"
}

resource "aws_vpc" "DCAM-vpc" {
    cidr_block = var.vpc_cidr
    enable_dns_hostnames = true
    enable_dns_support = true
    tags = {
        Name="DCAM-vpc"
    }
  
}

resource "aws_subnet" "DCAM-subnets" {
    count= 2
    vpc_id = aws_vpc.DCAM-vpc
    cidr_block = cidrsubnet(var.vpc_cidr, 8, count.index)
    availability_zone = data.aws_availability_zones.available.names[count.index]
    map_public_ip_on_launch = true
    tags = {Name= "DCAM-public-${count.index}"}
  
}

resource "aws_security_group" "jenkins-sg" {
  vpc_id = aws_vpc.DCAM-vpc
  name = "jenkins-sg"

  ingress = {
    from_port = 8080
    to_port = 8080
    protocol= "tcp"
    cidr_blocks= ["0.0.0.0/0"]
  }

  ingress= {
    from_port= 22
    to_port= 22
    protocol= "tcp"
    cidr_blocks= [var.my_ip]
  }

  egress = {
    from_port= 0
    to_port= 0
    protocol="-1"
    cidr_blocks= ["0.0.0.0/0"]

  }
}
#EC2 Instance
resource "aws_instance" "jenkins" {
    ami = var.ec2_ami
    instance_type = var.ec2_type
    subnet_id = aws_subnet.public[0].id
    vpc_security_group_ids = [aws_security_group.jenkins-sg.id]
  
  tags = { Name = "jenkins-server" }
}

#EKS Cluster

resource "aws_eks_cluster" "DCAM-cluster" {
    name = "DCAM-eks-cluster"
    role_arn = var.eks_role_arn
    vpc_config {
      subnet_ids = aws_subnets.public[*].id
    }
}

#S3 + DynamoDb for terraform state

resource "aws_s3_bucket" "tf_state" {
  bucket = var.s3_bucket_name
  acl    = "private"
}

resource "aws_dynamodb_table" "tf_lock" {
  name         = var.dynamodb_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}

#RDS MongoDB

resource "aws_docdb_cluster" "mongo" {
  cluster_identifier = "DCAM-mongo-cluster"
  master_username    = var.mongo_user
  master_password    = var.mongo_password
  skip_final_snapshot = true
}

resource "aws_docdb_cluster_instance" "mongo_instances" {
  count              = 2
  cluster_identifier = aws_docdb_cluster.mongo.id
  instance_class     = var.mongo_instance_type
}