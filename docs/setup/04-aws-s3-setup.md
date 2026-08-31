# Setup AWS S3 untuk WargaNet

Panduan langkah demi langkah menyiapkan AWS S3 sebagai file storage WargaNet.
Ikuti panduan ini sebelum mulai implementasi Phase 1 (§24 dari `implementation/aws-s3-storage.md`).

## Prerequisites

- Akun AWS (bisa pakai free-tier untuk mulai)
- AWS CLI terinstall (`aws --version`)
- Access key ID + Secret access key (dari IAM / Security Credentials)

---

## 1. Buat S3 Bucket

### Via AWS Console

1. Buka **S3 Console** → https://console.aws.amazon.com/s3/
2. Klik **Create bucket**
3. Isi:
   - **Bucket name:** `warganet-prod`
   - **AWS Region:** `Asia Pacific (Jakarta) ap-southeast-3`
4. **Block Public Access settings:**
   - ✅ Block all public access (semua ON, jangan diubah)
5. **Bucket Versioning:** ✅ Enable
6. **Default encryption:** ✅ Server-side encryption with Amazon S3 managed keys (SSE-S3)
7. Klik **Create bucket**

Ulangi untuk `warganet-dev` dan `warganet-staging` (ganti nama bucket).

### Via AWS CLI

```bash
# Production
aws s3api create-bucket \
  --bucket warganet-prod \
  --region ap-southeast-3 \
  --create-bucket-configuration LocationConstraint=ap-southeast-3

# Development
aws s3api create-bucket \
  --bucket warganet-dev \
  --region ap-southeast-3 \
  --create-bucket-configuration LocationConstraint=ap-southeast-3

# Staging
aws s3api create-bucket \
  --bucket warganet-staging \
  --region ap-southeast-3 \
  --create-bucket-configuration LocationConstraint=ap-southeast-3
```

### Aktifkan Versioning

```bash
for BUCKET in warganet-dev warganet-staging warganet-prod; do
  aws s3api put-bucket-versioning \
    --bucket "$BUCKET" \
    --versioning-configuration Status=Enabled
done
```

### Aktifkan Block Public Access

```bash
for BUCKET in warganet-dev warganet-staging warganet-prod; do
  aws s3api put-public-access-block \
    --bucket "$BUCKET" \
    --public-access-block-configuration \
      BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
done
```

### Aktifkan Default Encryption (SSE-S3)

```bash
for BUCKET in warganet-dev warganet-staging warganet-prod; do
  aws s3api put-bucket-encryption \
    --bucket "$BUCKET" \
    --server-side-encryption-configuration '{
      "Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}]
    }'
done
```

---

## 2. Bucket Policy (HTTPS Only)

Terapkan ke semua bucket — paksa HTTPS, tolak HTTP:

```bash
POLICY='{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyInsecureTransport",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::BUCKET_NAME",
        "arn:aws:s3:::BUCKET_NAME/*"
      ],
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    }
  ]
}'

# Ganti BUCKET_NAME lalu jalankan per bucket
aws s3api put-bucket-policy --bucket warganet-prod --policy "$POLICY"
```

---

## 3. CORS Configuration

```bash
CORS='{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://app.warganet.id"],
      "AllowedMethods": ["PUT", "GET", "HEAD"],
      "AllowedHeaders": ["Content-Type", "Content-Length", "Content-MD5", "x-amz-*"],
      "ExposeHeaders": ["ETag", "x-amz-request-id"],
      "MaxAgeSeconds": 3600
    }
  ]
}'

for BUCKET in warganet-dev warganet-staging warganet-prod; do
  aws s3api put-bucket-cors --bucket "$BUCKET" --cors-configuration "$CORS"
done
```

---

## 4. Lifecycle Policy

