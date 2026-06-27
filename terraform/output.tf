output "vpc_id" {
  value = aws_vpc.DCAM-vpc.id
}

output "jenkins_public_ip" {
  value = aws_instance.jenkins.public_ip
}

output "eks_cluster_endpoint" {
  value = aws_eks_cluster.DCAM-cluster.endpoint
}

output "mongo_endpoint" {
  value = aws_docdb_cluster.mongo.endpoint
}
