terraform {
  required_version = ">= 1.5.0"
  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    stripe = {
      source  = "stripe/stripe"
      version = "~> 1.0"
    }
  }
}

provider "vercel" {
  api_token = var.vercel_api_token
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

provider "aws" {
  region     = var.aws_region
  access_key = var.aws_access_key
  secret_key = var.aws_secret_key
}

# 1. AWS VPC & Network Infrastructure (Production Isolation)
resource "aws_vpc" "empire_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = {
    Name = "empire-vpc-${var.environment}"
  }
}

resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.empire_vpc.id
  tags = {
    Name = "empire-igw-${var.environment}"
  }
}

resource "aws_subnet" "db_subnet_a" {
  vpc_id            = aws_vpc.empire_vpc.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "${var.aws_region}a"
  tags = {
    Name = "empire-db-subnet-a"
  }
}

resource "aws_subnet" "db_subnet_b" {
  vpc_id            = aws_vpc.empire_vpc.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "${var.aws_region}b"
  tags = {
    Name = "empire-db-subnet-b"
  }
}

resource "aws_db_subnet_group" "db_subnets" {
  name       = "empire-db-subnet-group-${var.environment}"
  subnet_ids = [aws_subnet.db_subnet_a.id, aws_subnet.db_subnet_b.id]
}

# Database Security Group (Restrict postgres access to security networks)
resource "aws_security_group" "db_sg" {
  name        = "empire-db-sg-${var.environment}"
  description = "Allow inbound postgres access from secure networks"
  vpc_id      = aws_vpc.empire_vpc.id

  ingress {
    description = "Allow Postgres incoming connections"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # In practice, restrict to specific VPC peers or Vercel secure IPs
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# 2. Cloudflare R2 Bucket (S3-Compatible Storage for media uploads)
resource "cloudflare_r2_bucket" "uploads" {
  account_id = var.cloudflare_account_id
  name       = "empire-uploads-${var.environment}"
  location   = "ENAM"
}

# 3. AWS RDS PostgreSQL Database Instance
resource "aws_db_instance" "database" {
  identifier             = "empire-db-${var.environment}"
  engine                 = "postgres"
  engine_version         = "16"
  instance_class         = "db.t4g.micro"
  allocated_storage      = 20
  max_allocated_storage  = 100
  db_name                = "empire"
  username               = var.db_username
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.db_subnets.name
  vpc_security_group_ids = [aws_security_group.db_sg.id]
  publicly_accessible    = true
  skip_final_snapshot    = true
}

# 4. Cloudflare DNS CNAME Record
resource "cloudflare_record" "app_dns" {
  zone_id = var.cloudflare_zone_id
  name    = var.environment == "production" ? "app" : "app-staging"
  value   = "cname.vercel-dns.com"
  type    = "CNAME"
  proxied = true
}

# 5. Cloudflare WAF Firewalls Ruleset (OWASP Protection)
resource "cloudflare_ruleset" "waf_rules" {
  zone_id     = var.cloudflare_zone_id
  name        = "empire-waf-ruleset"
  description = "Block SQL Injection and suspicious user agents"
  kind        = "zone"
  phase       = "http_request_firewall_custom"

  rules {
    action      = "block"
    expression  = "(http.request.uri.path contains \"/api/\" and http.request.version ne \"HTTP/2\") or http.user_agent contains \"sqlmap\""
    description = "Block obsolete agents or SQLMap queries"
    enabled     = true
  }
}

# 6. Vercel Project Configuration
resource "vercel_project" "app_project" {
  name      = "empire-platform-${var.environment}"
  framework = "nextjs"
  git_repository = {
    type = "github"
    repo = "empire/empire"
  }
}

# 7. Vercel Project Environment Variables
resource "vercel_project_environment_variable" "database_url" {
  project_id = vercel_project.app_project.id
  key        = "DATABASE_URL"
  value      = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.database.endpoint}/empire?schema=public"
  target     = ["production", "preview", "development"]
}

resource "vercel_project_environment_variable" "redis_url" {
  project_id = vercel_project.app_project.id
  key        = "REDIS_URL"
  value      = var.redis_connection_url
  target     = ["production", "preview", "development"]
}

# 8. Stripe Webhook Endpoint Registration
resource "stripe_webhook_endpoint" "stripe_hook" {
  url = "https://${cloudflare_record.app_dns.hostname}/api/webhooks/stripe"
  enabled_events = [
    "checkout.session.completed",
    "customer.subscription.deleted"
  ]
}

# Variables Definitions
variable "vercel_api_token" { type = string; sensitive = true }
variable "cloudflare_api_token" { type = string; sensitive = true }
variable "cloudflare_account_id" { type = string }
variable "cloudflare_zone_id" { type = string }
variable "aws_access_key" { type = string; sensitive = true }
variable "aws_secret_key" { type = string; sensitive = true }
variable "aws_region" { type = string; default = "us-east-1" }
variable "environment" { type = string; default = "staging" }
variable "db_username" { type = string; default = "postgres" }
variable "db_password" { type = string; sensitive = true }
variable "redis_connection_url" { type = string; sensitive = true }