```bash
LIFECYCLE='{
  "Rules": [
    {
      "ID": "std-to-ia-after-90d",
      "Status": "Enabled",
      "Filter": {"Prefix": ""},
      "Transitions": [{"Days": 90, "StorageClass": "STANDARD_IA"}]
    },
    {
      "ID": "expire-noncurrent-30d",
      "Status": "Enabled",
      "Filter": {"Prefix": ""},
      "NoncurrentVersionExpiration": {"NoncurrentDays": 30}
    },
    {
      "ID": "abort-incomplete-multipart",
      "Status": "Enabled",
      "Filter": {"Prefix": ""},
      "AbortIncompleteMultipartUpload": {"DaysAfterInitiation": 7}
    }
  ]
}'

for BUCKET in warganet-dev warganet-staging warganet-prod; do
  aws s3api put-bucket-lifecycle-configuration --bucket "$BUCKET" --lifecycle-configuration "$LIFECYCLE"
done
```

---

## 5. IAM User & Policy

### Buat IAM Policy

Buat file `warganet-backend-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "BackendObjectOps",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:GetObjectAttributes",
        "s3:DeleteObject",
        "s3:AbortMultipartUpload",
        "s3:PutObjectTagging",
        "s3:GetObjectTagging",
        "s3:GetObjectVersion"
      ],
      "Resource": "arn:aws:s3:::warganet-*/*"
    },
    {
      "Sid": "BackendBucketOps",
      "Effect": "Allow",
      "Action": ["s3:ListBucket", "s3:GetBucketLocation"],
      "Resource": ["arn:aws:s3:::warganet-*"]
    }
  ]
}
```

> Policy menggunakan wildcard `warganet-*` agar berlaku untuk dev, staging, dan prod dengan satu policy.

### Buat IAM Policy via CLI

```bash
aws iam create-policy \
  --policy-name WargaNetBackendS3 \
  --policy-document file://warganet-backend-policy.json
```

### Buat IAM User

```bash
# Buat user
aws iam create-user --user-name warganet-backend

# Attach policy (ganti ARN dari output sebelumnya)
aws iam attach-user-policy \
  --user-name warganet-backend \
  --policy-arn arn:aws:iam::ACCOUNT_ID:policy/WargaNetBackendS3
```

### Buat Access Key

```bash
aws iam create-access-key --user-name warganet-backend
```

Output berisi `AccessKeyId` dan `SecretAccessKey`. **Simpan di Secret Manager / 1Password.** Jangan commit ke repository.

### Rotasi Key (rutin tiap 90 hari)

```bash
# 1. Buat key baru
aws iam create-access-key --user-name warganet-backend

# 2. Update .env di server dengan key baru

# 3. Hapus key lama
aws iam delete-access-key --user-name warganet-backend --access-key-id OLD_KEY_ID
```

---

## 6. Environment Variables

Tambahkan ke `apps/backend/.env` (dan `.env.example`):

```env
# === AWS S3 ===
AWS_REGION=ap-southeast-3
S3_BUCKET=warganet-prod
S3_PRESIGNED_UPLOAD_EXPIRES=300
S3_PRESIGNED_DOWNLOAD_EXPIRES=60

# VPS/Phase 1: gunakan access key
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...

# Development/Testing: arahkan ke MinIO/LocalStack (opsional)
# S3_ENDPOINT=http://localhost:9000
```

**Tidak perlu** `AWS_SESSION_TOKEN` untuk IAM user long-lived (kecuali pakai STS AssumeRole).

### Dev vs Prod

| Env | S3_BUCKET | S3_ENDPOINT | AWS_ACCESS_KEY_ID |
|---|---|---|---|
| `development` | `warganet-dev` | `http://localhost:9000` (MinIO) | MinIO keys |
| `staging` | `warganet-staging` | — | IAM key staging |
| `production` | `warganet-prod` | — | IAM key prod |

---

## 7. Local Development (MinIO)

MinIO adalah S3-compatible server untuk development lokal.

### Install via Docker

```bash
docker run -d \
  --name warganet-minio \
  -p 9000:9000 \
  -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin123 \
  minio/minio server /data --console-address ":9001"
```

### Buat Bucket di MinIO

```bash
# Install mc (MinIO Client)
# Atau pakai AWS CLI dengan endpoint MinIO:
aws --endpoint-url http://localhost:9000 \
  s3 mb s3://warganet-dev

aws --endpoint-url http://localhost:9000 \
  s3api put-public-access-block \
  --bucket warganet-dev \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```

### Konfigurasi `.env` untuk MinIO

