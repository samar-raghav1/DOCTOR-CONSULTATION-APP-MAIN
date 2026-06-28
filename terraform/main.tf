provider "aws" {
    region = var.aws_region
}

data "aws_availability_zones" "available" {
  state = "available"
}
resource "aws_vpc" "DCAM-vpc" {
    cidr_block = var.vpc_cidr
    enable_dns_hostnames = true
    enable_dns_support = true
    tags = {
        Name="DCAM-vpc"
    }
  
}

resource "aws_subnet" "public" {
    count= 2
    vpc_id = aws_vpc.DCAM-vpc.id
    cidr_block = cidrsubnet(var.vpc_cidr, 8, count.index)
    availability_zone = data.aws_availability_zones.available.names[count.index]
    map_public_ip_on_launch = true
    tags = {Name= "DCAM-public-${count.index}"}
  
}

resource "aws_security_group" "jenkins-sg" {
  vpc_id = aws_vpc.DCAM-vpc.id
  name = "jenkins-sg"

  ingress  {
    from_port = 8080
    to_port = 8080
    protocol= "tcp"
    cidr_blocks= ["0.0.0.0/0"]
  }

  ingress {
    from_port= 22
    to_port= 22
    protocol= "tcp"
    cidr_blocks= [var.my_ip]
  }

  egress  {
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
      subnet_ids = aws_subnet.public[*].id
    }
}

#S3 + DynamoDb for terraform state

resource "aws_s3_bucket" "dcam_s3_bucket_s" {
  bucket = var.s3_bucket_name
}

resource "aws_s3_bucket_acl" "dcam_s3_bucket_s_acl" {
  bucket = aws_s3_bucket.dcam_s3_bucket_s.id
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

# RDS PostgreSQL Free Tier
resource "aws_db_instance" "postgres" {
  identifier              = "dcam-postgres-instance"
  allocated_storage       = 20                # Free tier allows up to 20 GB
  engine                  = "postgres"
  engine_version          = "16.3"            # Latest supported version
  instance_class          = "db.t3.micro"     # Free tier eligible
  username                = var.postgres_user
  password                = var.postgres_password
  db_name                 = "mydb"
  parameter_group_name    = "default.postgres16"
  skip_final_snapshot     = true

  # Networking
  vpc_security_group_ids  = [aws_security_group.jenkins-sg.id]
  publicly_accessible     = false
}

