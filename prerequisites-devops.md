### 1.Prerequisites
### Docker & docker-compose   --> 
```
sudo apt install docker.io /
sudo usermod -aG docker ubuntu /
newgrp docker /
```
```
sudo curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m) \
-o /usr/local/bin/docker-compose /
sudo chmod +x /usr/local/bin/docker-compose /
docker-compose --version /
```


### kind -->
```
# 1. Download latest Kind binary
curl -Lo ./kind "https://kind.sigs.k8s.io/dl/latest/kind-linux-amd64"

# 2. Make it executable
chmod +x ./kind

# 3. Move to PATH
sudo mv ./kind /usr/local/bin/

# 4. Verify installation
kind version
```

### kubectl
```
# 1. Update package index
sudo apt update

# 2. Download latest stable release
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"

# 3. Make it executable
chmod +x kubectl

# 4. Move to PATH
sudo mv kubectl /usr/local/bin/

# 5. Verify installation
kubectl version --client
```


### Ansible & terraform -->
```
# 1. Update packages
sudo apt update

# 2. Install Ansible
sudo apt install -y ansible

# 3. Verify
ansible --version
```
```

# 1. Update packages
sudo apt update && sudo apt upgrade -y

# 2. Install prerequisites
sudo apt install -y wget unzip curl gnupg software-properties-common

# 3. Add HashiCorp repo
wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor | sudo tee /usr/share/keyrings/hashicorp-archive-keyring.gpg

echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] \
https://apt.releases.hashicorp.com $(lsb_release -cs) main" | \
sudo tee /etc/apt/sources.list.d/hashicorp.list

# 4. Install Terraform
sudo apt update && sudo apt install -y terraform

# 5. Verify
terraform -version
```