```env
AWS_REGION=us-east-1
S3_BUCKET=warganet-dev
S3_ENDPOINT=http://localhost:9000
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin123
```

---

## 8. Setup CloudTrail (opsional, Phase 2)

CloudTrail memantau `s3:DeleteObject` untuk audit trail.

```bash
aws cloudtrail create-trail \
  --name warganet-prod \
  --s3-bucket-name warganet-prod-logs \
  --is-multi-region-trail false

aws cloudtrail start-logging --name warganet-prod
```

> **Catatan:** CloudTrail data events dikenakan biaya (~$0,10/100k events). Untuk MVP < 1k events/bulan, biaya < $0,01/bulan. Aktifkan di Phase 2, bukan MVP.

---

## 9. Setup CloudWatch Alarm (Phase 2)

Alarm untuk monitoring egress dan storage growth:

```bash
# Alarm: storage > 25GB
aws cloudwatch put-metric-alarm \
  --alarm-name "warganet-s3-storage-high" \
  --metric-name BucketSizeBytes \
  --namespace AWS/S3 \
  --statistic Average \
  --period 86400 \
  --threshold 26843545600 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=BucketName,Value=warganet-prod Name=StorageType,Value=StandardStorage

# Alarm: egress > 15GB/bulan (estimasi)
# Gunakan S3 Storage Lens atau Cost Anomaly Detection di AWS Console
```

---

## 10. Verifikasi Setup

Setelah semua konfigurasi, verifikasi dengan checklist:

```bash
# 1. Bucket exists & private
aws s3api head-bucket --bucket warganet-prod  # harus tidak error

# 2. Block public access
aws s3api get-public-access-block --bucket warganet-prod
# → semua true

# 3. Versioning
aws s3api get-bucket-versioning --bucket warganet-prod
# → Status: Enabled

# 4. Encryption
aws s3api get-bucket-encryption --bucket warganet-prod
# → SSEAlgorithm: AES256

# 5. CORS
aws s3api get-bucket-cors --bucket warganet-prod

# 6. Lifecycle
aws s3api get-bucket-lifecycle-configuration --bucket warganet-prod

# 7. Policy
aws s3api get-bucket-policy --bucket warganet-prod

# 8. IAM test — coba put object langsung
echo "test" > /tmp/test.txt
aws s3 cp /tmp/test.txt s3://warganet-prod/test/test.txt
aws s3 rm s3://warganet-prod/test/test.txt
```

### Checklist manual

- [ ] 3 bucket terbuat (dev, staging, prod)
- [ ] Block Public Access: semua ON
- [ ] Versioning: Enabled
- [ ] Default encryption: SSE-S3 (AES256)
- [ ] Bucket policy: HTTPS only
- [ ] CORS: origin terbatas
- [ ] Lifecycle: 3 rules (IA 90d, noncurrent 30d, abort multipart 7d)
- [ ] IAM user `warganet-backend` dengan policy least privilege
- [ ] Access key tersimpan aman (bukan di repo)
- [ ] `.env.example` diupdate dengan `S3_*` vars
- [ ] MinIO berjalan untuk local dev (opsional)
- [ ] Test upload/download via CLI berhasil

---

## Troubleshooting

| Masalah | Solusi |
|---|---|
| `AccessDenied` saat put object | Cek IAM policy; pastikan key belongs ke user yang benar |
| `NoSuchBucket` | Cek `AWS_REGION` — bucket name harus global, region harus benar |
| CORS error di browser | Cek CORS config; pastikan `AllowedOrigins` sesuai frontend URL |
| Presigned URL `403` | Pastikan credential region & bucket region sama; cek clock sync |
| Presigned URL expired | Normal — cek `S3_PRESIGNED_UPLOAD_EXPIRES` (default 300 detik) |
| MinIO tidak bisa diakses | Cek port 9000/9001, firewall, atau `-e MINIO_ROOT_USER` |

---

## Referensi

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [S3 Presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/presigned-urls.html)
- [IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [MinIO Documentation](https://min.io/docs/)
- [Implementation Plan](../implementation/aws-s3-storage.md) — rencana lengkap
