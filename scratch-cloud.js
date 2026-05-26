import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: 'demo',
  api_key: '1234',
  api_secret: 'abcd'
});

const url = cloudinary.url('development/orcei/backups/backup-123.zip', {
  resource_type: 'raw',
  type: 'upload',
  sign_url: true,
  secure: true
});

console.log(url);
